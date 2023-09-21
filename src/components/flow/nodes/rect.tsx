import { NodeProps } from "reactflow";
import a from "color-alpha";
import { memo } from "react";

function RectNode({ data: { color, width, height } }: NodeProps) {
	return (
		<div
			style={{
				width,
				height,
				backgroundColor: a(color, 0.3),
				border: "1px solid " + color,
			}}
			className="rounded-[3px]"
		/>
	);
}

export default memo(RectNode);
