import CursorNode from "@/components/flow/nodes/cursor";
import DefaultNode from "@/components/flow/nodes/default";
import PreviewNode from "@/components/flow/nodes/preview";
import GroupNode from "@/components/flow/nodes/group";
import RectNode from "@/components/flow/nodes/rect";
import { FitViewOptions } from "reactflow";

export const NODE_NAMES = {
	DEFAULT: "customDefault",
	CURSOR: "cursor",
	RECT: "rect",
	GROUP: "customGroup",
	PREVIEW: "preview",
};
export const NODE_TYPES = {
	[NODE_NAMES.DEFAULT]: DefaultNode,
	[NODE_NAMES.CURSOR]: CursorNode,
	[NODE_NAMES.PREVIEW]: PreviewNode,
	[NODE_NAMES.RECT]: RectNode,
	[NODE_NAMES.GROUP]: GroupNode,
};

export const DRAG_THRESHOLD = 100;

export const DEEFAULT_NODE_DIMENSIONS = {
	width: 100,
	height: 50,
};
export const DEFAULT_GROUP_DIMENSIONS = {
	width: 200,
	height: 200,
};

export const FIT_VIEW: FitViewOptions = {
	padding: 0.35,
	duration: 700,
};
