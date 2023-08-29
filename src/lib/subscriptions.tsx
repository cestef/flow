import { formatRemoteData, trpc } from "./utils";

import { Button } from "@/components/ui/button";
import { flowSelector } from "./constants";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useStore } from "./store";
import { useToast } from "@/components/ui/use-toast";

export const subscribe = () => {
	const canvasId = useStore((state) => state.currentCanvasId);
	const {
		nodes,
		edges,
		setNodes,
		setEdges,
		updateNode,
		addNode,
		findNodes,
		deleteEdge,
		addEdge,
		deleteNode,
		comments,
		setComments,
		addComment,
		updateComment,
		deleteComment,
	} = useStore(flowSelector);
	const { data: session } = useSession();
	const { toast } = useToast();
	const router = useRouter();

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
			enabled: !!session && !["welcome", ""].includes(canvasId),
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
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);
	trpc.nodes.onDelete.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {
				if (node.type === "customGroup") {
					const nodes = findNodes((n) => n.id === node.id);
					if (nodes.length === 0) return;
					for (const current of nodes) {
						updateNode({
							id: current.id,
							parentNode: undefined,
							extent: undefined,
							position: {
								x: current.position.x + node.x,
								y: current.position.y + node.y,
							},
						});
					}
				}
				deleteNode(node.id);
			},
			onError(err) {
				console.log(err);
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);

	trpc.nodes.onDragStart.useSubscription(
		{
			canvasId,
		},
		{
			async onData(node) {},
			enabled: !!session && !["welcome", ""].includes(canvasId),
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
					data: {
						label: node.name,
						color: node.color,
						draggedBy: userId,
					},
				});
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);
	trpc.nodes.onDragEnd.useSubscription(
		{
			canvasId,
		},
		{
			async onData({ node, userId }) {
				updateNode({
					id: node.id,
					data: {
						label: node.name,
						color: node.color,
						draggedBy: undefined,
					},
				});
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
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
			enabled: !!session && !["welcome", ""].includes(canvasId),
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
			enabled: !!session && !["welcome", ""].includes(canvasId),
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
		enabled: !!session && !["welcome", ""].includes(canvasId),
	});

	trpc.members.onSelfAddMember.useSubscription(undefined, {
		async onData(canvas) {
			const res = toast({
				title: "You have been added to a canvas",
				description: `You have been added to the canvas "${canvas.name}"`,
				action: (
					<Button
						onClick={() => {
							router.push(`/?canvasId=${canvas.id}`);
							res.dismiss();
						}}
					>
						View
					</Button>
				),
			});
		},
		enabled: !!session && !["welcome", ""].includes(canvasId),
	});

	trpc.comments.onAdd.useSubscription(
		{
			canvasId,
		},
		{
			async onData(comment) {
				if (comments.find((c) => c.id === comment.id)) return;
				addComment(comment);
			},
			onError(err) {
				console.log(err);
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);
	trpc.comments.onUpdate.useSubscription(
		{
			canvasId,
		},
		{
			async onData(comment) {
				updateComment(comment);
			},
			onError(err) {
				console.log(err);
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);
	trpc.comments.onDelete.useSubscription(
		{
			canvasId,
		},
		{
			async onData(comment) {
				deleteComment(comment.id);
			},
			onError(err) {
				console.log(err);
			},
			enabled: !!session && !["welcome", ""].includes(canvasId),
		},
	);
};
