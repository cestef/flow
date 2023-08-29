import { Comment, User } from "@prisma/client";
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
import { nodesEqual, shallowMerge } from "./utils";

import { temporal } from "zundo";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export const useStore = createWithEqualityFn(
	temporal(
		combine(
			{
				nodes: [] as Node[],
				edges: [] as Edge[],
				comments: [] as (Comment & Partial<{ user: User }>)[],
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
				createInvitePanel: {
					opened: false,
					maxUses: 1,
					expires: undefined as Date | undefined,
					showResult: undefined as string | undefined,
					copied: false,
				},
				shouldEmit: false,
				brushesOpen: false,
				selectedBrush: "pointer" as string | undefined,
				editing: {} as {
					[id: string]: {
						nameValue: string;
						nameStatus: boolean;
						fontStatus: boolean;
						fontSize: number;
						fontColor: string;
						fontWeight: string;
						pickerStatus: boolean;
						pickerValue: string;
						commentStatus: boolean;
					};
				},
				selecting: false,
			},
			(set) => ({
				setSelecting: (selecting: boolean) => set({ selecting }),
				onNodesChange: (changes: NodeChange[]) => {
					const newNodes = applyNodeChanges(changes, useStore.getState().nodes);
					set((state) => ({
						nodes: applyNodeChanges(changes, state.nodes),
					}));
				},
				setNodes: (nodes: Node[]) => {
					console.log("setNodes", nodes);
					const ordered = nodes.sort((a, b) => {
						if (a.type === "customGroup" && b.type !== "customGroup") return -1;
						if (a.type !== "customGroup" && b.type === "customGroup") return 1;
						return 0;
					});
					set({ nodes: ordered });
				},
				getNode: (id: string) => {
					return useStore.getState().nodes.find((node) => node.id === id);
				},
				findNode: (where: (node: Node) => boolean) => {
					return useStore.getState().nodes.find((node) => where(node));
				},
				findNodes: (where: (node: Node) => boolean) => {
					return useStore.getState().nodes.filter((node) => where(node));
				},
				findAndUpdateNode: (
					where: (node: Node) => boolean,
					update: (node: Node) => Node,
				) => {
					console.log("findAndUpdateNode", where, update);
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
					console.log("updateNode", node);
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
				setComments: (comments: Comment[]) => {
					set({ comments });
				},
				addComment: (comment: Comment) => {
					set((state) => ({
						comments: [...state.comments, comment],
					}));
				},
				deleteComment: (commentId: string) => {
					set((state) => ({
						comments: state.comments.filter((c) => c.id !== commentId),
					}));
				},
				updateComment: (comment: Partial<Comment> & { id: string }) => {
					set((state) => ({
						comments: state.comments.map((c) => {
							if (c.id === comment.id) {
								return shallowMerge(c, comment);
							}
							return c;
						}),
					}));
				},

				onConnect: (connection: Connection) => {
					const newEdges = addEdge(connection, useStore.getState().edges);
					set(() => ({
						edges: newEdges,
					}));
					const createdEdge = newEdges.find(
						(e) =>
							e.source === connection.source && e.target === connection.target,
					);
					if (createdEdge) {
						return createdEdge;
					}
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
				toggleCreateInvitePanel: (opened?: boolean) =>
					set((state) => ({
						createInvitePanel: {
							...state.createInvitePanel,
							opened: opened ?? !state.createInvitePanel.opened,
						},
					})),
				setCreateInvitePanelMaxUses: (maxUses: number) =>
					set((state) => ({
						createInvitePanel: { ...state.createInvitePanel, maxUses },
					})),
				setCreateInvitePanelExpires: (expires: Date | undefined) =>
					set((state) => ({
						createInvitePanel: { ...state.createInvitePanel, expires },
					})),
				setCreateInvitePanelShowResult: (showResult: string | undefined) =>
					set((state) => ({
						createInvitePanel: { ...state.createInvitePanel, showResult },
					})),
				setCreateInvitePanelCopied: (copied: boolean) =>
					set((state) => ({
						createInvitePanel: { ...state.createInvitePanel, copied },
					})),
				setShouldEmit: (shouldEmit: boolean) => set({ shouldEmit }),
				setBrushesOpen: (brushesOpen: boolean) => set({ brushesOpen }),
				setSelectedBrush: (selectedBrush: string | undefined) =>
					set({ selectedBrush }),
				setEditing: (
					id: string,
					editing: Partial<{
						nameValue: string;
						nameStatus: boolean;
						fontStatus: boolean;
						fontSize: number;
						fontColor: string;
						fontWeight: string;
						pickerStatus: boolean;
						pickerValue: string;
						commentStatus: boolean;
					}>,
				) =>
					set((state) => ({
						editing: {
							...state.editing,
							[id]: {
								...state.editing[id],
								...editing,
							},
						},
					})),
			}),
		),
		{
			equality: (a, b) => {
				return nodesEqual(a.nodes, b.nodes);
			},
			partialize(state) {
				return {
					nodes: (state.nodes || []).map((node) => ({
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
