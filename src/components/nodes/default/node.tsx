import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { cn, trpc } from "@/lib/utils";
import {
	Copy,
	MessageSquare,
	Pipette,
	Plus,
	TextCursor,
	Trash,
	Type,
	Unlink,
	X,
} from "lucide-react";
import {
	Handle,
	HandleType,
	NodeResizer,
	Position,
	useKeyPress,
} from "reactflow";

import BorderResizer from "@/components/border-resizer";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { flowSelector } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { NodeHandle } from "@prisma/client";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { memo } from "react";
import NodeEditor from "./editor";

function DefaultNode({
	data,
	selected,
	id,
	type,
}: {
	data: {
		label: string;
		draggedBy: string;
		color: string;
		fontColor: string;
		fontSize: number;
		fontWeight: string;
		borderRadius: number;
		handles: NodeHandle[];
	};
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
	const canvasId = useStore((state) => state.currentCanvasId);
	const comments = useStore((state) =>
		state.comments.filter((c) => c.nodeId === id),
	);
	const parent = findNode((n) => n.id === getNode(id)?.parentNode);
	const deleteNode = trpc.nodes.delete.useMutation();
	const updateNode = trpc.nodes.update.useMutation();
	const duplicateNode = trpc.nodes.duplicate.useMutation();
	const createComment = trpc.comments.add.useMutation();

	const editing = useStore((state) => state.editing);
	const setEditing = useStore((state) => state.setEditing);

	const altPressed = useKeyPress("Alt");

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<NodeResizer
					handleClassName="h-3 w-3 rounded-md bg-primary"
					color="#fff"
					isVisible={selected && !editing[id]?.fontStatus}
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
					keepAspectRatio={altPressed}
				/>
				<BorderResizer visible={selected} />
				<div
					className={cn(
						"px-4 py-2 shadow-md border-2 min-w-[100px] min-h-[50px]",
						"flex flex-col justify-center relative items-center h-full w-full transition-none",
						selected ? "border-primary" : "border-stone-400",
						!data.color && !editing[id]?.pickerValue && "bg-accent",
						!data.fontColor && !editing[id]?.fontColor && "text-primary",
						user.data && "border-primary",
						editing[id]?.fontStatus && "min-h-[300px] min-w-[200px]",
					)}
					id={id}
					style={{
						color: editing[id]?.fontColor ?? data.fontColor,
						fontSize: editing[id]?.fontSize ?? data.fontSize ?? 16,
						fontWeight: editing[id]?.fontWeight ?? data.fontWeight,
						background: editing[id]?.pickerValue ?? data.color,
						borderRadius: data.borderRadius ?? 15,
					}}
					onDoubleClick={() => {
						setEditing(id, {
							nameStatus: true,
							nameValue: data.label,
						});
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

					<Popover
						open={editing[id]?.commentStatus}
						onOpenChange={(e) => {
							setEditing(id, {
								commentStatus: e,
							});
						}}
					>
						<PopoverTrigger>
							{selected && comments.length > 0 && (
								<Button
									size="icon"
									variant="ghost"
									className="absolute top-1/2 -translate-y-1/2 -right-12 text-primary"
									onClick={() => {
										setEditing(id, {
											commentStatus: true,
										});
									}}
								>
									<MessageSquare className="w-4 h-4" />
								</Button>
							)}
						</PopoverTrigger>
						<PopoverContent>
							<div className="flex justify-between items-center">
								<p className="text-primary text-sm font-semibold">Comments</p>
								<Button
									size="smallIcon"
									variant="ghost"
									className="text-destructive"
									onClick={(e) => {
										e.stopPropagation();
										setEditing(id, {
											commentStatus: false,
										});
									}}
								>
									<X className="w-3 h-3" />
								</Button>
							</div>
							<div className="flex flex-col gap-2 mt-5 max-h-[300px] overflow-y-auto">
								{comments.map((comment) => (
									<div
										key={comment.id}
										className="flex flex-col gap-2 mb-2 bg-card dark:bg-gray-900 rounded-md p-2 border border-gray-200 dark:border-gray-700"
									>
										<p className="text-primary text-sm font-semibold">
											{comment.text}
										</p>
										<p className="text-gray-500 text-xs font-medium">
											{comment.user?.name || "Unknown user"}
										</p>
									</div>
								))}
							</div>
						</PopoverContent>
					</Popover>

					<NodeEditor label={data.label} />
					{/* <Handle type={"source"} position={Position.Top} /> */}
					{[Position.Left, Position.Right, Position.Bottom, Position.Top].map(
						(position) => {
							const handle = data.handles.find((h) => h.position === position);
							if (handle)
								return (
									<Handle
										type={
											(data.handles.find((h) => h.position === position)
												?.type ?? "target") as HandleType
										}
										position={position}
										key={position}
										className={cn({
											"bg-primary": handle.type === "source",
											"bg-accent": handle.type === "target",
										})}
										id={handle.id}
									/>
								);
							return (
								<Popover
									key={position}
									open={
										editing[id]?.handleStatus &&
										editing[id]?.handlePosition === position
									}
								>
									<PopoverTrigger asChild>
										<Button
											size="smallIcon"
											variant="dotted"
											key={position}
											className={cn(
												"border absolute nodrag opacity-0 hover:opacity-100 transition-opacity",
												{
													"-top-8": position === Position.Top,
													"-left-8": position === Position.Left,
													"-right-8": position === Position.Right,
													"-bottom-8": position === Position.Bottom,
												},
											)}
											onClick={() => {
												setEditing(id, {
													handleStatus: true,
													handlePosition: position,
												});
											}}
										>
											<Plus className="w-4 h-4 text-primary" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										side={position}
										className="bg-transparent shadow-none border-none w-40"
									>
										<Select
											onValueChange={(e) => {
												updateNode.mutate({
													id,
													handles: [
														{
															position,
															type: e,
														},
													],
												});
												setEditing(id, {
													handleStatus: false,
												});
											}}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="source">Source</SelectItem>
												<SelectItem value="target">Target</SelectItem>
											</SelectContent>
										</Select>
									</PopoverContent>
								</Popover>
							);
						},
					)}
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() =>
						setEditing(id, {
							nameStatus: !editing[id]?.nameStatus,
							nameValue: data.label,
						})
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
				<ContextMenuItem
					onClick={() =>
						setEditing(id, {
							pickerStatus: !editing[id]?.pickerStatus,
							pickerValue: data.color,
						})
					}
				>
					<Pipette className="w-4 h-4 mr-2" />
					Color
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() =>
						setEditing(id, {
							fontStatus: !editing[id]?.fontStatus,
							fontColor: data.fontColor,
							fontSize: data.fontSize,
							fontWeight: data.fontWeight,
						})
					}
				>
					<Type className="w-4 h-4 mr-2" />
					Font
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
						createComment.mutate({
							nodeId: id,
							text: "Comment",
						});
					}}
				>
					<MessageSquare className="mr-2 w-4 h-4" />
					Comment
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem
					onClick={() =>
						deleteNode.mutate({
							id,
						})
					}
					className="text-destructive"
				>
					<Trash className="w-4 h-4 mr-2 text-destructive" />
					Remove
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default memo(DefaultNode);
