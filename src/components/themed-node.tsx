import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { Handle, Position } from "reactflow";
import React, { memo } from "react";

import { Trash } from "lucide-react";
import { trpc } from "@/lib/utils";

function ThemedNode({
	data,
	selected,
	id,
}: { data: { label: string }; selected: boolean; id: string }) {
	const deleteNode = trpc.nodes.delete.useMutation();
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={`px-4 py-2 shadow-md rounded-md bg-accent border-2 border-stone-400 ${
						selected ? "border-primary" : ""
					}`}
				>
					{data.label}
					<Handle type="target" position={Position.Top} />
					<Handle type="source" position={Position.Bottom} />
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() =>
						deleteNode.mutate({
							id,
						})
					}
				>
					<Trash className="w-4 h-4 mr-2" />
					Remove
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default memo(ThemedNode);
