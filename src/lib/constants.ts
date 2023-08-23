import DefaultEdge from "@/components/edges/default-edge";
import DefaultNode from "@/components/nodes/default-node";
import GroupNode from "@/components/nodes/group-node";
import ShapeNode from "@/components/nodes/shape-node";
import { StoreState } from "./store";

export const SHAPES = {
	CIRCLE: "circle",
	RECTANGLE: "rectangle",
	ROUNDED_RECTANGLE: "rounded-rectangle",
	TRIANGLE: "triangle",
	DIAMOND: "diamond",
	PARALLELOGRAM: "parallelogram",
};

export const NODES_TYPES = {
	DEFAULT: "customDefault",
	INPUT: "customInput",
	OUTPUT: "customOutput",
	GROUP: "customGroup",
};

export const nodeTypes = {
	customGroup: GroupNode,
	[NODES_TYPES.DEFAULT]: DefaultNode,
	[NODES_TYPES.INPUT]: DefaultNode,
	[NODES_TYPES.OUTPUT]: DefaultNode,
	[SHAPES.CIRCLE]: ShapeNode,
	[SHAPES.RECTANGLE]: ShapeNode,
	[SHAPES.ROUNDED_RECTANGLE]: ShapeNode,
	[SHAPES.TRIANGLE]: ShapeNode,
	[SHAPES.DIAMOND]: ShapeNode,
	[SHAPES.PARALLELOGRAM]: ShapeNode,
};

export const EDGE_TYPES = {
	DEFAULT: "customDefault",
};

export const edgeTypes = {
	[EDGE_TYPES.DEFAULT]: DefaultEdge,
};

export const UPDATE_THROTTLE = (1 / 60) * 1000; // 60fps

export const flowSelector = (state: StoreState) => ({
	nodes: state.nodes,
	edges: state.edges,
	setNodes: state.setNodes,
	setEdges: state.setEdges,
	onNodesChange: state.onNodesChange,
	onEdgesChange: state.onEdgesChange,
	onConnect: state.onConnect,
	updateNode: state.updateNode,
	addNode: state.addNode,
	findNode: state.findNode,
	deleteNode: state.deleteNode,
	addEdge: state.addEdge,
	deleteEdge: state.deleteEdge,
	findAndUpdateNode: state.findAndUpdateNode,
	// updateEdge: state.updateEdge,
});

export const DEFAULT_COLORS = {
	[SHAPES.CIRCLE]: "#B4D455",
	[SHAPES.RECTANGLE]: "#B4D455",
	[SHAPES.ROUNDED_RECTANGLE]: "#B4D455",
	[SHAPES.TRIANGLE]: "#B4D455",
	[SHAPES.DIAMOND]: "#B4D455",
	[SHAPES.PARALLELOGRAM]: "#B4D455",
};
