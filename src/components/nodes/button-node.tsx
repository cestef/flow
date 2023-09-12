import { Handle, NodeProps, Position } from "reactflow";

import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { Button } from "../ui/button";

function ButtonNode({
	data: { label, onClick, disabled },
	id,
	className,
}: NodeProps & {
	className?: string;
}) {
	const edges = useStore((s) => s.edges);
	const hasOutgoingEdges = edges.some((edge) => edge.source === id);
	const hasIncomingEdges = edges.some((edge) => edge.target === id);
	return (
		<>
			{hasIncomingEdges && <Handle type="target" position={Position.Top} />}
			{hasOutgoingEdges && <Handle type="source" position={Position.Bottom} />}

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
