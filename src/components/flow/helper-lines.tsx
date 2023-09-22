import { CSSProperties, useEffect, useRef } from "react";
import { NodePositionChange, ReactFlowState, XYPosition, useStore, Node } from "reactflow";

const canvasStyle: CSSProperties = {
	width: "100%",
	height: "100%",
	position: "absolute",
	zIndex: 10,
	pointerEvents: "none",
};

const storeSelector = (state: ReactFlowState) => ({
	width: state.width,
	height: state.height,
	transform: state.transform,
});

export type HelperLinesProps = {
	horizontal?: number;
	vertical?: number;
};

// a simple component to display the helper lines
// it puts a canvas on top of the React Flow pane and draws the lines using the canvas API
function HelperLinesRenderer({ horizontal, vertical }: HelperLinesProps) {
	const { width, height, transform } = useStore(storeSelector);

	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");

		if (!ctx || !canvas) {
			return;
		}

		const dpi = window.devicePixelRatio;
		canvas.width = width * dpi;
		canvas.height = height * dpi;

		ctx.scale(dpi, dpi);
		ctx.clearRect(0, 0, width, height);
		ctx.strokeStyle = "#E11D48";

		if (typeof vertical === "number") {
			ctx.moveTo(vertical * transform[2] + transform[0], 0);
			ctx.lineTo(vertical * transform[2] + transform[0], height);
			ctx.stroke();
		}

		if (typeof horizontal === "number") {
			ctx.moveTo(0, horizontal * transform[2] + transform[1]);
			ctx.lineTo(width, horizontal * transform[2] + transform[1]);
			ctx.stroke();
		}
	}, [width, height, transform, horizontal, vertical]);

	return <canvas ref={canvasRef} className="react-flow__canvas" style={canvasStyle} />;
}

export default HelperLinesRenderer;
type GetHelperLinesResult = {
	horizontal?: number;
	vertical?: number;
	snapPosition: Partial<XYPosition>;
};
export function getHelperLines(
	change: NodePositionChange,
	nodes: Node[],
	distance = 5,
): GetHelperLinesResult {
	const defaultResult = {
		horizontal: undefined,
		vertical: undefined,
		snapPosition: { x: undefined, y: undefined },
	};
	const nodeA = nodes.find((node) => node.id === change.id);

	if (!nodeA || !change.position) {
		return defaultResult;
	}

	const nodeABounds = {
		left: change.position.x,
		right: change.position.x + (nodeA.width ?? 0),
		top: change.position.y,
		bottom: change.position.y + (nodeA.height ?? 0),
		width: nodeA.width ?? 0,
		height: nodeA.height ?? 0,
	};

	let horizontalDistance = distance;
	let verticalDistance = distance;

	return nodes
		.filter((node) => node.id !== nodeA.id)
		.filter((node) => node.parentNode === nodeA.parentNode)
		.reduce<GetHelperLinesResult>((result, nodeB) => {
			const parentNodeB = nodes.find((node) => node.id === nodeB.parentNode);

			const nodeBBounds = {
				left: nodeB.position.x + (parentNodeB?.position.x ?? 0),
				right: nodeB.position.x + (nodeB.width ?? 0),
				top: nodeB.position.y + (parentNodeB?.position.y ?? 0),
				bottom: nodeB.position.y + (nodeB.height ?? 0),
				width: nodeB.width ?? 0,
				height: nodeB.height ?? 0,
			};

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//  |
			//  |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left);

			if (distanceLeftLeft < verticalDistance) {
				result.snapPosition.x = nodeBBounds.left;
				result.vertical = nodeBBounds.left;
				verticalDistance = distanceLeftLeft;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//              |
			//              |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceRightRight = Math.abs(nodeABounds.right - nodeBBounds.right);

			if (distanceRightRight < verticalDistance) {
				result.snapPosition.x = nodeBBounds.right - nodeABounds.width;
				result.vertical = nodeBBounds.right;
				verticalDistance = distanceRightRight;
			}

			//              |‾‾‾‾‾‾‾‾‾‾‾|
			//              |     A     |
			//              |___________|
			//              |
			//              |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceLeftRight = Math.abs(nodeABounds.left - nodeBBounds.right);

			if (distanceLeftRight < verticalDistance) {
				result.snapPosition.x = nodeBBounds.right;
				result.vertical = nodeBBounds.right;
				verticalDistance = distanceLeftRight;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//              |
			//              |
			//              |‾‾‾‾‾‾‾‾‾‾‾|
			//              |     B     |
			//              |___________|
			const distanceRightLeft = Math.abs(nodeABounds.right - nodeBBounds.left);

			if (distanceRightLeft < verticalDistance) {
				result.snapPosition.x = nodeBBounds.left - nodeABounds.width;
				result.vertical = nodeBBounds.left;
				verticalDistance = distanceRightLeft;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |     |     B     |
			//  |___________|     |___________|
			const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top);

			if (distanceTopTop < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.top;
				result.horizontal = nodeBBounds.top;
				horizontalDistance = distanceTopTop;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|_________________
			//                    |           |
			//                    |     B     |
			//                    |___________|
			const distanceBottomTop = Math.abs(nodeABounds.bottom - nodeBBounds.top);

			if (distanceBottomTop < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.top - nodeABounds.height;
				result.horizontal = nodeBBounds.top;
				horizontalDistance = distanceBottomTop;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |     |     B     |
			//  |___________|_____|___________|
			const distanceBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom);

			if (distanceBottomBottom < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height;
				result.horizontal = nodeBBounds.bottom;
				horizontalDistance = distanceBottomBottom;
			}

			//                    |‾‾‾‾‾‾‾‾‾‾‾|
			//                    |     B     |
			//                    |           |
			//  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
			//  |     A     |
			//  |___________|
			const distanceTopBottom = Math.abs(nodeABounds.top - nodeBBounds.bottom);

			if (distanceTopBottom < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.bottom;
				result.horizontal = nodeBBounds.bottom;
				horizontalDistance = distanceTopBottom;
			}

			return result;
		}, defaultResult);
}
