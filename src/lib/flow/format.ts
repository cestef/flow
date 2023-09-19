import { Node } from "reactflow";
import { Presence, usePluvOthers } from "../pluv/bundle";
import { NODE_NAMES } from "../constants";
import { z } from "zod";

export const formatNodesFlow = (
	nodes: Node[],
	others: ReturnType<
		typeof usePluvOthers<{
			presence: z.infer<typeof Presence>;
			user: {
				id: string;
				name: string;
			};
		}>
	>,
) => {
	return [
		...nodes.map((node) => {
			const otherSelected = others.find((other) =>
				other.presence.currentSelected.includes(node.id),
			);
			return {
				...node,
				data: {
					...node.data,
					borderColor: otherSelected?.presence.color,
				},
			};
		}),
		...others.map((other) => {
			const selected = other.presence.currentSelected;
			const selectedNode = nodes.find((node) => selected.includes(node.id));
			const isGrabbing = other.presence.state === "grab";
			// console.log("isGrabbing", isGrabbing);
			// console.log("presence.start", other.presence.startX, other.presence.startY);
			const x =
				isGrabbing && selectedNode
					? other.presence.startX + selectedNode!.position.x
					: other.presence.x;
			const y =
				isGrabbing && selectedNode
					? other.presence.startY + selectedNode!.position.y
					: other.presence.y;
			return {
				id: other.user.id,
				type: NODE_NAMES.CURSOR,
				position: {
					x,
					y,
				},
				data: {
					state: other.presence.state,
					color: other.presence.color,
					name: other.user.name,
				},
			};
		}),
	];
};
