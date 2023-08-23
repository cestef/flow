import { cn, trpc } from "@/lib/utils";
import { TextCursor, Trash, Workflow } from "lucide-react";
import { memo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "../ui/context-menu";

import { NODES_TYPES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { NodeResizer } from "reactflow";
import { Input } from "../ui/input";

const GroupNode = ({
	data,
	selected,
	id,
}: {
	data: {
		label: string;
		draggedBy: string;
	};
	selected: boolean;
	id: string;
}) => {
	const user = trpc.users.get.useQuery(
		{ id: data.draggedBy },
		{ enabled: !!data.draggedBy },
	);
	const updateNode = trpc.nodes.update.useMutation();
	const deleteNode = trpc.nodes.delete.useMutation();
	const createNode = trpc.nodes.add.useMutation();
	const canvasId = useStore((state) => state.currentCanvasId);
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const [editing, setEditing] = useState<{
		[id: string]: { value: string; status: boolean };
	}>({});
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<>
					{user.data && (
						<Avatar className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary">
							<AvatarImage src={user.data?.image ?? undefined} />
							<AvatarFallback>
								{user.data?.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
					<NodeResizer
						handleClassName="h-3 w-3 rounded-md bg-primary"
						color="#fff"
						isVisible={selected}
						minWidth={200}
						minHeight={240}
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
					{/* <Handle type="target" position={Position.Top} /> */}
					<div
						className={cn(
							"p-4 h-full w-full dark:bg-[rgba(255,255,255,0.1)] rounded-md bg-[rgba(0,0,0,0.1)]",
							user.data && "border-primary border-2",
						)}
						onContextMenu={(e) => {
							// e.preventDefault();
							const { top, left, bottom, right } = (
								e.target as any
							).getBoundingClientRect();
							console.log(top, left, bottom, right);
							// get the relative position of the context menu to the node
							const relativeX = e.clientX - left;
							const relativeY = e.clientY - top;
							// set the context menu position
							setContextMenuPosition(relativeX, relativeY);
						}}
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
							<p className="text-sm font-medium">{data.label}</p>
						)}
					</div>
					{/* <Handle type="source" position={Position.Bottom} /> */}
				</>
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

				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Workflow className="mr-2 w-4 h-4" />
						Add to group
					</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuItem
							inset
							onClick={() => {
								createNode.mutate({
									canvasId,
									name: "Default",
									x: contextMenuPosition.x,
									y: contextMenuPosition.y,
									type: NODES_TYPES.DEFAULT,
									parentId: id,
								});
							}}
						>
							Default
						</ContextMenuItem>
						<ContextMenuItem
							inset
							onClick={() => {
								createNode.mutate({
									canvasId,
									name: "Input",
									x: contextMenuPosition.x,
									y: contextMenuPosition.y,
									type: NODES_TYPES.INPUT,
									parentId: id,
								});
							}}
						>
							Input
						</ContextMenuItem>
						<ContextMenuItem
							inset
							onClick={() => {
								createNode.mutate({
									canvasId,
									name: "Output",
									x: contextMenuPosition.x,
									y: contextMenuPosition.y,
									type: NODES_TYPES.OUTPUT,
									parentId: id,
								});
							}}
						>
							Output
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuItem
					onClick={() => {
						deleteNode.mutate({
							id,
						});
					}}
				>
					<Trash className="w-4 h-4 mr-2" />
					Remove
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default memo(GroupNode);
