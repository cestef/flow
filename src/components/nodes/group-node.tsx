import { NODES_TYPES, flowSelector } from "@/lib/constants";
import { cn, trpc } from "@/lib/utils";
import { Copy, TextCursor, Trash, Unlink, Workflow } from "lucide-react";
import { memo, useState } from "react";
import { NodeResizer, useKeyPress, useReactFlow } from "reactflow";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "../ui/context-menu";

import { useStore } from "@/lib/store";
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
	const { findAndUpdateNode, getNode, findNode } = useStore(flowSelector);
	const user = trpc.users.get.useQuery(
		{ id: data.draggedBy },
		{ enabled: !!data.draggedBy },
	);

	const parent = findNode((n) => n.id === getNode(id)?.parentNode);
	const updateNode = trpc.nodes.update.useMutation();
	const deleteNode = trpc.nodes.delete.useMutation();
	const duplicateNode = trpc.nodes.duplicate.useMutation();
	const createNode = trpc.nodes.add.useMutation();
	const canvasId = useStore((state) => state.currentCanvasId);
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const [editing, setEditing] = useState<{
		[id: string]: { value: string; status: boolean };
	}>({});
	const altPressed = useKeyPress("Alt");
	const setInContextMenu = useStore((state) => state.setInContextMenu);
	const { project } = useReactFlow();

	return (
		<ContextMenu onOpenChange={(o) => setInContextMenu(o)}>
			<ContextMenuTrigger>
				<>
					{user.data && (
						<Avatar className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary">
							<AvatarImage src={(user.data as any)?.image ?? undefined} />
							<AvatarFallback>
								{user.data?.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
					<NodeResizer
						handleClassName="h-3 w-3 rounded-md bg-primary"
						color="#fff"
						isVisible={selected}
						minWidth={260}
						minHeight={200}
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
						keepAspectRatio={altPressed}
					/>
					{/* <Handle type="target" position={Position.Top} /> */}
					<div
						className={cn(
							"p-4 h-full w-full dark:bg-[rgba(255,255,255,0.1)] rounded-md bg-[rgba(0,0,0,0.1)] min-w-[260px] min-h-[200px]",
							user.data && "border-primary border-2",
						)}
						onContextMenu={(e) => {
							// e.preventDefault();
							const { top, left, bottom, right } = (
								e.target as any
							).getBoundingClientRect();
							// console.log(top, left, bottom, right);
							// set the context menu position
							const client = project({
								x: e.clientX,
								y: e.clientY,
							});

							const topLeft = project({
								x: left,
								y: top,
							});

							const relativeX = client.x - topLeft.x;
							const relativeY = client.y - topLeft.y;

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
				<ContextMenuLabel>Add to group</ContextMenuLabel>
				<ContextMenuItem
					onClick={() => {
						createNode.mutate({
							canvasId,
							name: "Node",
							x: contextMenuPosition.x,
							y: contextMenuPosition.y,
							type: NODES_TYPES.DEFAULT,
							parentId: id,
							width: 100,
							height: 50,
						});
					}}
				>
					<Workflow className="mr-2 w-4 h-4" />
					Node
				</ContextMenuItem>
				<ContextMenuSeparator />
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
							offsetX: 5,
							offsetY: 5,
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
					onClick={() => {
						deleteNode.mutate({
							id,
						});
					}}
					className="text-destructive"
				>
					<Trash className="w-4 h-4 mr-2 text-destructive" />
					Remove
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default memo(GroupNode);
