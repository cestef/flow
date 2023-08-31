import { Group, MessageSquare, Trash, Workflow } from "lucide-react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "./ui/context-menu";

import { NODES_TYPES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import useConfirm from "@/lib/useConfirm";
import { trpc } from "@/lib/utils";

export default function CanvasContext({
	children,
}: {
	children: React.ReactNode;
}) {
	const { confirm, modal } = useConfirm();
	const clearCanvas = trpc.canvas.clear.useMutation();
	const createNode = trpc.nodes.add.useMutation();
	const createComment = trpc.comments.add.useMutation();
	const contextMenuPosition = useStore((state) => state.contextMenuPosition);
	const canvasId = useStore((state) => state.currentCanvasId);
	const inContextMenu = useStore((state) => state.inContextMenu);
	return (
		<>
			{modal}

			<ContextMenu>
				<ContextMenuTrigger disabled={inContextMenu}>
					{children}
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuLabel>Add</ContextMenuLabel>
					<ContextMenuItem
						onClick={() => {
							createNode.mutate({
								canvasId,
								name: "Node",
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
								type: NODES_TYPES.DEFAULT,
							});
						}}
					>
						<Workflow className="mr-2 w-4 h-4" />
						Node
					</ContextMenuItem>

					<ContextMenuItem
						onClick={() => {
							createNode.mutate({
								canvasId,
								name: "Group",
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
								type: NODES_TYPES.GROUP,
							});
						}}
					>
						<Group className="mr-2 w-4 h-4" />
						Group
					</ContextMenuItem>
					{/* <ContextMenuItem
						onClick={() => {
							createComment.mutate({
								canvasId,
								x: contextMenuPosition.x,
								y: contextMenuPosition.y,
								text: "Comment",
							});
						}}
					>
						<MessageSquare className="mr-2 w-4 h-4" />
						Comment
					</ContextMenuItem> */}
					<ContextMenuSeparator />
					<ContextMenuItem
						onClick={async () => {
							const result = await confirm(
								"Are you sure you want to clear the canvas? This action cannot be undone.",
							);
							if (!result) return;
							clearCanvas.mutate({ id: canvasId });
						}}
						className="text-destructive"
					>
						<Trash className="mr-2 w-4 h-4 text-destructive" />
						Clear canvas
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</>
	);
}
