import { Copy, TextCursor, Trash, Unlink } from "lucide-react";
import { memo, useState } from "react";
import { Handle, NodeResizer, Position, useStore } from "reactflow";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";

import { trpc } from "@/lib/utils";
import { Input } from "../ui/input";

export const SHAPES = {
	CIRCLE: "circle",
	RECTANGLE: "rectangle",
	ROUNDED_RECTANGLE: "rounded-rectangle",
	TRIANGLE: "triangle",
	DIAMOND: "diamond",
	PARALLELOGRAM: "parallelogram",
};

function ShapeNode({
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
			case SHAPES.CIRCLE:
				return (
					<Handle
						type="source"
						position={Position.Bottom}
						className="bg-green-500 w-6 h-3 rounded-sm"
					/>
				);
		}
	};

	const getClassNames = () => {
		switch (type) {
			case SHAPES.CIRCLE:
				return "w-full h-full bg-red-500 rounded-[50%]";
			case SHAPES.RECTANGLE:
				return "w-full h-full bg-blue-500";
			case SHAPES.ROUNDED_RECTANGLE:
				return "p-4 h-full w-full rounded-lg bg-green-500";
			case SHAPES.TRIANGLE:
				return "w-0 h-0 border-transparent border-b-4 border-l-4 border-r-4 border-orange-500";
			case SHAPES.DIAMOND:
				return "w-full h-full transform rotate-45 bg-yellow-500";
			case SHAPES.PARALLELOGRAM:
				return "w-full h-full skew-x-12 bg-purple-500";
		}
	};

	const [editing, setEditing] = useState<{
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
					<div
						className={`${getClassNames()} px-4 py-2 shadow-md rounded-md  ${
							selected ? "border-primary" : "border-stone-400"
						}`}
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
						/>
					) : (
						<p className="text-sm font-medium absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
							{data.label}
						</p>
					)}
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
