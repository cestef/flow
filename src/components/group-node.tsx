import { Trash, Workflow } from "lucide-react";
import { Handle, NodeResizer, Position, useReactFlow } from "reactflow";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "./ui/context-menu";

import { trpc } from "@/lib/utils";
import { useStore } from "@/store";
import { memo } from "react";

const GroupNode = ({
	data,
	selected,
	id,
}: {
	data: {
		label: string;
	};
	selected: boolean;
	id: string;
}) => {
	const updateNode = trpc.nodes.update.useMutation();
	const deleteNode = trpc.nodes.delete.useMutation();
	const createNode = trpc.nodes.add.useMutation();
	const canvasId = useStore((state) => state.currentCanvasId);
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	return (
		<ContextMenu>
			<ContextMenuTrigger>
				<>
					<NodeResizer
						color="#fff"
						isVisible={selected}
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
					{/* <Handle type="target" position={Position.Top} /> */}
					<div
						className="p-4 h-full w-full dark:bg-[rgba(255,255,255,0.1)] rounded-md bg-[rgba(0,0,0,0.1)]"
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
						{data.label} {id}
					</div>
					{/* <Handle type="source" position={Position.Bottom} /> */}
				</>
			</ContextMenuTrigger>
			<ContextMenuContent>
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
									type: "default",
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
									type: "input",
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
									name: "Custom",
									// relative position to xPos and yPos
									x: contextMenuPosition.x,
									y: contextMenuPosition.y,
									type: "custom",
									parentId: id,
								});
							}}
						>
							Custom
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
