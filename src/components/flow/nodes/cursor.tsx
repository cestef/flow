import { Grab, Hand, MousePointer2, Pointer } from "lucide-react";
import { memo } from "react";
import { NodeProps } from "reactflow";
const CursorNode = ({ data: { color, state } }: NodeProps) => {
	return (
		<div className="nodrag pointer-events-none">
			{state === "grab" ? (
				<Grab color={color} className="w-6 h-6" />
			) : state === "select" ? (
				<MousePointer2 color={color} className="w-6 h-6" />
			) : (
				<Hand color={color} className="w-6 h-6" />
			)}
		</div>
	);
};

export default memo(CursorNode);
