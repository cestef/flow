import { useCallback } from "react";
import { Node, NodeChange, ReactFlowProps, useReactFlow } from "reactflow";
import * as Y from "yjs";
import { usePluvMyPresence } from "../pluv/bundle";
import { RootSlice, useStore } from "../store";
import { FIT_VIEW, NODE_TYPES } from "../constants";

const updateSetSelector = (e: RootSlice) => ({
	updateNode: e.updateNode,
	updateNodes: e.updateNodes,
	setNodes: e.setNodes,
});

export const useFlowProps = (
	remoteNodes: Record<string, Node> | null,
	nodesShared: Y.Map<Node> | null,
): ReactFlowProps => {
	const [currentSelected, updateMyPresence] = usePluvMyPresence((e) => e.currentSelected);
	const { updateNode, setNodes, updateNodes } = useStore(updateSetSelector);
	const { project } = useReactFlow();
	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			if (!nodesShared) {
				console.log("No nodes shared");
				return;
			}
			const ids = [];
			for (let i = 0; i < changes.length; i++) {
				const change = changes[i];
				switch (change.type) {
					case "add": {
						const node = change.item;
						if (!node) {
							console.log("Invalid node addition change", change);
							break;
						}
						nodesShared.set(node.id, node);
						break;
					}
					case "remove": {
						const nodeId = change.id;
						if (!nodeId) {
							console.log("Invalid node removal change", change);
							break;
						}
						nodesShared.delete(nodeId);
						break;
					}
					case "position": {
						const nodeId = change.id;
						const position = change.position;
						if (!nodeId || !position) {
							console.log("Invalid node position change", change);
							break;
						}
						const node = nodesShared.get(nodeId);
						if (!node) {
							console.log("Node not found", nodeId);
							break;
						}
						node.position = position;
						nodesShared.set(nodeId, node);
						break;
					}
					case "dimensions": {
						const nodeId = change.id;
						const dimensions = change.dimensions;
						if (!nodeId || !dimensions) {
							console.log("Invalid node dimensions change", change);
							break;
						}
						const shouldUpdateStyle = change.updateStyle ?? false;
						const node = nodesShared.get(nodeId);
						if (!node) {
							console.log("Node not found", nodeId);
							break;
						}
						node.width = dimensions.width;
						node.height = dimensions.height;
						if (shouldUpdateStyle) {
							node.style = {
								...node.style,
								width: dimensions.width,
								height: dimensions.height,
							};
						}
						nodesShared.set(nodeId, node);
						break;
					}
					case "select": {
						const nodeId = change.id;
						const isSelected = change.selected;

						// const node = nodesShared.get(nodeId);
						// if (!node) {
						// 	console.log("Node not found", nodeId);
						// 	break;
						// }
						// node.selected = isSelected;
						// nodesShared.set(nodeId, node);
						if (isSelected) {
							currentSelected.push(nodeId);
						} else {
							const index = currentSelected.indexOf(nodeId);
							if (index > -1) {
								currentSelected.splice(index, 1);
							}
						}

						break;
					}

					default:
						console.log("Unhandled node change", change);
						break;
				}
				setNodes(Object.values(nodesShared.toJSON()));
				updateNodes(
					currentSelected.map((id) => ({
						id,
						selected: true,
					})),
				);
				updateMyPresence({
					currentSelected,
				});
			}
		},
		[nodesShared, remoteNodes, currentSelected, updateMyPresence, setNodes, updateNodes],
	);
	const onNodeDragStart = useCallback((e: React.MouseEvent, node: Node) => {
		updateMyPresence({
			state: "grab",
		});
	}, []);
	const onNodeDrag = useCallback(
		(e: React.MouseEvent, node: Node) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				x: projected.x,
				y: projected.y,
			});
		},
		[project],
	);
	const onNodeDragStop = useCallback((e: React.MouseEvent, node: Node) => {
		updateMyPresence({
			state: "default",
		});
	}, []);

	const onSelectionStart = useCallback((e: React.MouseEvent) => {
		updateMyPresence({
			state: "select",
		});
	}, []);
	const onSelectionEnd = useCallback((e: React.MouseEvent) => {
		updateMyPresence({
			state: "default",
		});
	}, []);

	return {
		onNodesChange,
		onNodeDragStart,
		onNodeDrag,
		onNodeDragStop,
		onSelectionStart,
		onSelectionEnd,
		fitView: true,
		fitViewOptions: FIT_VIEW,
		nodeTypes: NODE_TYPES,
		proOptions: {
			hideAttribution: true,
		},
		selectNodesOnDrag: true,
	};
};
