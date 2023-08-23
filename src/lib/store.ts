import {
	Connection,
	Edge,
	EdgeChange,
	Node,
	NodeChange,
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
} from "reactflow";

import { temporal } from "zundo";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { shallowMerge } from "./utils";

export const useStore = createWithEqualityFn(
	temporal(
		combine(
			{
				nodes: [] as Node[],
				edges: [] as Edge[],
				createNewCanvas: {
					opened: false,
					name: "",
				},
				currentCanvasId: "",
				contextMenuPosition: {
					x: 0,
					y: 0,
				},
				addNewMember: {
					opened: false,
					email: "",
				},
				chooseCanvas: {
					opened: false,
				},
				canvasPanelHidden: false,
				membersPanelHidden: false,
				snapToGrid: false,
				snapLines: false,
				clipboard: {
					nodes: [] as Node[],
					edges: [] as Edge[],
				},
				selected: {
					nodes: [] as Node[],
					edges: [] as Edge[],
				},
				settingsOpen: false,
				helperLineVertical: undefined as number | undefined,
				helperLineHorizontal: undefined as number | undefined,
			},
			(set) => ({
				onNodesChange: (changes: NodeChange[]) => {
					const newNodes = applyNodeChanges(changes, useStore.getState().nodes);
					set((state) => ({
						nodes: applyNodeChanges(changes, state.nodes),
					}));
				},
				setNodes: (nodes: Node[]) => {
					const ordered = nodes.sort((a, b) => {
						if (a.type === "customGroup" && b.type !== "customGroup") return -1;
						if (a.type !== "customGroup" && b.type === "customGroup") return 1;
						return 0;
					});
					set({ nodes: ordered });
				},
				findNode: (id: string) => {
					return useStore.getState().nodes.find((node) => node.id === id);
				},
				findAndUpdateNode: (
					where: (node: Node) => boolean,
					update: (node: Node) => Node,
				) => {
					set((state) => ({
						nodes: state.nodes.map((node) => {
							if (where(node)) {
								return update(node);
							}
							return node;
						}),
					}));
				},
				updateNode: (node: Partial<Node> & { id: string }) => {
					set((state) => ({
						nodes: state.nodes.map((n) => {
							if (n.id === node.id) {
								return shallowMerge(n, node);
							}
							return n;
						}),
					}));
				},
				addNode: (node: Node) => {
					set((state) => ({
						nodes: [...state.nodes, node],
					}));
				},
				deleteNode: (nodeId: string) => {
					set((state) => ({
						nodes: state.nodes.filter((n) => n.id !== nodeId),
					}));
				},
				onEdgesChange: (changes: EdgeChange[]) => {
					set((state) => ({
						edges: applyEdgeChanges(changes, state.edges),
					}));
				},
				setEdges: (edges: Edge[]) => {
					set({ edges });
				},
				deleteEdge: (edgeId: string) => {
					set((state) => ({
						edges: state.edges.filter((e) => e.id !== edgeId),
					}));
				},
				addEdge: (edge: Edge) => {
					set((state) => ({
						edges: [...state.edges, edge],
					}));
				},
				onConnect: (connection: Connection) => {
					set((state) => ({
						edges: addEdge(connection, state.edges),
					}));
				},
				toggleCreateNewCanvas: (opened?: boolean) =>
					set((state) => ({
						createNewCanvas: {
							...state.createNewCanvas,
							opened: opened ?? !state.createNewCanvas.opened,
						},
					})),
				setCreateNewCanvasName: (name: string) =>
					set((state) => ({
						createNewCanvas: { ...state.createNewCanvas, name },
					})),
				setCurrentCanvasId: (id: string) => set({ currentCanvasId: id }),
				setContextMenuPosition: (x: number, y: number) =>
					set({ contextMenuPosition: { x, y } }),
				toggleAddNewMember: (opened?: boolean) =>
					set((state) => ({
						addNewMember: {
							...state.addNewMember,
							opened: opened ?? !state.addNewMember.opened,
						},
					})),
				setAddNewMemberEmail: (email: string) =>
					set((state) => ({
						addNewMember: { ...state.addNewMember, email },
					})),
				toggleChooseCanvas: (opened?: boolean) =>
					set((state) => ({
						chooseCanvas: {
							...state.chooseCanvas,
							opened: opened ?? !state.chooseCanvas.opened,
						},
					})),
				toggleCanvasPanel: (hidden?: boolean) =>
					set((state) => ({
						canvasPanelHidden: hidden ?? !state.canvasPanelHidden,
					})),
				toggleMembersPanel: (hidden?: boolean) =>
					set((state) => ({
						membersPanelHidden: hidden ?? !state.membersPanelHidden,
					})),
				setSnapToGrid: (snapToGrid: boolean) => set({ snapToGrid }),
				setClipboard: (nodes: Node[], edges: Edge[]) =>
					set({ clipboard: { nodes, edges } }),
				clearClipboard: () => set({ clipboard: { nodes: [], edges: [] } }),
				setSelected: (nodes: Node[], edges: Edge[]) =>
					set({ selected: { nodes, edges } }),
				clearSelected: () => set({ selected: { nodes: [], edges: [] } }),
				setSettingsOpen: (settingsOpen: boolean) => set({ settingsOpen }),
				setHelperLineVertical: (helperLineVertical: number | undefined) =>
					set({ helperLineVertical }),
				setHelperLineHorizontal: (helperLineHorizontal: number | undefined) =>
					set({ helperLineHorizontal }),
				setSnapLines: (snapLines: boolean) => set({ snapLines }),
			}),
		),
		{
			equality: (a, b) => {
				const diffs = a.nodes.map((node, i) => {
					const currentNode = b.nodes.find((n) => n.id === node.id);
					if (!currentNode) return false;
					const diff = {
						name:
							node.data?.label !== currentNode.data?.label
								? currentNode.data?.label
								: undefined,
						color:
							node.data?.color !== currentNode.data?.color
								? currentNode.data?.color
								: undefined,
						x:
							node.position.x !== currentNode.position.x
								? currentNode.position.x
								: undefined,
						y:
							node.position.y !== currentNode.position.y
								? currentNode.position.y
								: undefined,
						width:
							+(node.style?.width || 0) !== +(currentNode.style?.width || 0)
								? +(currentNode.style?.width || 0)
								: undefined,
						height:
							+(node.style?.height || 0) !== +(currentNode.style?.height || 0)
								? +(currentNode.style?.height || 0)
								: undefined,
						parentId:
							node.parentNode !== currentNode.parentNode
								? currentNode.parentNode
								: undefined,
					};
					return diff;
				});
				const hasChanges = diffs.map((diff) =>
					Object.values(diff).some((v) => v !== undefined),
				);
				return !hasChanges.some((v) => v);
			},
			partialize(state) {
				return {
					nodes: state.nodes.map((node) => ({
						...node,
						position: node.data.debouncedPosition || node.position,
					})),
					edges: state.edges,
				};
			},
		},
	),
	shallow,
);

export const useTemporalStore = create(useStore.temporal);

export type StoreState = ReturnType<typeof useStore.getState>;
