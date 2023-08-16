import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";
import {
	Connection,
	Edge,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	addEdge,
	getConnectedEdges,
	getIncomers,
	getOutgoers,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "reactflow";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Plus, TextCursorInput, Trash } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import CustomNode from "@/components/themed-node";
import { throttle } from "throttle-debounce";
import { trpc } from "@/lib/utils";
import useConfirm from "@/lib/useConfirm";
import { useSession } from "next-auth/react";
import { useStore } from "@/store";

const nodeTypes = {
	custom: CustomNode,
};

const Flow = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const { data: session } = useSession();
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const canvasId = useStore((state) => state.currentCanvasId);
	const currentCanvas = trpc.canvas.get.useQuery({ id: canvasId });
	const remoteNodes = trpc.nodes.list.useQuery({ canvasId });
	const remoteEdges = trpc.edges.list.useQuery({ canvasId });

	useEffect(() => {
		if (remoteNodes.data) {
			setNodes(
				remoteNodes.data.map((node) => ({
					id: node.id,
					type: node.type,
					data: { label: node.name },
					position: { x: node.x, y: node.y },
				})),
			);
		}
	}, [remoteNodes.data]);

	useEffect(() => {
		if (remoteEdges.data) {
			setEdges(
				remoteEdges.data.map((edge) => ({
					id: edge.id,
					source: edge.fromId,
					target: edge.toId,
					type: edge.type,
				})),
			);
		}
	}, [remoteEdges.data]);

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			const newEdges = addEdge(params, edges);
			setEdges(newEdges);
			const newEdge = newEdges.find(
				(edge) =>
					edge.source === params.source && edge.target === params.target,
			);
			if (!newEdge) return console.log("No edge found");
			addEdgeM.mutate({
				canvasId,
				id: newEdge.id,
				from: newEdge.source,
				to: newEdge.target,
				type: newEdge.type || "default",
			});
		},
		[edges],
	);

	const deleteNode = trpc.nodes.delete.useMutation();

	const onNodesDelete = useCallback(
		(deleted: Node[]) => {
			setEdges(
				deleted.reduce((acc, node) => {
					const incomers = getIncomers(node, nodes, edges);
					const outgoers = getOutgoers(node, nodes, edges);
					const connectedEdges = getConnectedEdges([node], edges);

					const remainingEdges = acc.filter(
						(edge) => !connectedEdges.includes(edge),
					);

					const createdEdges = incomers.flatMap(({ id: source }) =>
						outgoers.map(({ id: target }) => ({
							id: `${source}->${target}`,
							source,
							target,
						})),
					);

					return [...remainingEdges, ...createdEdges];
				}, edges),
			);
		},
		[nodes, edges],
	);

	const dragUpdateNode = trpc.nodes.dragUpdate.useMutation();
	const updateNode = trpc.nodes.update.useMutation();

	const updateNodePositionThrottled = useCallback(
		throttle(10, (change: NodePositionChange) => {
			dragUpdateNode.mutate({
				id: change.id,
				x: change.position!.x,
				y: change.position!.y,
			});
		}),
		[],
	);

	const onNodesChangeProxy = (nodeChanges: NodeChange[]) => {
		for (const change of nodeChanges) {
			if (change.type === "position") {
				if (!change.position || !change.dragging) return;
				updateNodePositionThrottled(change);
			}
			if (change.type === "remove") {
				deleteNode.mutate({ id: change.id });
			}
		}
		onNodesChange(nodeChanges);
	};

	const dragEndNode = trpc.nodes.dragEnd.useMutation();

	const onNodeDragStop = (
		event: React.MouseEvent,
		node: Node,
		nodes: Node[],
	) => {
		dragEndNode.mutate({
			id: node.id,
			x: node.position.x,
			y: node.position.y,
		});
	};

	const addEdgeM = trpc.edges.add.useMutation();
	const removeEdge = trpc.edges.delete.useMutation();

	const onConnectProxy = (edge: Edge | Connection) => {
		if (edge.source === edge.target || !edge.source || !edge.target) {
			return;
		}

		onConnect(edge);
	};

	const onEdgesChangeProxy = (edgeChanges: EdgeChange[]) => {
		onEdgesChange(edgeChanges);
		for (const change of edgeChanges) {
			if (change.type === "remove") {
				removeEdge.mutate({
					id: change.id,
				});
			}
		}
	};

	const createNode = trpc.nodes.add.useMutation();

	trpc.nodes.onAdd.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {
				if (nodes.find((n) => n.id === node.id)) return;
				setNodes((nodes) => [
					...nodes,
					{
						id: node.id,
						type: node.type,
						data: { label: node.name },
						position: { x: node.x, y: node.y },
					},
				]);
			},
			onError(err) {
				console.log(err);
			},
		},
	);
	trpc.nodes.onUpdate.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {
				setNodes((nodes) =>
					nodes.map((n) => {
						if (n.id === node.id) {
							return {
								...n,
								position: {
									x: node.x,
									y: node.y,
								},
							};
						}
						return n;
					}),
				);
			},
			onError(err) {
				console.log(err);
			},
		},
	);
	trpc.nodes.onDelete.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {
				setNodes((nodes) => nodes.filter((n) => n.id !== node.id));
			},
			onError(err) {
				console.log(err);
			},
		},
	);

	trpc.nodes.onDragStart.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {},
		},
	);
	trpc.nodes.onDragUpdate.useSubscription(
		{
			canvasId,
		},
		{
			async onData({ node, userId }) {
				if (userId === session?.user.id) return;
				// Update node position
				setNodes((nodes) =>
					nodes.map((n) => {
						if (n.id === node.id) {
							// console.log(n.position, { x: node.x, y: node.y });
							return {
								...n,
								position: {
									x: node.x,
									y: node.y,
								},
							};
						}
						return n;
					}),
				);
			},
		},
	);
	trpc.nodes.onDragEnd.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {},
		},
	);

	trpc.edges.onAdd.useSubscription(
		{
			canvasId,
		},
		{
			async onData({ edge, userId }) {
				if (userId === session?.user.id) return;
				if (edges.find((e) => e.id === edge.id)) return;
				setEdges((edges) => [
					...edges,
					{
						id: edge.id,
						source: edge.fromId,
						target: edge.toId,
					},
				]);
			},
			onError(err) {
				console.log(err);
			},
		},
	);
	trpc.edges.onDelete.useSubscription(
		{
			canvasId,
		},
		{
			async onData({ edge, userId }) {
				if (userId === session?.user.id) return;
				setEdges((edges) => edges.filter((e) => e.id !== edge.id));
			},
			onError(err) {
				console.log(err);
			},
		},
	);

	trpc.canvas.onClear.useSubscription(undefined, {
		async onData() {
			setEdges([]);
			setNodes([]);
		},
		onError(err) {
			console.log(err);
		},
	});

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const clearCanvas = trpc.canvas.clear.useMutation();
	const { project } = useReactFlow();
	const { confirm, modal } = useConfirm();
	return (
		<div
			ref={reactFlowWrapper}
			className="flex-grow h-full"
			onContextMenu={(event) => {
				const targetIsPane = (event.target as any).classList.contains(
					"react-flow__pane",
				);

				if (targetIsPane) {
					// we need to remove the wrapper bounds, in order to get the correct position
					const { right, bottom, top, left } =
						reactFlowWrapper.current!.getBoundingClientRect();
					const position = project({
						x: event.clientX - left,
						y: event.clientY - top,
					});
					setContextMenuPosition(position.x, position.y);
				}
			}}
		>
			{modal}
			<ContextMenu>
				<ContextMenuTrigger>
					<ReactFlowStyled
						nodes={nodes}
						edges={edges}
						onNodesChange={onNodesChangeProxy}
						onNodeDragStop={onNodeDragStop}
						onEdgesChange={onEdgesChangeProxy}
						onConnect={onConnectProxy}
						onNodesDelete={onNodesDelete}
						nodeTypes={nodeTypes}
						fitView
						proOptions={{
							hideAttribution: true,
						}}
						className="h-full"
					>
						{/* <MiniMapStyled /> */}
						{/* <ControlsStyled position="bottom-right" /> */}
						<BackgroundStyled />

						{children}
					</ReactFlowStyled>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuSub>
						<ContextMenuSubTrigger>
							<Plus className="mr-2 w-4 h-4" />
							Add node
						</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Default",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: "default",
									});
								}}
							>
								Default
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Input",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: "input",
									});
								}}
							>
								Input
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Custom",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: "custom",
									});
								}}
							>
								Custom
							</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuItem
						onClick={async () => {
							const result = await confirm(
								"Are you sure you want to clear the canvas? This action cannot be undone.",
							);
							if (!result) return;
							clearCanvas.mutate({ id: canvasId });
						}}
					>
						<Trash className="mr-2 w-4 h-4" />
						Clear canvas
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
};

export default Flow;
