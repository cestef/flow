import { Grab, Hand, MousePointer2, Pointer } from "lucide-react";
import { memo } from "react";
import { NodeProps } from "reactflow";
const CursorNode = ({ data: { color, state, name } }: NodeProps) => {
	return (
		<div className="nodrag pointer-events-none absolute -top-3 -left-3 w-6 h-6 visible">
			{state === "grab" ? (
				<Grab color={color} className="w-6 h-6" />
			) : state === "select" ? (
				<MousePointer2 color={color} className="w-6 h-6" />
			) : (
				<Hand color={color} className="w-6 h-6" />
			)}
			<p
				className="text-center bg-accent/50 px-2 py-1 rounded-sm w-fit absolute -bottom-6 left-1/2 transform -translate-x-1/2"
				style={{ fontSize: "0.5rem", color }}
			>
				{sliceName(name)}
			</p>
		</div>
	);
};

function sliceName(name: string) {
	if (name.length > 8) {
		return name.slice(0, 8) + "...";
	}
	return name;
}

export default memo(CursorNode);
