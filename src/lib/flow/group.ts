import { Node } from "reactflow";

export const isNodeInGroupBounds = (node: Node, nodes: Node[]): Node | null => {
	if (node.parentNode) return null;
	// if (node.type === "customGroup") return null;
	return (
		nodes
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
			}) || null
	);
};
