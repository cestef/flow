import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "./ui/context-menu";
import { Group, Shapes, Trash, Workflow } from "lucide-react";
import { NODES_TYPES, SHAPES } from "@/lib/constants";

import { trpc } from "@/lib/utils";
import useConfirm from "@/lib/useConfirm";
import { useStore } from "@/lib/store";

export default function CanvasContext({
	children,
}: {
	children: React.ReactNode;
}) {
	const { confirm, modal } = useConfirm();
	const clearCanvas = trpc.canvas.clear.useMutation();
	const createNode = trpc.nodes.add.useMutation();
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const canvasId = useStore((state) => state.currentCanvasId);

	return (
		<>
			{modal}

			<ContextMenu>
				<ContextMenuTrigger>{children}</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuLabel>Add</ContextMenuLabel>
					<ContextMenuSub>
						<ContextMenuSubTrigger>
							<Workflow className="mr-2 w-4 h-4" />
							Nodes
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
									});
								}}
							>
								Output
							</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuSub>
						<ContextMenuSubTrigger>
							<Shapes className="mr-2 w-4 h-4" />
							Shapes
						</ContextMenuSubTrigger>
						<ContextMenuSubContent>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Rectangle",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: SHAPES.RECTANGLE,
										height: 100,
										width: 200,
									});
								}}
							>
								Rectangle
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Rounded Rectangle",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: SHAPES.ROUNDED_RECTANGLE,
										height: 100,
										width: 200,
									});
								}}
							>
								Rounded Rectangle
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Circle",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: SHAPES.CIRCLE,
										height: 100,
										width: 100,
									});
								}}
							>
								Circle
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Diamond",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: SHAPES.DIAMOND,
										height: 100,
										width: 100,
									});
								}}
							>
								Diamond
							</ContextMenuItem>
							<ContextMenuItem
								inset
								onClick={() => {
									createNode.mutate({
										canvasId,
										name: "Parallelogram",
										x: contextMenuPosition.x,
										y: contextMenuPosition.y,
										type: SHAPES.PARALLELOGRAM,
										height: 100,
										width: 200,
									});
								}}
							>
								Parallelogram
							</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuItem
						onClick={() => {
							createNode.mutate({
								canvasId,
								name: "Group",
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
								type: "customGroup",
							});
						}}
					>
						<Group className="mr-2 w-4 h-4" />
						Group
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={async () => {
							const result = await confirm(
								"Are you sure you want to clear the canvas? This action cannot be undone.",
							);
							if (!result) return;
							clearCanvas.mutate({ id: canvasId });
						}}
					>
						<Trash className="mr-2 w-4 h-4" />
						Clear canvas
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</>
	);
}
