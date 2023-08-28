import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";
import {
	Connection,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	useKeyPress,
	useReactFlow,
} from "reactflow";
import {
	UPDATE_THROTTLE,
	edgeTypes,
	flowSelector,
	nodeTypes,
} from "@/lib/constants";
import {
	formatRemoteData,
	getHelperLines,
	isNodeInGroupBounds,
	trcpProxyClient,
	trpc,
} from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";

import CanvasContext from "./canvas-context";
import HelperLines from "./helper-lines";
import Selecto from "react-selecto";
import { subscribe } from "@/lib/subscriptions";
import { throttle } from "throttle-debounce";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";

const Flow = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		setNodes,
		setEdges,
		updateNode,
		getNode,
		findAndUpdateNode,
	} = useStore(flowSelector);

	const search = useSearchParams();
	const setCurrentCanvasId = useStore((state) => state.setCurrentCanvasId);
	useEffect(() => {
		const canvasId = search.get("canvasId");
		if (canvasId) {
			setCurrentCanvasId(canvasId);
		}
	}, [search]);

	const canvasId = useStore((state) => state.currentCanvasId);

	const remoteNodes = trpc.nodes.list.useQuery({ canvasId });
	const remoteEdges = trpc.edges.list.useQuery({ canvasId });

	useEffect(() => {
		if (remoteNodes.data) {
			setNodes(formatRemoteData(remoteNodes.data, true));
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

	const onConnectProxy = useCallback(
		(params: Connection) => {
			const newEdge = onConnect(params);
			if (!newEdge) return console.log("No edge found");
			addEdgeM.mutate({
				canvasId,
				id: newEdge.id,
				from: newEdge.source,
				to: newEdge.target,
				type: newEdge.type || "default",
			});
		},
		[edges, canvasId],
	);

	const deleteNode = trpc.nodes.delete.useMutation();

	const dragUpdateNode = trpc.nodes.dragUpdate.useMutation();
	const MupdateNode = trpc.nodes.update.useMutation();

	const updateNodePositionThrottled = useCallback(
		throttle(UPDATE_THROTTLE, (changes: NodePositionChange[]) => {
			dragUpdateNode.mutate({
				changes: changes.map((change) => ({
					id: change.id,
					x: change.position!.x,
					y: change.position!.y,
				})),
			});
		}),
		[nodes],
	);

	const { setHelperLineHorizontal, setHelperLineVertical } = useStore(
		(state) => ({
			setHelperLineHorizontal: state.setHelperLineHorizontal,
			setHelperLineVertical: state.setHelperLineVertical,
		}),
	);

	const onNodesChangeProxy = (nodeChanges: NodeChange[]) => {
		setHelperLineHorizontal(undefined);
		setHelperLineVertical(undefined);
		if (
			nodeChanges.length === 1 &&
			nodeChanges[0].type === "position" &&
			nodeChanges[0].dragging &&
			nodeChanges[0].position &&
			ctrlDown
		) {
			const helperLines = getHelperLines(nodeChanges[0], nodes);

			// if we have a helper line, we snap the node to the helper line position
			// this is being done by manipulating the node position inside the change object
			nodeChanges[0].position.x =
				helperLines.snapPosition.x ?? nodeChanges[0].position.x;
			nodeChanges[0].position.y =
				helperLines.snapPosition.y ?? nodeChanges[0].position.y;

			// if helper lines are returned, we set them so that they can be displayed
			setHelperLineHorizontal(helperLines.horizontal);
			setHelperLineVertical(helperLines.vertical);
		}
		const positionChanges = nodeChanges.filter(
			(change) =>
				change.type === "position" && change.position && change.dragging,
		) as NodePositionChange[];
		if (shouldEmit) updateNodePositionThrottled(positionChanges);
		for (const change of nodeChanges) {
			if (change.type === "remove") {
				deleteNode.mutate({ id: change.id });
			}
		}
		onNodesChange(
			nodeChanges.filter((change) =>
				selectedBrush === "select" ? change.type !== "select" : true,
			),
		);
	};

	const dragEndNode = trpc.nodes.dragEnd.useMutation();

	const onNodeDrag = useCallback<(event: React.MouseEvent, node: Node) => void>(
		(_, node) => {
			const group = isNodeInGroupBounds(node, nodes);
			if (group) {
				findAndUpdateNode(
					(n) => n.id === group.id,
					(n) => ({
						...n,
						className:
							"transition-colors duration-200 ease-in-out dark:bg-[rgba(255,255,255,0.2)] bg-[rgba(0,0,0,0.2)] rounded-md border-primary",
					}),
				);
			} else {
				findAndUpdateNode(
					(n) =>
						!!(
							n.type === "customGroup" &&
							n.className?.includes("border-primary")
						),
					(n) => ({
						...n,
						className: "transition-colors duration-200 ease-in-out rounded-md",
					}),
				);
			}
		},
		[nodes],
	);

	const setShouldEmit = useStore((state) => state.setShouldEmit);
	const shouldEmit = useStore((state) => state.shouldEmit);
	const onNodeDragStart = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>(
		async (_, node) => {
			const should = await trcpProxyClient.nodes.shouldEmit.query({
				canvasId,
			});
			setShouldEmit(should);
		},
		[canvasId],
	);

	const onNodeDragStop = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>(
		(_, node) => {
			findAndUpdateNode(
				(n) =>
					!!(
						n.type === "customGroup" && n.className?.includes("border-primary")
					),
				(n) => ({
					...n,
					className: "transition-colors duration-200 ease-in-out rounded-md",
				}),
			);
			const selectedNodes = nodes.filter((n) => n.selected);
			console.log(selectedNodes);
			for (const node of selectedNodes) {
				const group = isNodeInGroupBounds(node, nodes);
				if (group) {
					const relativePosition = {
						x: node.position.x - group.position.x,
						y: node.position.y - group.position.y,
					};
					MupdateNode.mutate({
						id: node.id,
						parentId: group.id,
						x: relativePosition.x,
						y: relativePosition.y,
					});
					updateNode({
						id: node.id,
						parentNode: group.id,
						extent: "parent",
						position: relativePosition,
					});
				}

				updateNode({
					id: node.id,
					data: {
						...node.data,
						debouncedPosition: {
							x: node.position.x,
							y: node.position.y,
						},
					},
				});
				dragEndNode.mutate({
					id: node.id,
					x: node.position.x,
					y: node.position.y,
				});
			}
		},
		[nodes],
	);

	const addEdgeM = trpc.edges.add.useMutation();
	const removeEdge = trpc.edges.delete.useMutation();

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

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);

	const shiftDown = useKeyPress("Shift");
	const ctrlDown = useKeyPress("Control");

	const { project } = useReactFlow();

	const helperLineHorizontal = useStore((state) => state.helperLineHorizontal);
	const helperLineVertical = useStore((state) => state.helperLineVertical);

	const selectedBrush = useStore((state) => state.selectedBrush);
	const deleteManyNodes = trpc.nodes.deleteMany.useMutation();
	const deleteManyEdges = trpc.edges.deleteMany.useMutation();
	const updateManyNodes = trpc.nodes.updateMany.useMutation();

	const onNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			const selectedNodes = nodes.filter((n) => n.selected);
			const selectedEdges = edges.filter((e) => e.selected);
			if (
				selectedBrush === "delete" &&
				(selectedNodes.length > 0 || selectedEdges.length > 0)
			) {
				const nodeIds = selectedNodes.map((node) => node.id);
				const edgeIds = selectedEdges.map((edge) => edge.id);
				const edges = useStore.getState().edges;
				const connectedEdgesIds = edges
					.filter((edge) => {
						return (
							nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
						);
					})
					.map((edge) => edge.id);
				const nodes = useStore.getState().nodes;
				const childrenNodesIds = nodes
					.filter((e) => nodeIds.includes(e.parentNode || ""))
					.map((e) => e.id);
				findAndUpdateNode(
					(n) => nodeIds.includes(n.parentNode || ""),
					(n) => ({
						...n,
						parentNode: undefined,
					}),
				);
				updateManyNodes.mutate({
					nodes: childrenNodesIds.map((node) => ({
						id: node,
						parentId: null,
					})),
				});
				deleteManyNodes.mutate({ ids: nodeIds });
				deleteManyEdges.mutate({ ids: [...edgeIds, ...connectedEdgesIds] });
				return;
			}
		},
		[nodes],
	);
	subscribe();

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
			<CanvasContext>
				<ReactFlowStyled
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChangeProxy}
					onNodeDragStop={onNodeDragStop}
					onNodeDragStart={onNodeDragStart}
					onNodeDrag={onNodeDrag}
					onEdgesChange={onEdgesChangeProxy}
					onNodeClick={onNodeClick}
					onConnect={onConnectProxy}
					snapToGrid={shiftDown}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					proOptions={{
						hideAttribution: true,
					}}
					className="h-full"
					panOnDrag={["pointer", "delete", undefined].includes(selectedBrush)}
				>
					<BackgroundStyled />
					<HelperLines
						horizontal={helperLineHorizontal}
						vertical={helperLineVertical}
					/>
					{children}
				</ReactFlowStyled>
			</CanvasContext>
			{selectedBrush === "select" && (
				<Selecto
					selectableTargets={[".react-flow__node"]}
					hitRate={50}
					onSelect={(e) => {
						const addedIds = e.added
							.map((el) => el.getAttribute("data-id"))
							.filter(Boolean) as string[];
						const removedIds = e.removed
							.map((el) => el.getAttribute("data-id"))
							.filter(Boolean) as string[];

						onNodesChange(
							addedIds.map((id) => ({
								id,
								type: "select",
								selected: true,
							})),
						);

						onNodesChange(
							removedIds.map((id) => ({
								id,
								type: "select",
								selected: false,
							})),
						);
					}}
					onSelectEnd={(e) => {
						onNodesChange(
							e.selected.map((el) => ({
								id: el.id,
								type: "select",
								selected: true,
							})),
						);
					}}
				/>
			)}
		</div>
	);
};

export default Flow;
