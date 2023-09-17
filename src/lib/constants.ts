import CursorNode from "@/components/flow/nodes/cursor";
import DefaultNode from "@/components/flow/nodes/default";
import { FitViewOptions } from "reactflow";

export const NODE_NAMES = {
	DEFAULT: "customDefault",
	CURSOR: "cursor",
	GROUP: "group",
};
export const NODE_TYPES = {
	[NODE_NAMES.DEFAULT]: DefaultNode,
	[NODE_NAMES.CURSOR]: CursorNode,
};

export const DRAG_THRESHOLD = 100;

export const DEEFAULT_NODE_DIMENSIONS = {
	width: 100,
	height: 50,
};

export const FIT_VIEW: FitViewOptions = {
	padding: 0.35,
	duration: 700,
};
