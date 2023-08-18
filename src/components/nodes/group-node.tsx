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
} from "../ui/context-menu";

import { trpc } from "@/lib/utils";
import { useStore } from "@/store";
import { memo } from "react";
import { NODES_TYPES } from "../canvas";

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
						handleClassName="h-3 w-3 rounded-md bg-primary"
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
