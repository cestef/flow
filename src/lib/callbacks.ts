import {
	Connection,
	EdgeChange,
	Node,
	NodeChange,
	NodePositionChange,
	useKeyPress,
} from "reactflow";
import { UPDATE_THROTTLE, flowSelector } from "./constants";
import {
	getHelperLines,
	isNodeInGroupBounds,
	trcpProxyClient,
	trpc,
} from "./utils";

import { throttle } from "throttle-debounce";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "./store";

export const registerCallbacks = () => {
	const {
		nodes,
		findAndUpdateNode,
		updateNode,
		edges,
		onEdgesChange,
		onNodesChange,
		onConnect,
	} = useStore(flowSelector);
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
	const [selectedBrush, setSelectedBrush] = useStore((state) => [
		state.selectedBrush,
		state.setSelectedBrush,
	]);

	const { data: session } = useSession();

	const MupdateNode = trpc.nodes.update.useMutation();
	const MaddEdge = trpc.edges.add.useMutation();
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
				if (session?.user.id && !["welcome", ""].includes(canvasId)) {
					updateManyNodes.mutate({
						nodes: childrenNodesIds.map((node) => ({
							id: node,
							parentId: null,
						})),
					});
					deleteManyNodes.mutate({ ids: nodeIds });
					deleteManyEdges.mutate({ ids: [...edgeIds, ...connectedEdgesIds] });
				}
				return;
			}
		},
		[nodes],
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
				if (session?.user?.id && !["welcome", ""].includes(canvasId))
					deleteNode.mutate({ id: change.id });
			}
		}
		onNodesChange(
			nodeChanges.filter((change) =>
				selectedBrush === "select" ? change.type !== "select" : true,
			),
		);
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
			const newEdge = onConnect(params);
			if (!newEdge) return console.log("No edge found");
			if (!canvasId || ["welcome", ""].includes(canvasId)) return;
			MaddEdge.mutate({
				canvasId,
				id: newEdge.id,
				from: newEdge.source,
				to: newEdge.target,
				type: newEdge.type || "default",
			});
		},
		[edges, canvasId],
	);
	return {
		onNodeDragStart,
		onNodeDragStop,
		onEdgesChange: onEdgesChangeProxy,
		onNodesChange: onNodesChangeProxy,
		onNodeClick,
		onNodeDrag,
		onConnect: onConnectProxy,
	};
};
