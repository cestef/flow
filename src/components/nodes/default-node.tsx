import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";
import { Copy, TextCursor, Trash, Unlink } from "lucide-react";
import { Handle, NodeResizer, Position } from "reactflow";
import { NODES_TYPES, flowSelector } from "@/lib/constants";
import { cn, trpc } from "@/lib/utils";
import { memo, useState } from "react";

import { Input } from "../ui/input";
import { useStore } from "@/lib/store";

function DefaultNode({
	data,
	selected,
	id,
	type,
}: {
	data: { label: string; draggedBy: string };
	selected: boolean;
	id: string;
	xPos: number;
	yPos: number;
	type: string;
}) {
	const { findAndUpdateNode, getNode, findNode } = useStore(flowSelector);
	const user = trpc.users.get.useQuery(
		{ id: data.draggedBy },
		{ enabled: !!data.draggedBy },
	);
	const parent = findNode((n) => n.id === getNode(id)?.parentNode);
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
				<NodeResizer
					handleClassName="h-3 w-3 rounded-md bg-primary"
					color="#fff"
					isVisible={selected}
					minWidth={100}
					minHeight={50}
					onResizeEnd={(event, params) => {
						const { width, height, x, y } = params;
						if (!id) return;
						updateNode.mutate({
							id,
							width,
							height,
							x,
							y,
						});
					}}
				/>
				<div
					className={cn(
						"px-4 py-2 shadow-md rounded-md bg-accent border-2 min-w-[100px] min-h-[50px]",
						"flex flex-col justify-center relative items-center h-full w-full",
						selected ? "border-primary" : "border-stone-400",
						user.data && "border-primary",
					)}
					onDoubleClick={() => {
						setEditing((e) => ({
							...e,
							[id]: {
								status: true,
								value: data.label,
							},
						}));
					}}
				>
					{user.data && (
						<Avatar className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary">
							<AvatarImage src={user.data?.image ?? undefined} />
							<AvatarFallback>
								{user.data?.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
					<div className="flex items-center">
						{editing[id]?.status ? (
							<form
								onSubmit={(ev) => {
									ev.preventDefault();
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
							>
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
									className={cn("text-sm font-medium")}
									size={editing[id].value.length + 1}
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
							</form>
						) : (
							<p className="text-sm font-medium ">{data.label}</p>
						)}
					</div>

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
				{parent && (
					<ContextMenuItem
						onClick={() => {
							findAndUpdateNode(
								(n) => n.id === id,
								(node) => {
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
									return {
										...node,
										parentNode: undefined,
										extent: undefined,
										position: absolutePosition,
										zIndex: 0,
									};
								},
							);
						}}
					>
						<Unlink className="w-4 h-4 mr-2" />
						Ungroup
					</ContextMenuItem>
				)}
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

export default memo(DefaultNode);
