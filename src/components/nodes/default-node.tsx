import { Copy, TextCursor, Trash, Unlink } from "lucide-react";
import { memo, useState } from "react";
import { Handle, Position, useStore } from "reactflow";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";

import { trpc } from "@/lib/utils";
import { NODES_TYPES } from "../canvas";
import { Input } from "../ui/input";

function DefaultNode({
	data,
	selected,
	id,
	xPos,
	yPos,
	type,
}: {
	data: { label: string };
	selected: boolean;
	id: string;
	xPos: number;
	yPos: number;
	type: string;
}) {
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
	const duplicateNode = trpc.nodes.duplicate.useMutation();
	const getHandles = () => {
		switch (type) {
			case NODES_TYPES.INPUT:
				return (
					<Handle
						type="source"
						position={Position.Bottom}
						className="bg-green-500 w-6 h-3 rounded-sm"
					/>
				);
			case NODES_TYPES.OUTPUT:
				return (
					<Handle
						type="target"
						position={Position.Top}
						className="bg-red-500 w-6 h-3 rounded-sm"
					/>
				);
			default:
				return (
					<>
						<Handle
							type="target"
							position={Position.Top}
							className="bg-red-500 w-6 h-3 rounded-sm"
						/>
						<Handle
							type="source"
							position={Position.Bottom}
							className="bg-green-500 w-6 h-3 rounded-sm"
						/>
					</>
				);
		}
	};
	const [editing, setEditing] = useState<{
		[id: string]: { value: string; status: boolean };
	}>({});

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<div
					className={`px-4 py-2 shadow-md rounded-md bg-accent border-2 ${
						selected ? "border-primary" : "border-stone-400"
					}`}
				>
					{editing[id]?.status ? (
						<Input
							value={editing[id].value}
							onChange={(ev) =>
								setEditing((e) => ({
									...e,
									[id]: {
										...e[id],
										value: ev.target.value,
									},
								}))
							}
							onBlur={() => {
								setEditing((e) => ({
									...e,
									[id]: {
										...e[id],
										status: false,
									},
								}));
								updateNode.mutate({
									id,
									name: editing[id].value,
								});
							}}
						/>
					) : (
						<p className="text-sm font-medium ">{data.label}</p>
					)}

					{getHandles()}
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() =>
						setEditing((e) => ({
							...e,
							[id]: {
								status: true,
								value: data.label,
							},
						}))
					}
				>
					<TextCursor className="w-4 h-4 mr-2" />
					Rename
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() =>
						duplicateNode.mutate({
							id,
							offsetX: 2,
							offsetY: 2,
						})
					}
				>
					<Copy className="w-4 h-4 mr-2" />
					Duplicate
				</ContextMenuItem>
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
