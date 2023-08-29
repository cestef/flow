import { Handle, Position } from "reactflow";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { memo } from "react";

function ButtonNode({
	data: { label, onClick, disabled },
	id,
	className,
}: { id: string; className?: string; data: any }) {
	return (
		<>
			<Handle type="target" position={Position.Top} />
			<Handle type="source" position={Position.Bottom} />

			<Button
				size="lg"
				className={cn("w-full", className)}
				onClick={onClick}
				id={id}
				disabled={typeof disabled === "function" ? disabled() : disabled}
			>
				{label}
			</Button>
		</>
	);
}

export default memo(ButtonNode);
