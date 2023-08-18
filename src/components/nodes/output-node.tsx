import { Trash, Unlink } from "lucide-react";
import { Handle, Position, useStore } from "reactflow";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";

import { trpc } from "@/lib/utils";
import { memo } from "react";

function DefaultNode({
	data,
	selected,
	id,
}: { data: { label: string }; selected: boolean; id: string }) {
	const parent = useStore((s) => {
		const node = s.nodeInternals.get(id);

		if (!node) {
			return false;
		}
		return s.nodeInternals.get(node.parentNode || "");
	});
	const setNodes = useStore((s) => s.setNodes);
	const getNodes = useStore((s) => s.getNodes);
	const deleteNode = trpc.nodes.delete.useMutation();
	const updateNode = trpc.nodes.update.useMutation();
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={`px-4 py-2 shadow-md rounded-md bg-accent border-2 ${
						selected ? "border-primary" : "border-stone-400"
					}`}
				>
					{data.label} {id}
					<Handle
						type="target"
						position={Position.Top}
						className="bg-red-500 w-6 h-3 rounded-sm"
					/>
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
				{parent && (
					<ContextMenuItem
						onClick={() => {
							const nodes = getNodes();
							const node = nodes.find((node) => node.id === id);
							if (!node) return;
							const absolutePosition = {
								x: node.position.x + parent.position.x,
								y: node.position.y + parent.position.y,
							};
							updateNode.mutate({
								id,
								parentId: null,
								x: absolutePosition.x,
								y: absolutePosition.y,
							});
							setNodes(
								nodes.map((node) => {
									if (node.id === id) {
										return {
											...node,
											parentNode: undefined,
											extent: undefined,
											position: absolutePosition,
											zIndex: 0,
										};
									}
									return node;
								}),
							);
						}}
					>
						<Unlink className="w-4 h-4 mr-2" />
						Ungroup
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default memo(DefaultNode);
