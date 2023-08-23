import DefaultNode, { NODES_TYPES } from "@/components/nodes/default-node";
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
import { StoreState, useStore } from "@/lib/store";
import { getHelperLines, trpc } from "@/lib/utils";
import { Group, Shapes, Trash, Workflow } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import {
	Connection,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	useReactFlow,
} from "reactflow";
import ShapeNode, { SHAPES } from "./nodes/shape-node";
import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";

import GroupNode from "@/components/nodes/group-node";
import { subscribe } from "@/lib/subscriptions";
import useConfirm from "@/lib/useConfirm";
import { useSearchParams } from "next/navigation";
import { throttle } from "throttle-debounce";
import DefaultEdge from "./edges/default-edge";
import HelperLines from "./helper-lines";

const nodeTypes = {
	customGroup: GroupNode,
	[NODES_TYPES.DEFAULT]: DefaultNode,
	[NODES_TYPES.INPUT]: DefaultNode,
	[NODES_TYPES.OUTPUT]: DefaultNode,
	[SHAPES.CIRCLE]: ShapeNode,
	[SHAPES.RECTANGLE]: ShapeNode,
	[SHAPES.ROUNDED_RECTANGLE]: ShapeNode,
	[SHAPES.TRIANGLE]: ShapeNode,
	[SHAPES.DIAMOND]: ShapeNode,
	[SHAPES.PARALLELOGRAM]: ShapeNode,
};

const edgeTypes = {
	customDefault: DefaultEdge,
};

export const EDGE_TYPES = {
	DEFAULT: "customDefault",
};

const UPDATE_THROTTLE = 100;
const DEBOUNCE_THROTTLE = 500;

export const flowSelector = (state: StoreState) => ({
	nodes: state.nodes,
	edges: state.edges,
	setNodes: state.setNodes,
	setEdges: state.setEdges,
	onNodesChange: state.onNodesChange,
	onEdgesChange: state.onEdgesChange,
	onConnect: state.onConnect,
	updateNode: state.updateNode,
	addNode: state.addNode,
	findNode: state.findNode,
	deleteNode: state.deleteNode,
	addEdge: state.addEdge,
	deleteEdge: state.deleteEdge,
	findAndUpdateNode: state.findAndUpdateNode,
	// updateEdge: state.updateEdge,
});

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
						data: {
							label: node.name,
							color: node.color,
							debouncedPosition: {
								x: node.x,
								y: node.y,
							},
						},
						position: { x: node.x, y: node.y },
						...((node.width || node.height) && {
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

	const onConnectProxy = useCallback(
		(params: Connection) => {
			onConnect(params);
			const newEdge = edges.find(
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

	const dragUpdateNode = trpc.nodes.dragUpdate.useMutation();
	const MupdateNode = trpc.nodes.update.useMutation();

	const updateNodePositionThrottled = useCallback(
		throttle(UPDATE_THROTTLE, (change: NodePositionChange) => {
			dragUpdateNode.mutate({
				id: change.id,
				x: change.position!.x,
				y: change.position!.y,
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
			snapLines
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
		[inGroup, setNodes],
	);

	const onNodeDragStop = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>(
		(_, node) => {
			setNodes(
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
				MupdateNode.mutate({
					id: node.id,
					parentId: group.id,
					x: relativePosition.x,
					y: relativePosition.y,
				});
				setNodes(
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
		},
		[inGroup],
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

	const createNode = trpc.nodes.add.useMutation();

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const snapToGrid = useStore((state) => state.snapToGrid);
	const setSnapToGrid = useStore((state) => state.setSnapToGrid);
	const snapLines = useStore((state) => state.snapLines);
	const setSnapLines = useStore((state) => state.setSnapLines);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setSnapToGrid(true);
			}
			if (e.key === "Control") {
				setSnapLines(true);
			}
		};
		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key === "Shift") {
				setSnapToGrid(false);
			}
			if (e.key === "Control") {
				setSnapLines(false);
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

	const helperLineHorizontal = useStore((state) => state.helperLineHorizontal);
	const helperLineVertical = useStore((state) => state.helperLineVertical);

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
						snapToGrid={snapToGrid}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						fitView
						proOptions={{
							hideAttribution: true,
						}}
						className="h-full"
					>
						{/* <MiniMapStyled /> */}
						{/* <ControlsStyled position="bottom-right" /> */}
						<BackgroundStyled />
						<HelperLines
							horizontal={helperLineHorizontal}
							vertical={helperLineVertical}
						/>
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
										type: NODES_TYPES.DEFAULT,
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
										type: NODES_TYPES.INPUT,
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
										name: "Output",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: NODES_TYPES.OUTPUT,
									});
								}}
							>
								Output
							</ContextMenuItem>
							<ContextMenuSub>
								<ContextMenuSubTrigger>
									<Shapes className="mr-2 w-4 h-4" />
									Shapes
								</ContextMenuSubTrigger>
								<ContextMenuSubContent>
									<ContextMenuItem
										inset
										onClick={() => {
											createNode.mutate({
												canvasId,
												name: "Rectangle",
												x: contextMenuPosition.x,
												y: contextMenuPosition.y,
												type: SHAPES.RECTANGLE,
												height: 100,
												width: 200,
											});
										}}
									>
										Rectangle
									</ContextMenuItem>
									<ContextMenuItem
										inset
										onClick={() => {
											createNode.mutate({
												canvasId,
												name: "Rounded Rectangle",
												x: contextMenuPosition.x,
												y: contextMenuPosition.y,
												type: SHAPES.ROUNDED_RECTANGLE,
												height: 100,
												width: 200,
											});
										}}
									>
										Rounded Rectangle
									</ContextMenuItem>
									<ContextMenuItem
										inset
										onClick={() => {
											createNode.mutate({
												canvasId,
												name: "Circle",
												x: contextMenuPosition.x,
												y: contextMenuPosition.y,
												type: SHAPES.CIRCLE,
												height: 100,
												width: 100,
											});
										}}
									>
										Circle
									</ContextMenuItem>
									<ContextMenuItem
										inset
										onClick={() => {
											createNode.mutate({
												canvasId,
												name: "Diamond",
												x: contextMenuPosition.x,
												y: contextMenuPosition.y,
												type: SHAPES.DIAMOND,
												height: 100,
												width: 100,
											});
										}}
									>
										Diamond
									</ContextMenuItem>
									<ContextMenuItem
										inset
										onClick={() => {
											createNode.mutate({
												canvasId,
												name: "Parallelogram",
												x: contextMenuPosition.x,
												y: contextMenuPosition.y,
												type: SHAPES.PARALLELOGRAM,
												height: 100,
												width: 200,
											});
										}}
									>
										Parallelogram
									</ContextMenuItem>
								</ContextMenuSubContent>
							</ContextMenuSub>
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuItem
						onClick={() => {
							createNode.mutate({
								canvasId,
								name: "Group",
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
