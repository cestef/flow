import { formatRemoteData, trpc } from "./utils";

import { useSession } from "next-auth/react";
import { flowSelector } from "./constants";
import { useStore } from "./store";

export const subscribe = () => {
	const canvasId = useStore((state) => state.currentCanvasId);
	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		updateNode,
		addNode,
		findNode,
		deleteEdge,
		addEdge,
		deleteNode,
	} = useStore(flowSelector);
	const { data: session } = useSession();
	trpc.nodes.onAdd.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {
				if (nodes.find((n) => n.id === node.id)) return;
				const [formatted] = formatRemoteData([node]);
				addNode(formatted);
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
				const [formatted] = formatRemoteData([node]);
				updateNode(formatted);
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
					const currentNode = findNode(node.id);
					if (!currentNode) return;
					updateNode({
						id: node.id,
						parentNode: undefined,
						extent: undefined,
						position: {
							x: currentNode.position.x + node.x,
							y: currentNode.position.y + node.y,
						},
					});
				}
				deleteNode(node.id);
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
				updateNode({
					id: node.id,
					position: {
						x: node.x,
						y: node.y,
					},
				});
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
				addEdge({
					id: edge.id,
					source: edge.fromId,
					target: edge.toId,
				});
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
				deleteEdge(edge.id);
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
};
