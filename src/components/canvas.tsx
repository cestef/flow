import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Group, Trash, Workflow } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
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
import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";

import GroupNode from "@/components/group-node";
import CustomNode from "@/components/themed-node";
import useConfirm from "@/lib/useConfirm";
import { trpc } from "@/lib/utils";
import { useStore } from "@/store";
import { useSession } from "next-auth/react";
import { throttle } from "throttle-debounce";

const nodeTypes = {
	custom: CustomNode,
	customGroup: GroupNode,
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
	const remoteNodes = trpc.nodes.list.useQuery({ canvasId });
	const remoteEdges = trpc.edges.list.useQuery({ canvasId });
	// const store = useStoreApi();

	const inGroup = useCallback(
		(node: Node) => {
			if (node.parentNode) return null;
			// if (node.type === "customGroup") return null;
			return nodes
				.filter((e) => e.type === "customGroup")
				.find((group) => {
					const nodePos = node.position;
					const groupPos = group.position;
					const groupWidth = group.style?.width || group.width || 0;
					const groupHeight = group.style?.height || group.height || 0;
					const nodeWidth = node.style?.width || node.width || 0;
					const nodeHeight = node.style?.height || node.height || 0;

					return (
						nodePos.x > groupPos.x &&
						nodePos.x + +nodeWidth < groupPos.x + +groupWidth &&
						nodePos.y > groupPos.y &&
						nodePos.y + +nodeHeight < groupPos.y + +groupHeight
					);
				});
		},
		[nodes],
	);

	useEffect(() => {
		if (remoteNodes.data) {
			setNodes(
				remoteNodes.data
					.map((node) => ({
						id: node.id,
						type: node.type,
						data: { label: node.name },
						position: { x: node.x, y: node.y },
						...(node.type === "customGroup" && {
							style: {
								width: node.width!,
								height: node.height!,
							},
						}),
						parentNode: node.parentId || undefined,
						extent: node.parentId ? "parent" : undefined,
					}))
					.sort((a, b) => {
						if (a.type === "customGroup" && b.type !== "customGroup") return -1;
						if (a.type !== "customGroup" && b.type === "customGroup") return 1;
						return 0;
					}) as any,
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

	const onNodeDrag = useCallback<(event: React.MouseEvent, node: Node) => void>(
		(_, node) => {
			const group = inGroup(node);
			if (group) {
				setNodes((nodes) =>
					nodes.map((n) => {
						if (n.id === group.id && !n.className?.includes("border-primary")) {
							n.className =
								"transition-colors duration-200 ease-in-out dark:bg-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.2)] rounded-md border-primary";
							return n;
						}
						return n;
					}),
				);
			} else {
				setNodes((nodes) =>
					nodes.map((n) => {
						if (
							n.type === "customGroup" &&
							n.className?.includes("border-primary")
						) {
							n.className =
								"transition-colors duration-200 ease-in-out rounded-md";
							return n;
						}
						return n;
					}),
				);
			}
		},
		[inGroup, setNodes],
	);

	const onNodeDragStop = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>(
		(_, node) => {
			setNodes((nodes) =>
				nodes.map((n) => {
					if (
						n.type === "customGroup" &&
						n.className?.includes("border-primary")
					) {
						n.className =
							"transition-colors duration-200 ease-in-out rounded-md";
						return n;
					}
					return n;
				}),
			);
			const group = inGroup(node);
			if (group) {
				const relativePosition = {
					x: node.position.x - group.position.x,
					y: node.position.y - group.position.y,
				};
				updateNode.mutate({
					id: node.id,
					parentId: group.id,
					x: relativePosition.x,
					y: relativePosition.y,
				});
				setNodes((nodes) =>
					nodes.map((n) => {
						if (n.id === node.id) {
							return {
								...n,
								parentNode: group.id,
								extent: "parent",
								position: relativePosition,
							};
						}
						return n;
					}),
				);
			}
			dragEndNode.mutate({
				id: node.id,
				x: node.position.x,
				y: node.position.y,
			});
		},
		[inGroup],
	);

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
						...(node.type === "customGroup" && {
							style: {
								width: node.width!,
								height: node.height!,
							},
						}),
						parentNode: node.parentId || undefined,
						extent: node.parentId ? "parent" : undefined,
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
								...(node.type === "customGroup" && {
									style: {
										width: node.width!,
										height: node.height!,
									},
								}),
								parentNode: node.parentId || undefined,
								extent: node.parentId ? "parent" : undefined,
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
				if (node.type === "customGroup") {
					setNodes((nodes) =>
						nodes.map((n) => {
							if (n.parentNode === node.id) {
								return {
									...n,
									parentNode: undefined,
									extent: undefined,
									position: {
										x: n.position.x + node.x,
										y: n.position.y + node.y,
									},
								};
							}
							return n;
						}),
					);
				}
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
	const snapToGrid = useStore((state) => state.snapToGrid);
	const setSnapToGrid = useStore((state) => state.setSnapToGrid);
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setSnapToGrid(true);
			}
		};
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setSnapToGrid(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, []);
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
					console.log(event);
					// we need to remove the wrapper bounds, in order to get the correct position
					const { top, left } =
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
						onNodeDrag={onNodeDrag}
						onEdgesChange={onEdgesChangeProxy}
						onConnect={onConnectProxy}
						onNodesDelete={onNodesDelete}
						nodeTypes={nodeTypes}
						snapToGrid={snapToGrid}
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
							<Workflow className="mr-2 w-4 h-4" />
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
						onClick={() => {
							createNode.mutate({
								canvasId,
								name: "customGroup",
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
								type: "customGroup",
							});
						}}
					>
						<Group className="mr-2 w-4 h-4" />
						Add Group
					</ContextMenuItem>
					<ContextMenuSeparator />
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
