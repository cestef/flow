import { PresenceState } from "@/lib/pluv/bundle";
import { Grab, Hand, MousePointer2, Pipette, Pointer, Scaling, TextCursor } from "lucide-react";
import { memo } from "react";
import { NodeProps } from "reactflow";
import { match } from "ts-pattern";
import { z } from "zod";

const CursorNode = ({ data: { color, state, name }, xPos, yPos }: NodeProps) => {
	return (
		<div className="nodrag pointer-events-none absolute -top-3 -left-3 w-6 h-6 visible">
			{match(state as z.infer<typeof PresenceState>)
				.with("default", () => <Hand color={color} className="w-6 h-6" />)
				.with("grab", () => <Grab color={color} className="w-6 h-6" />)
				.with("select", () => <MousePointer2 color={color} className="w-6 h-6" />)
				.with("text", () => <TextCursor color={color} className="w-6 h-6" />)
				.with("color", () => <Pipette color={color} className="w-6 h-6" />)
				.with("resize", () => <Scaling color={color} className="w-6 h-6" />)
				.exhaustive()}
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
