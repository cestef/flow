import { cn } from "@/lib/utils";
import { memo } from "react";
import { NodeProps } from "reactflow";

const CursorNode = ({ data: { label, borderColor }, selected }: NodeProps) => {
	return (
		<div
			className={cn("outline outline-1 bg-accent rounded-md p-4", {
				"outline-primary": selected,
				"outline-2": selected || borderColor,
				"outline-stone-500": !selected && !borderColor,
			})}
			style={{
				outlineColor: borderColor ?? undefined,
			}}
		>
			{label}
		</div>
	);
};

export default memo(CursorNode);
