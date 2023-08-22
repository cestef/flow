import { Dispatch, SetStateAction, useCallback } from "react";
import { Edge, Node } from "reactflow";

import { useSession } from "next-auth/react";
import { useStore } from "./store";
import { trpc } from "./utils";

export const subscribe = ({
	setNodes,
	setEdges,
	edges,
	nodes,
}: {
	setNodes: Dispatch<SetStateAction<Node[]>>;
	setEdges: Dispatch<SetStateAction<Edge[]>>;
	edges: Edge[];
	nodes: Node[];
}) => {
	const canvasId = useStore((state) => state.currentCanvasId);
	const { data: session } = useSession();
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
						data: { label: node.name, color: node.color },
						position: { x: node.x, y: node.y },
						...((node.width || node.height) && {
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
								data: {
									...n.data,
									label: node.name,
									color: node.color,
								},
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
};
