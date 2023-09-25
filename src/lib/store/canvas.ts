import { StateCreator } from "zustand";
import { Room } from "../pluv/bundle";
import { Edge, Node } from "reactflow";
import { shallowMerge } from "../utils";

export interface CanvasSlice {
	canvasId: string | null;
	setCanvasId: (canvasId: string | null) => void;
	canvasPanel: boolean;
	toggleCanvasPanel: (open?: boolean) => void;
	chooseCanvas: boolean;
	toggleChooseCanvas: (chooseCanvas?: boolean) => void;
	createNewCanvas: boolean;
	toggleCreateNewCanvas: (createNewCanvas?: boolean) => void;
	newCanvasName: string;
	setNewCanvasName: (newCanvasName: string) => void;
	room: Room | null;
	setRoom: (room: Room | null) => void;
	nodes: Node[];
	setNodes: (nodes: Node[]) => void;
	updateNode: (node: Partial<Node> & Pick<Node, "id">) => void;
	updateNodes: (nodes: (Partial<Node> & Pick<Node, "id">)[]) => void;
	addNode: (node: Node) => void;
	edges: Edge[];
	setEdges: (edges: Edge[]) => void;
	helperLines: {
		horizontal: number | undefined;
		vertical: number | undefined;
	};
	setHelperLines: (lines: {
		horizontal?: number | undefined;
		vertical?: number | undefined;
	}) => void;
	tool: string;
	setTool: (tool: string) => void;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set) => ({
	canvasId: null,
	setCanvasId: (canvasId) => set({ canvasId }),
	canvasPanel: true,
	toggleCanvasPanel: (open) => set((state) => ({ canvasPanel: open ?? !state.canvasPanel })),
	chooseCanvas: false,
	toggleChooseCanvas: (chooseCanvas) =>
		set((state) => ({ chooseCanvas: chooseCanvas ?? !state.chooseCanvas })),
	createNewCanvas: false,
	toggleCreateNewCanvas: (createNewCanvas) =>
		set((state) => ({ createNewCanvas: createNewCanvas ?? !state.createNewCanvas })),
	newCanvasName: "",
	setNewCanvasName: (newCanvasName) => set({ newCanvasName }),
	room: null,
	setRoom: (room) => set({ room }),
	nodes: [],
	setNodes: (nodes) => set({ nodes }),
	updateNode: (node) =>
		set((state) => ({
			nodes: state.nodes.map((n) => {
				if (n.id === node.id) {
					return shallowMerge(n, node);
				}
				return n;
			}),
		})),
	updateNodes: (nodes) =>
		set((state) => ({
			nodes: state.nodes.map((n) => {
				const node = nodes.find((node) => node.id === n.id);
				return node ? shallowMerge(n, node) : n;
			}),
		})),
	addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
	edges: [],
	setEdges: (edges) => set({ edges }),
	helperLines: {
		horizontal: undefined,
		vertical: undefined,
	},
	setHelperLines: (lines) =>
		set((state) => ({ helperLines: { ...state.helperLines, ...lines } })),
	tool: "select",
	setTool: (tool) => set({ tool }),
});
