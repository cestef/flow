import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";
import { Copy, Pipette, TextCursor, Trash, Unlink } from "lucide-react";
import { DEFAULT_COLORS, SHAPES } from "@/lib/constants";
import { Handle, NodeResizer, Position, useStore } from "reactflow";
import { cn, sanitizeColor, trpc } from "@/lib/utils";
import { memo, useState } from "react";

import { GradientPicker } from "../ui/picker";
import { Input } from "../ui/input";

function ShapeNode({
	data,
	selected,
	id,
	type,
}: {
	data: { label: string; color: string; draggedBy: string };
	selected: boolean;
	id: string;
	xPos: number;
	yPos: number;
	type: string;
}) {
	const user = trpc.users.get.useQuery(
		{ id: data.draggedBy },
		{ enabled: !!data.draggedBy },
	);
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
			case SHAPES.CIRCLE:
				return (
					<>
						<Handle
							type="source"
							position={Position.Bottom}
							className="bg-green-500 w-6 h-3 rounded-sm"
						/>
					</>
				);
			case SHAPES.DIAMOND:
				return (
					<>
						<Handle
							type="target"
							position={Position.Top}
							className="bg-red-500 w-6 h-3 rounded-sm"
						/>
						<Handle
							type="source"
							position={Position.Left}
							className="bg-green-500 w-6 h-3 rounded-sm"
						/>
						<Handle
							type="source"
							position={Position.Right}
							className="bg-green-500 w-6 h-3 rounded-sm"
						/>
					</>
				);
		}
	};

	const getClassNames = (color: string) => {
		switch (type) {
			case SHAPES.CIRCLE:
				return `w-full h-full rounded-[50%] bg-[${color}]`;
			case SHAPES.RECTANGLE:
				return `w-full h-full bg-[${color}]`;
			case SHAPES.ROUNDED_RECTANGLE:
				return `p-4 h-full w-full rounded-lg bg-[${color}]`;
			case SHAPES.DIAMOND: {
				return `w-full h-full bg-[${color}] rounded-md transform rotate-45 scale-[0.7]`;
			}
			case SHAPES.PARALLELOGRAM:
				return `w-full h-full skew-x-12 bg-[${color}]`;
		}
	};

	const [editing, setEditing] = useState<{
		[id: string]: { value: string; status: boolean };
	}>({});

	const [picker, setPicker] = useState<{
		[id: string]: { value: string; status: boolean };
	}>({});

	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<>
					<NodeResizer
						handleClassName="h-3 w-3 rounded-md bg-primary"
						color="#fff"
						isVisible={selected}
						keepAspectRatio={[SHAPES.CIRCLE, SHAPES.DIAMOND].includes(type)}
						minWidth={100}
						minHeight={30}
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
					{user.data && (
						<Avatar className="absolute -top-4 -right-4 w-8 h-8 border-2 border-primary">
							<AvatarImage src={user.data?.image ?? undefined} />
							<AvatarFallback>
								{user.data?.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					)}
					<div
						className={cn(
							getClassNames(data.color || DEFAULT_COLORS[type]),
							"px-4 py-2 shadow-md",
							selected ? "border-primary" : "border-stone-400",
							user.data && "border-primary",
						)}
						style={{
							background: data.color || DEFAULT_COLORS[type],
						}}
					/>

					{getHandles()}

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
							className="text-sm font-medium absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
						/>
					) : (
						<p className="text-sm font-medium absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
							{data.label}
						</p>
					)}
					{picker[id]?.status && (
						<GradientPicker
							background={picker[id].value}
							setBackground={(color) => {
								const sanitized = sanitizeColor(color);
								setPicker((e) => ({
									...e,
									[id]: {
										...e[id],
										value: sanitized,
									},
								}));
								updateNode.mutate({
									id,
									color: sanitized,
								});
							}}
							onSubmit={() => {
								setPicker((e) => ({
									...e,
									[id]: {
										...e[id],
										status: false,
									},
								}));
							}}
						/>
					)}
				</>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() =>
						setEditing((e) => ({
							...e,
							[id]: {
								status: !editing[id]?.status,
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
						setPicker((e) => ({
							...e,
							[id]: {
								status: !picker[id]?.status,
								value: data.color || DEFAULT_COLORS[type],
							},
						}))
					}
				>
					<Pipette className="w-4 h-4 mr-2" />
					Color
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

export default memo(ShapeNode);
