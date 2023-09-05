import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn, trpc } from "@/lib/utils";
import {
	AlignHorizontalJustifyCenter,
	AlignHorizontalJustifyEnd,
	AlignHorizontalJustifyStart,
	AlignVerticalJustifyCenter,
	AlignVerticalJustifyEnd,
	AlignVerticalJustifyStart,
	Bold,
	Brush,
	CaseSensitive,
	Copy,
	MessageSquare,
	MoveHorizontal,
	MoveVertical,
	Paintbrush,
	Pipette,
	Plus,
	Repeat,
	Ruler,
	Square,
	Star,
	Text,
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
import { memo, useEffect } from "react";
import NodeEditor, { fonts } from "./editor";

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
		fontFamily: string;
		borderRadius: number;
		borderColor: string;
		borderWidth: number;
		borderStyle: string;
		handles: NodeHandle[];
		verticalAlign: string;
		horizontalAlign: string;
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
	const updateHandle = trpc.nodes.updateHandle.useMutation();
	const duplicateNode = trpc.nodes.duplicate.useMutation();
	const createComment = trpc.comments.add.useMutation();

	const editing = useStore((state) => state.editing);
	const setEditing = useStore((state) => state.setEditing);

	const altPressed = useKeyPress("Alt");

	useEffect(() => {
		const font = fonts.find((f) => f.family === data.fontFamily);
		if (font) {
			// For some reason, sometimes the font load fails
			try {
				// @ts-ignore
				font.load().then((l) => l.loadFont());
			} catch {}
		}
	}, [data.fontFamily]);

	const setInContextMenu = useStore((state) => state.setInContextMenu);

	return (
		<ContextMenu onOpenChange={(o) => setInContextMenu(o)}>
			<ContextMenuTrigger>
				<NodeResizer
					handleClassName="h-3 w-3 rounded-md bg-primary z-10"
					color="var(--color-primary)"
					isVisible={
						selected &&
						!editing[id]?.picker?.status &&
						!editing[id]?.font?.status &&
						!editing[id]?.handle?.status &&
						!editing[id]?.name?.status &&
						!editing[id]?.comment?.status &&
						!editing[id]?.border?.status
					}
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
					lineClassName="z-10"
					keepAspectRatio={altPressed}
				/>
				<BorderResizer visible={selected} />
				<div
					className={cn(
						"px-4 py-2 min-w-[100px] min-h-[50px]",
						"flex flex-col justify-center relative items-center h-full w-full transition-none",
						!data.borderColor && "outline-stone-400",
						!data.borderWidth && "outline-2",
						!data.color && !editing[id]?.picker?.value && "bg-accent",
						!data.fontColor &&
							editing[id]?.font?.status !== "color" &&
							"text-primary",
						user.data && "border-primary",
					)}
					id={id}
					style={{
						background: editing[id]?.picker?.value ?? data.color,
						borderRadius: data.borderRadius ?? 15,
						outlineWidth: editing[id]?.border?.width ?? data.borderWidth,
						outlineColor: editing[id]?.border?.color ?? data.borderColor,
						outlineStyle:
							editing[id]?.border?.style ?? data.borderStyle ?? "solid",
					}}
					onDoubleClick={() => {
						if (
							Object.keys(editing[id] || {})
								.map((k) => (editing as any)[id][k].status)
								.some(Boolean)
						)
							return;
						setEditing(id, "name", {
							status: true,
							value: data.label,
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
						open={editing[id]?.comment?.status}
						onOpenChange={(e) => {
							setEditing(id, "comment", {
								status: e,
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
										setEditing(id, "comment", {
											status: true,
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
										setEditing(id, "comment", {
											status: false,
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

					<NodeEditor
						label={data.label}
						color={data.fontColor}
						fontFamily={data.fontFamily}
						fontSize={data.fontSize}
						fontWeight={data.fontWeight}
						verticalAlign={data.verticalAlign}
						horizontalAlign={data.horizontalAlign}
					/>
					{data.handles &&
						[Position.Left, Position.Right, Position.Bottom, Position.Top].map(
							(position) => {
								const handle = data.handles.find(
									(h) => h.position === position,
								);
								if (handle)
									return (
										<ContextMenu>
											<ContextMenuTrigger>
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
											</ContextMenuTrigger>
											<ContextMenuContent>
												<ContextMenuItem
													onClick={() => {
														updateHandle.mutate({
															id: handle.id,
															type:
																handle.type === "source" ? "target" : "source",
														});
													}}
												>
													<Repeat className="w-4 h-4 mr-2" />
													Toggle type
												</ContextMenuItem>
											</ContextMenuContent>
										</ContextMenu>
									);
								else if (selected)
									return (
										<Popover
											key={position}
											open={
												editing[id]?.handle?.status &&
												editing[id]?.handle?.position === position
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
														setEditing(id, "handle", {
															status: !editing[id]?.handle?.status,
															position: position,
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
														setEditing(id, "handle", {
															status: false,
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
						setEditing(id, "name", {
							status: !editing[id]?.name?.status,
							value: data.label,
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
						duplicateNode.mutate({
							id,
							preset: true,
						});
					}}
				>
					<Star className="mr-2 w-4 h-4" />
					Make preset
				</ContextMenuItem>
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
				<ContextMenuLabel>Style</ContextMenuLabel>
				<ContextMenuItem
					onClick={() =>
						setEditing(id, "picker", {
							status: !editing[id]?.picker?.status,
							value: data.color,
						})
					}
				>
					<Paintbrush className="w-4 h-4 mr-2" />
					Color
				</ContextMenuItem>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Type className="w-4 h-4 mr-2" />
						Font
					</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "font", {
									status: "color",
									color: data.fontColor,
								})
							}
						>
							<Pipette className="w-4 h-4 mr-2" />
							Color
						</ContextMenuItem>
						<ContextMenuSub>
							<ContextMenuSubTrigger>
								<AlignHorizontalJustifyCenter className="w-4 h-4 mr-2" />
								Align
							</ContextMenuSubTrigger>
							<ContextMenuSubContent>
								<ContextMenuSub>
									<ContextMenuSubTrigger>
										<MoveVertical className="w-4 h-4 mr-2" />
										Vertical
									</ContextMenuSubTrigger>
									<ContextMenuSubContent>
										<ContextMenuCheckboxItem
											checked={data.verticalAlign === "start"}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													verticalAlign: e ? "start" : "center",
												});
											}}
										>
											<AlignVerticalJustifyStart className="w-4 h-4 mr-2" />
											Start
										</ContextMenuCheckboxItem>
										<ContextMenuCheckboxItem
											checked={
												data.verticalAlign === "center" || !data.verticalAlign
											}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													verticalAlign: e ? "center" : "center",
												});
											}}
										>
											<AlignVerticalJustifyCenter className="w-4 h-4 mr-2" />
											Center
										</ContextMenuCheckboxItem>
										<ContextMenuCheckboxItem
											checked={data.verticalAlign === "end"}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													verticalAlign: e ? "end" : "center",
												});
											}}
										>
											<AlignVerticalJustifyEnd className="w-4 h-4 mr-2" />
											End
										</ContextMenuCheckboxItem>
									</ContextMenuSubContent>
								</ContextMenuSub>
								<ContextMenuSub>
									<ContextMenuSubTrigger>
										<MoveHorizontal className="w-4 h-4 mr-2" />
										Horizontal
									</ContextMenuSubTrigger>
									<ContextMenuSubContent>
										<ContextMenuCheckboxItem
											checked={data.horizontalAlign === "start"}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													horizontalAlign: e ? "start" : "center",
												});
											}}
										>
											<AlignHorizontalJustifyStart className="w-4 h-4 mr-2" />
											Start
										</ContextMenuCheckboxItem>
										<ContextMenuCheckboxItem
											checked={
												data.horizontalAlign === "center" ||
												!data.horizontalAlign
											}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													horizontalAlign: e ? "center" : "center",
												});
											}}
										>
											<AlignHorizontalJustifyCenter className="w-4 h-4 mr-2" />
											Center
										</ContextMenuCheckboxItem>
										<ContextMenuCheckboxItem
											checked={data.horizontalAlign === "end"}
											onCheckedChange={(e) => {
												updateNode.mutate({
													id,
													horizontalAlign: e ? "end" : "center",
												});
											}}
										>
											<AlignHorizontalJustifyEnd className="w-4 h-4 mr-2" />
											End
										</ContextMenuCheckboxItem>
									</ContextMenuSubContent>
								</ContextMenuSub>
							</ContextMenuSubContent>
						</ContextMenuSub>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "font", { status: "size", size: data.fontSize })
							}
						>
							<Ruler className="w-4 h-4 mr-2" />
							Size
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "font", {
									status: "weight",
									weight: data.fontWeight,
								})
							}
						>
							<Bold className="w-4 h-4 mr-2" />
							Weight
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => {
								setEditing(id, "font", {
									status: "family",
									family: data.fontFamily,
								});
							}}
						>
							<CaseSensitive className="w-4 h-4 mr-2" />
							Family
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSub>
					<ContextMenuSubTrigger>
						<Square className="w-4 h-4 mr-2" />
						Border
					</ContextMenuSubTrigger>
					<ContextMenuSubContent>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "border", {
									status: "color",
									radius: data.borderColor,
								})
							}
						>
							<Pipette className="w-4 h-4 mr-2" />
							Color
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "border", {
									status: "width",
									width: data.borderWidth,
								})
							}
						>
							<Ruler className="w-4 h-4 mr-2" />
							Width
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() =>
								setEditing(id, "border", {
									status: "style",
									style: data.borderStyle,
								})
							}
						>
							<Brush className="w-4 h-4 mr-2" />
							Style
						</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
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
