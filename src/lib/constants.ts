import CursorNode from "@/components/flow/nodes/cursor";
import DefaultNode from "@/components/flow/nodes/default";
import PreviewNode from "@/components/flow/nodes/preview";
import RectNode from "@/components/flow/nodes/rect";
import { FitViewOptions } from "reactflow";

export const NODE_NAMES = {
	DEFAULT: "customDefault",
	CURSOR: "cursor",
	RECT: "rect",
	GROUP: "group",
	PREVIEW: "preview",
};
export const NODE_TYPES = {
	[NODE_NAMES.DEFAULT]: DefaultNode,
	[NODE_NAMES.CURSOR]: CursorNode,
	[NODE_NAMES.PREVIEW]: PreviewNode,
	[NODE_NAMES.RECT]: RectNode,
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
