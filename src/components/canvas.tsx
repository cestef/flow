import {
	UPDATE_THROTTLE,
	edgeTypes,
	flowSelector,
	nodeTypes,
} from "@/lib/constants";
import { getHelperLines, isNodeInGroupBounds, trpc } from "@/lib/utils";
import { useCallback, useEffect, useRef } from "react";
import {
	Connection,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	useReactFlow,
} from "reactflow";
import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";

import { useStore } from "@/lib/store";
import { subscribe } from "@/lib/subscriptions";
import { useSearchParams } from "next/navigation";
import { throttle } from "throttle-debounce";
import CanvasContext from "./canvas-context";
import HelperLines from "./helper-lines";

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
		const positionChanges = nodeChanges.filter(
			(change) =>
				change.type === "position" && change.position && change.dragging,
		) as NodePositionChange[];
		updateNodePositionThrottled(positionChanges);
		for (const change of nodeChanges) {
			if (change.type === "remove") {
				deleteNode.mutate({ id: change.id });
			}
		}
		onNodesChange(nodeChanges);
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
		[setNodes],
	);

	const onNodeDragStop = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>((_, node) => {
		setNodes(
			nodes.map((n) => {
				if (
					n.type === "customGroup" &&
					n.className?.includes("border-primary")
				) {
					n.className = "transition-colors duration-200 ease-in-out rounded-md";
					return n;
				}
				return n;
			}),
		);
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
	}, []);

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
	const { snapToGrid, setSnapToGrid, snapLines, setSnapLines } = useStore(
		(state) => ({
			snapToGrid: state.snapToGrid,
			setSnapToGrid: state.setSnapToGrid,
			snapLines: state.snapLines,
			setSnapLines: state.setSnapLines,
		}),
	);

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

	const { project } = useReactFlow();

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
			<CanvasContext>
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
			</CanvasContext>
		</div>
	);
};

export default Flow;
