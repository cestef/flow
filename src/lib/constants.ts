import DefaultEdge from "@/components/edges/default-edge";
import ButtonNode from "@/components/nodes/button-node";
import DefaultNode from "@/components/nodes/default/node";
import GroupNode from "@/components/nodes/group-node";
import { StoreState } from "./store";

export const NODES_TYPES = {
	DEFAULT: "customDefault",
	BUTTON: "customButton",
	GROUP: "customGroup",
};

export const nodeTypes = {
	[NODES_TYPES.GROUP]: GroupNode,
	[NODES_TYPES.DEFAULT]: DefaultNode,
	[NODES_TYPES.BUTTON]: ButtonNode,
};

export const EDGES_TYPES = {
	DEFAULT: "customDefault",
};

export const edgeTypes = {
	[EDGES_TYPES.DEFAULT]: DefaultEdge,
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
	getNode: state.getNode,
	findNodes: state.findNodes,
	findNode: state.findNode,
	deleteNode: state.deleteNode,
	addEdge: state.addEdge,
	deleteEdge: state.deleteEdge,
	findAndUpdateNode: state.findAndUpdateNode,
	comments: state.comments,
	setComments: state.setComments,
	addComment: state.addComment,
	deleteComment: state.deleteComment,
	updateComment: state.updateComment,
	updateEdge: state.updateEdge,
});
