import { Handle, Position } from "reactflow";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { memo } from "react";

function ButtonNode({
	data: { label, onClick },
	id,
	className,
}: { id: string; className?: string; data: any }) {
	return (
		<>
			<Handle
				type="target"
				position={Position.Top}
				style={{ background: "#555" }}
			/>
			<Button
				size="lg"
				className={cn("w-full", className)}
				onClick={onClick}
				id={id}
			>
				{label}
			</Button>
		</>
	);
}

export default memo(ButtonNode);
