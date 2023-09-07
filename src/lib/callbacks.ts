import {
	Connection,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	OnConnectStartParams,
	useKeyPress,
	useReactFlow,
	useStore as useStoreFlow,
} from "reactflow";
import {
	DEEFAULT_NODE_DIMENSIONS,
	EDGES_TYPES,
	NODES_TYPES,
	UPDATE_THROTTLE,
	flowSelector,
} from "./constants";
import {
	getHelperLines,
	isNodeInGroupBounds,
	trcpProxyClient,
	trpc,
} from "./utils";

import { useSession } from "next-auth/react";
import { RefObject, useCallback, useRef } from "react";
import { throttle } from "throttle-debounce";
import { useStore } from "./store";

export const registerCallbacks = (
	reactFlowWrapper: RefObject<HTMLDivElement>,
) => {
	const {
		nodes,
		findAndUpdateNode,
		updateNode,
		edges,
		onEdgesChange,
		onNodesChange,
		onConnect,
	} = useStore(flowSelector);
	const currentConnecting = useRef<OnConnectStartParams | null>(null);
	const canvasId = useStore((state) => state.currentCanvasId);
	const [shouldEmit, setShouldEmit] = useStore((state) => [
		state.shouldEmit,
		state.setShouldEmit,
	]);
	const [helperLineHorizontal, setHelperLineHorizontal] = useStore((state) => [
		state.helperLineHorizontal,
		state.setHelperLineHorizontal,
	]);
	const [helperLineVertical, setHelperLineVertical] = useStore((state) => [
		state.helperLineVertical,
		state.setHelperLineVertical,
	]);

	const { data: session } = useSession();

	const MupdateNode = trpc.nodes.update.useMutation();
	const MaddEdge = trpc.edges.add.useMutation({
		onSuccess: (data) => {
			onConnect({
				id: data.id,
				source: data.fromId,
				target: data.toId,
				type: data.type,
				sourceHandle: data.fromHandleId,
				targetHandle: data.toHandleId,
			});
		},
	});
	const addNode = trpc.nodes.add.useMutation({
		onSuccess: (data) => {
			if (currentConnecting.current) {
				const shouldCreateTarget =
					currentConnecting.current.handleType === "source";
				const fromHandle = shouldCreateTarget
					? currentConnecting.current.handleId!
					: data.handles[0].id;
				const toHandle = shouldCreateTarget
					? data.handles[0].id
					: currentConnecting.current.handleId!;
				const from = shouldCreateTarget
					? currentConnecting.current.nodeId!
					: data.id;
				const to = shouldCreateTarget
					? data.id
					: currentConnecting.current.nodeId!;
				MaddEdge.mutate({
					canvasId,
					from,
					to,
					fromHandle,
					toHandle,
					type: EDGES_TYPES.DEFAULT,
				});
				currentConnecting.current = null;
			}
		},
	});
	const dragUpdateNode = trpc.nodes.dragUpdate.useMutation();
	const dragEndNode = trpc.nodes.dragEnd.useMutation();
	const deleteNode = trpc.nodes.delete.useMutation();
	const deleteManyNodes = trpc.nodes.deleteMany.useMutation();
	const updateManyNodes = trpc.nodes.updateMany.useMutation();
	const removeEdge = trpc.edges.delete.useMutation();
	const deleteManyEdges = trpc.edges.deleteMany.useMutation();

	const ctrlDown = useKeyPress("Control");

	const onNodeDragStart = useCallback<
		(event: React.MouseEvent, node: Node) => void
	>(
		async (_, node) => {
			if (!canvasId || ["welcome", ""].includes(canvasId)) return;
			if (!session?.user?.id) return;
			const should = await trcpProxyClient.nodes.shouldEmit.query({
				canvasId,
			});
			setShouldEmit(should);
		},
		[canvasId],
	);
	const { project } = useReactFlow();
	const onConnectStart = useCallback(
		(
			event: React.MouseEvent | React.TouchEvent,
			params: OnConnectStartParams,
		) => {
			console.log("onConnectStart", params);
			currentConnecting.current = params;
		},
		[],
	);

	const connectionStatus = useStoreFlow((state) => state?.connectionStatus);

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent) => {
			const targetIsPane = (event.target as any)?.classList.contains(
				"react-flow__pane",
			);

			if (targetIsPane && reactFlowWrapper.current && !connectionStatus) {
				const sourceHandles = useStore
					.getState()
					.getNode(currentConnecting.current?.nodeId!)?.data.handles;
				const handle = sourceHandles?.find(
					(h: any) => h.id === currentConnecting.current?.handleId,
				);
				console.log("handle", handle);
				let handlePosition = "top";
				switch (handle?.position) {
					case "top":
						handlePosition = "bottom";
						break;
					case "bottom":
						handlePosition = "top";
						break;
					case "left":
						handlePosition = "right";
						break;
					case "right":
						handlePosition = "left";
						break;
				}

				const handleOffset = { x: 0, y: 0 };
				switch (handlePosition) {
					case "top":
						handleOffset.x = -DEEFAULT_NODE_DIMENSIONS.width;
						break;
					case "bottom":
						handleOffset.x = -DEEFAULT_NODE_DIMENSIONS.width;
						handleOffset.y = -DEEFAULT_NODE_DIMENSIONS.height * 2;
						break;
					case "left":
						handleOffset.y = -DEEFAULT_NODE_DIMENSIONS.height;
						break;
					case "right":
						handleOffset.y = -DEEFAULT_NODE_DIMENSIONS.height;
						handleOffset.x = -DEEFAULT_NODE_DIMENSIONS.width * 2;
						break;
				}
				const { top, left } = reactFlowWrapper.current.getBoundingClientRect();

				const position = project({
					x: (event as any).clientX - left + handleOffset.x,
					y: (event as any).clientY - top + handleOffset.y,
				});
				if (session?.user?.id)
					addNode.mutate({
						canvasId,
						type: NODES_TYPES.DEFAULT,
						name: "Node",
						x: position.x,
						y: position.y,
						width: DEEFAULT_NODE_DIMENSIONS.width,
						height: DEEFAULT_NODE_DIMENSIONS.height,
						handles: [
							{
								position: handlePosition,
								type: handle?.type === "source" ? "target" : "source",
							},
						],
					});
			}
		},
		[project, canvasId, connectionStatus],
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
			// console.log(selectedNodes);
			for (const node of selectedNodes) {
				const group = isNodeInGroupBounds(node, nodes);
				if (group) {
					const relativePosition = {
						x: node.position.x - group.position.x,
						y: node.position.y - group.position.y,
					};
					if (session?.user?.id)
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
				if (session?.user?.id && !["welcome", ""].includes(canvasId) && node.id)
					dragEndNode.mutate({
						id: node.id,
						x: node.position.x,
						y: node.position.y,
					});
			}
		},
		[nodes],
	);

	const onEdgesChangeProxy = (edgeChanges: EdgeChange[]) => {
		onEdgesChange(edgeChanges);
		for (const change of edgeChanges) {
			if (
				change.type === "remove" &&
				session?.user?.id &&
				!["welcome", ""].includes(canvasId)
			) {
				removeEdge.mutate({
					id: change.id,
				});
			}
		}
	};
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
				if (session?.user?.id && !["welcome", ""].includes(canvasId))
					deleteNode.mutate({ id: change.id });
			}
		}
		// console.log("onNodesChangeProxy", nodeChanges);
		// console.log("selecting", selecting);
		// This is done to avoid the instant unselection of the nodes after selection (we update the selected attribute manually)
		onNodesChange(nodeChanges);
	};

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
	const updateNodePositionThrottled = useCallback(
		throttle(UPDATE_THROTTLE, (changes: NodePositionChange[]) => {
			if (!shouldEmit) return;
			if (!canvasId || ["welcome", ""].includes(canvasId)) return;
			if (!session?.user?.id) return;
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
	const onConnectProxy = useCallback(
		(params: Connection) => {
			console.log("onConnectProxy", params);
			if (!canvasId || ["welcome", ""].includes(canvasId)) return;
			if (!params.source || !params.target) return;
			MaddEdge.mutate({
				canvasId,
				from: params.source,
				to: params.target,
				type: EDGES_TYPES.DEFAULT,
				fromHandle: params.sourceHandle ?? undefined,
				toHandle: params.targetHandle ?? undefined,
			});
		},
		[edges, canvasId],
	);
	return {
		onNodeDragStart,
		onNodeDragStop,
		onEdgesChange: onEdgesChangeProxy,
		onNodesChange: onNodesChangeProxy,
		onNodeDrag,
		onConnect: onConnectProxy,
		onConnectEnd,
		onConnectStart,
	};
};
