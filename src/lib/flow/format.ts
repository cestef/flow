import { Node } from "reactflow";
import { usePluvOthers } from "../pluv/bundle";
import { NODE_NAMES } from "../constants";

export const formatNodesFlow = (nodes: Node[], others: ReturnType<typeof usePluvOthers<any>>) => [
	...nodes.map((node) => {
		const otherSelected = others.find((other) =>
			other.presence.currentSelected.includes(node.id)
		);
		return {
			...node,
			data: {
				...node.data,
				borderColor: otherSelected?.presence.color,
			},
		};
	}),
	...others.map((other) => ({
		id: other.user.id,
		type: NODE_NAMES.CURSOR,
		position: {
			x: other.presence.x,
			y: other.presence.y,
		},
		data: {
			state: other.presence.state,
			color: other.presence.color,
			name: other.user.name,
		},
	})),
];
