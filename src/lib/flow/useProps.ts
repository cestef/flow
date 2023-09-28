import { useCallback } from "react";
import { Node, NodeChange, ReactFlowProps, useKeyPress, useReactFlow } from "reactflow";
import * as Y from "yjs";
import { usePluvMyPresence, usePluvTransact } from "../pluv/bundle";
import { RootSlice, useStore } from "../store";
import { FIT_VIEW, NODE_TYPES } from "../constants";
import { getHelperLines } from "@/components/flow/helper-lines";
import { useNodes } from "./elements";

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
	const transact = usePluvTransact();
	const { project } = useReactFlow();
	const { nodes } = useNodes();
	const ctrl = useKeyPress("Control");
	const setHelperLines = useStore((e) => e.setHelperLines);
	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			console.log("onNodesChange", changes);
			setHelperLines({
				horizontal: undefined,
				vertical: undefined,
			});
			if (
				changes.length === 1 &&
				changes[0].type === "position" &&
				changes[0].dragging &&
				changes[0].position &&
				ctrl
			) {
				const helperLines = getHelperLines(changes[0], nodes);

				// if we have a helper line, we snap the node to the helper line position
				// this is being done by manipulating the node position inside the change object
				changes[0].position.x = helperLines.snapPosition.x ?? changes[0].position.x;
				changes[0].position.y = helperLines.snapPosition.y ?? changes[0].position.y;

				// if helper lines are returned, we set them so that they can be displayed
				if (helperLines.horizontal || helperLines.vertical) {
					setHelperLines(helperLines);
				}
			}
			if (!nodesShared) {
				console.log("No nodes shared");
				return;
			}
			for (let i = 0; i < changes.length; i++) {
				const change = changes[i];
				switch (change.type) {
					case "add": {
						const node = change.item;
						if (!node) {
							console.log("Invalid node addition change", change);
							break;
						}
						transact(() => {
							nodesShared.set(node.id, node);
						});
						break;
					}
					case "remove": {
						const nodeId = change.id;
						if (!nodeId) {
							console.log("Invalid node removal change", change);
							break;
						}
						transact(() => {
							nodesShared.delete(nodeId);
						});
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
						transact(() => {
							nodesShared.set(nodeId, node);
						});
						break;
					}
					case "select": {
						const nodeId = change.id;
						const isSelected = change.selected;

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
					currentSelected
						.map((id) => ({
							id,
							selected: true,
						}))
						.concat(
							nodes
								.filter((node) => !currentSelected.includes(node.id))
								.map((node) => ({
									id: node.id,
									selected: false,
								})),
						),
				);
				updateMyPresence({
					currentSelected,
				});
			}
		},
		[
			nodesShared,
			remoteNodes,
			currentSelected,
			updateMyPresence,
			setNodes,
			updateNodes,
			ctrl,
			nodes,
			transact,
		],
	);
	const onNodeDragStart = useCallback(
		(e: React.MouseEvent, node: Node) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				state: "grab",
				startX: projected.x - node.position.x,
				startY: projected.y - node.position.y,
			});
		},
		[project],
	);
	const onNodeDragStop = useCallback(
		(e: React.MouseEvent, node: Node) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				state: "default",
				x: projected.x,
				y: projected.y,
			});
			transact(() => {
				nodesShared?.set(node.id, node);
			});
		},
		[nodesShared],
	);

	const onSelectionStart = useCallback(
		(e: React.MouseEvent) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				state: "select",
				startX: projected.x,
				startY: projected.y,
			});
		},
		[project],
	);
	const onSelectionEnd = useCallback((e: React.MouseEvent) => {
		updateMyPresence({
			state: "default",
		});
	}, []);

	return {
		onNodesChange,
		onNodeDragStart,
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
		maxZoom: 3,
		minZoom: 0.4,
	};
};
