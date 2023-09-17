import { cn } from "@/lib/utils";
import { memo, useEffect } from "react";
import { NodeProps, useNodeId } from "reactflow";
import { usePluvMyPresence } from "@/lib/pluv/bundle";
import { useStore } from "@/lib/store";

const CursorNode = ({ data: { label, borderColor, editing }, selected, id }: NodeProps) => {
	const [_, updateMyPresence] = usePluvMyPresence();
	const [nodes, updateNode] = useStore((e) => [e.nodes, e.updateNode] as const);
	useEffect(() => {
		updateMyPresence({ state: editing === "label" ? "text" : "default" });
	}, [editing, updateMyPresence]);
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
			{editing}
			{editing === "label" ? (
				<textarea
					className="w-full h-full bg-transparent resize-none outline-none nodrag"
					defaultValue={label}
					onBlur={(e) => {
						updateNode({ id, data: { label: e.target.value, editing: null } });
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							updateNode({ id, data: { editing: null } });
						}
					}}
				/>
			) : (
				<p>{label}</p>
			)}
		</div>
	);
};

export default memo(CursorNode);
