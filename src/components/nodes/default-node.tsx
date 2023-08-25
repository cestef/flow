import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "../ui/context-menu";
import {
	Copy,
	MessageSquare,
	Pipette,
	TextCursor,
	Trash,
	Type,
	Unlink,
} from "lucide-react";
import { Handle, NodeResizer, Position, useKeyPress } from "reactflow";
import { NODES_TYPES, flowSelector } from "@/lib/constants";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { cn, sanitizeColor, trpc } from "@/lib/utils";
import { memo, useState } from "react";

import BorderResizer from "../border-resizer";
import { Button } from "../ui/button";
import { GradientPicker } from "../ui/picker";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import { useStore } from "@/lib/store";

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
	const parent = findNode((n) => n.id === getNode(id)?.parentNode);
	const deleteNode = trpc.nodes.delete.useMutation();
	const updateNode = trpc.nodes.update.useMutation();
	const duplicateNode = trpc.nodes.duplicate.useMutation();
	const createComment = trpc.comments.add.useMutation();
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
		[id: string]: {
			nameValue: string;
			nameStatus: boolean;
			fontStatus: boolean;
			fontSize: number;
			fontColor: string;
			fontWeight: string;
			pickerStatus: boolean;
			pickerValue: string;
		};
	}>({});

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
						backgroundColor: editing[id]?.pickerValue ?? data.color,
						borderRadius: data.borderRadius ?? 15,
					}}
					onDoubleClick={() => {
						setEditing((e) => ({
							...e,
							[id]: {
								...(e[id] ?? {}),
								nameStatus: true,
								nameValue: data.label,
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
					<div className="flex flex-col items-center">
						{editing[id]?.pickerStatus ? (
							<GradientPicker
								background={editing[id].pickerValue}
								setBackground={(color) => {
									const sanitized = sanitizeColor(color);
									setEditing((e) => ({
										...e,
										[id]: {
											...e[id],
											pickerValue: sanitized,
										},
									}));
									updateNode.mutate({
										id,
										color: sanitized,
									});
								}}
								onSubmit={() => {
									setEditing((e) => ({
										...e,
										[id]: {
											...e[id],
											pickerStatus: false,
										},
									}));
								}}
							/>
						) : !editing[id]?.fontStatus ? (
							<>
								{editing[id]?.nameStatus ? (
									<form
										onSubmit={(ev) => {
											ev.preventDefault();
											setEditing((e) => ({
												...e,
												[id]: {
													...e[id],
													nameStatus: false,
												},
											}));
											updateNode.mutate({
												id,
												name: editing[id].nameValue,
											});
										}}
									>
										<textarea
											value={editing[id].nameValue}
											onChange={(ev) =>
												setEditing((e) => ({
													...e,
													[id]: {
														...e[id],
														nameValue: ev.target.value,
													},
												}))
											}
											onBlur={() => {
												setEditing((e) => ({
													...e,
													[id]: {
														...e[id],
														nameStatus: false,
													},
												}));
												updateNode.mutate({
													id,
													name: editing[id].nameValue,
												});
											}}
											className="w-full h-full resize-none bg-transparent text-center outline-none"
										/>
									</form>
								) : (
									<p
										style={{
											wordBreak: "break-word",
										}}
										className="text-center"
									>
										{data.label}
									</p>
								)}
							</>
						) : (
							<div className="flex flex-col items-center gap-2 w-full">
								<Label htmlFor="font-size" className="mb-1">
									Font Size{" "}
									<code className="ml-1 bg-gray-100 dark:bg-gray-800 rounded-md py-1 px-2 text-primary">
										{editing[id]?.fontSize || 16}px
									</code>
								</Label>
								<Slider
									id="font-size"
									value={[editing[id]?.fontSize || 16]}
									onValueChange={([value]) =>
										setEditing((e) => ({
											...e,
											[id]: {
												...e[id],
												fontSize: value,
											},
										}))
									}
									min={0}
									max={100}
									step={1}
								/>
								<Label htmlFor="font-color" className="mt-2">
									Font Color
								</Label>
								<GradientPicker
									id="font-color"
									// message="Font Color"
									background={editing[id]?.fontColor}
									setBackground={(value) =>
										setEditing((e) => ({
											...e,
											[id]: {
												...e[id],
												fontColor: value,
											},
										}))
									}
									gradient={false}
								/>
								<div className="mb-1" />
								<Select
									value={editing[id]?.fontWeight}
									onValueChange={(value) =>
										setEditing((e) => ({
											...e,
											[id]: {
												...e[id],
												fontWeight: value,
											},
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Font weight" />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectItem value="normal">Normal</SelectItem>
											<SelectItem value="bold">Bold</SelectItem>
											<SelectItem value="bolder">Bolder</SelectItem>
											<SelectItem value="lighter">Lighter</SelectItem>
										</SelectGroup>
									</SelectContent>
								</Select>
								<div className="mb-1" />
								<Button
									onClick={() => {
										setEditing((e) => ({
											...e,
											[id]: {
												...e[id],
												fontStatus: false,
											},
										}));
										updateNode.mutate({
											id,
											fontSize: editing[id].fontSize,
											fontColor: editing[id].fontColor,
											fontWeight: editing[id].fontWeight,
										});
									}}
								>
									Save
								</Button>
							</div>
						)}

						{getHandles()}
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() =>
						setEditing((e) => ({
							...e,
							[id]: {
								...(e[id] ?? {}),
								nameStatus: !editing[id]?.nameStatus,
								nameValue: data.label,
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
						setEditing((e) => ({
							...e,
							[id]: {
								...(e[id] ?? {}),
								pickerStatus: !editing[id]?.pickerStatus,
								pickerValue: data.color,
							},
						}))
					}
				>
					<Pipette className="w-4 h-4 mr-2" />
					Color
				</ContextMenuItem>
				<ContextMenuItem
					onClick={() =>
						setEditing((e) => ({
							...e,
							[id]: {
								...(e[id] ?? {}),
								fontStatus: !editing[id]?.fontStatus,
							},
						}))
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
							canvasId,
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
				>
					<Trash className="w-4 h-4 mr-2" />
					Remove
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default memo(DefaultNode);
