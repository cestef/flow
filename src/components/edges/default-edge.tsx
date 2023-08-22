import {
	BaseEdge,
	EdgeLabelRenderer,
	EdgeProps,
	getBezierPath,
} from "reactflow";

import React from "react";

export default function DefaultEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
}: EdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	return (
		<>
			<BaseEdge
				path={edgePath}
				markerEnd={markerEnd}
				style={style}
				label="Test"
			/>
			{/* <EdgeLabelRenderer>
				<div
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						fontSize: 12,
						// everything inside EdgeLabelRenderer has no pointer events by default
						// if you have an interactive element, set pointer-events: all
						pointerEvents: "all",
					}}
					className="nodrag nopan"
				/>
			</EdgeLabelRenderer> */}
		</>
	);
}
