"use-client";
import { BackgroundStyled } from "@/components/flow/background";
import { Button } from "@/components/ui/button";
import { FIT_VIEW, NODE_NAMES, NODE_TYPES } from "@/lib/constants";
import { usePluvMyPresence, usePluvOthers, usePluvStorage } from "@/lib/pluv/bundle";
import { RoomProvider } from "@/lib/pluv/provider";
import { useStore } from "@/lib/store";
import { getRandomHexColor } from "@/lib/utils";
import { GetServerSidePropsContext } from "next";
import { useCallback, useEffect } from "react";
import ReactFlow, {
	NodeChange,
	Panel,
	applyNodeChanges,
	useUpdateNodeInternals,
	useStore as useStoreFlow,
	useReactFlow,
	Node,
} from "reactflow";

function Room({ id }: { id: string }) {
	return (
		<RoomProvider
			room={id}
			initialPresence={{
				color: getRandomHexColor(),
				x: 0,
				y: 0,
				grabbing: false,
				currentSelected: [],
			}}
		>
			<Canvas />
		</RoomProvider>
	);
}

function Canvas() {
	const [currentSelected, updateMyPresence] = usePluvMyPresence(
		(myPresence) => myPresence.currentSelected
	);
	const others = usePluvOthers();
	const updateNodeInternals = useUpdateNodeInternals();
	const [nodes, setNodes, updateNode, updateNodes] = useStore(
		(e) => [e.nodes, e.setNodes, e.updateNode, e.updateNodes] as const
	);
	const [edges, setEdges] = useStore((e) => [e.edges, e.setEdges] as const);

	const [remoteNodes, nodesShared] = usePluvStorage("nodes");
	const [remoteEdges, edgesShared] = usePluvStorage("edges");

	useEffect(() => {
		if (!nodesShared) return;
		const nodes = Object.values(remoteNodes ?? {});
		setNodes(nodes);
	}, [remoteNodes, setNodes, nodesShared]);

	useEffect(() => {
		if (!edgesShared) return;
		const edges = Object.values(remoteEdges ?? {});
		setEdges(edges);
	}, [remoteEdges, setEdges, edgesShared]);

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
					}))
				);
				updateMyPresence({
					currentSelected,
				});
			}
		},
		[nodesShared, remoteNodes, currentSelected, updateMyPresence, setNodes, updateNode]
	);
	const triggerNodeChanges = useStoreFlow((e) => e.triggerNodeChanges);
	const { project } = useReactFlow();
	const canvasId = useStore((state) => state.canvasId);

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
		[project]
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
	const onSelectionStop = useCallback((e: React.MouseEvent) => {
		updateMyPresence({
			state: "default",
		});
	}, []);

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				x: projected.x,
				y: projected.y,
			});
		};

		window.addEventListener("mousemove", onMouseMove);

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
		};
	}, [project, canvasId]);

	return (
		<div className="h-[100svh] w-full">
			<ReactFlow
				nodes={[
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
						},
					})),
				]}
				edges={edges}
				onNodesChange={onNodesChange}
				onNodeDrag={onNodeDrag}
				onNodeDragStart={onNodeDragStart}
				onNodeDragStop={onNodeDragStop}
				onSelectionStart={onSelectionStart}
				onSelectionEnd={onSelectionStop}
				fitView
				fitViewOptions={FIT_VIEW}
				nodeTypes={NODE_TYPES}
				proOptions={{
					hideAttribution: true,
				}}
			>
				<BackgroundStyled />
				<Panel position="bottom-center">
					<Button
						onClick={() => {
							const id = Math.random().toString(36).substring(7);
							triggerNodeChanges([
								{
									type: "add",
									item: {
										id,
										type: NODE_NAMES.DEFAULT,
										position: {
											x: Math.random() * 100,
											y: Math.random() * 100,
										},
										data: {
											label: id,
										},
									},
								},
							]);
						}}
					>
						Add Node
					</Button>
				</Panel>
			</ReactFlow>
		</div>
	);
}

export default Room;

export async function getServerSideProps({ params }: GetServerSidePropsContext) {
	const id = params?.id;
	if (!id) {
		return {
			notFound: true,
		};
	}
	return {
		props: {
			id,
		},
	};
}
