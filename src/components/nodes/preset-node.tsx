import { DRAG_THRESHOLD } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { cn, trpc } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import Draggable from "react-draggable";
import { Node, useReactFlow } from "reactflow";
import useFitText from "use-fit-text";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "../ui/context-menu";

export default function PresetNode({
	node,
}: {
	node: Node;
}) {
	const { ref, fontSize } = useFitText();

	const [position, setPosition] = useStore((state) => [
		state.draggingPosition,
		state.setDraggingPosition,
	]);
	const canvasId = useStore((state) => state.currentCanvasId);

	const { project } = useReactFlow();

	const createNode = trpc.nodes.add.useMutation();
	const deleteNode = trpc.nodes.delete.useMutation();

	return (
		<ContextMenu key={node.id}>
			<ContextMenuTrigger>
				<Draggable
					position={position[node.id]}
					onDrag={(e, data) => {
						setPosition(node.id, data.x, data.y);
					}}
					onStop={(e, data) => {
						// Reset position
						setPosition(node.id, 0, 0);

						if (Math.sqrt(data.x ** 2 + data.y ** 2) < DRAG_THRESHOLD) {
							return;
						}
						const rect = data.node.getBoundingClientRect();
						const projected = project({
							x: rect.x,
							y: rect.y,
						});

						createNode.mutate({
							canvasId: canvasId,
							x: projected.x,
							y: projected.y,
							name: node.data.label,
							type: node.type!,
							borderRadius: node.data.borderRadius ?? undefined,
							borderWidth: node.data.borderWidth ?? undefined,
							borderStyle: node.data.borderStyle ?? undefined,
							borderColor: node.data.borderColor ?? undefined,
							color: node.data.color ?? undefined,
							fontColor: node.data.fontColor ?? undefined,
							fontFamily: node.data.fontFamily ?? undefined,
							fontWeight: node.data.fontWeight ?? undefined,
							fontSize: node.data.fontSize ?? undefined,
							fontSizeAuto: node.data.fontSizeAuto ?? undefined,
							handles: node.data.handles ?? undefined,
							width: (node.style?.width as number) ?? undefined,
							height: (node.style?.height as number) ?? undefined,
							horizontalAlign: node.data.horizontalAlign ?? undefined,
							verticalAlign: node.data.verticalAlign ?? undefined,
						});
					}}
				>
					<div
						className={cn(
							"px-4 py-2 w-[100px] h-[50px]",
							"flex flex-col justify-center relative items-center h-full w-full transition-none",
							!node.data.borderColor && "outline-stone-400",
							!node.data.borderWidth && "outline-2",
							!node.data.color && "bg-accent",
							!node.data.fontColor && "text-primary",
						)}
						style={{
							background: node.data.color ?? undefined,
							borderRadius: node.data.borderRadius ?? 10,
							outlineWidth: node.data.borderWidth,
							outlineColor: node.data.borderColor,
							outlineStyle: node.data.borderStyle ?? "solid",
							color: node.data.fontColor ?? undefined,
							fontSize,
							fontWeight: node.data.fontWeight as any,
							fontFamily: node.data.fontFamily ?? undefined,
						}}
						id={node.id}
						ref={ref}
					>
						<p>{node.data.label}</p>
					</div>
				</Draggable>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					className="text-destructive"
					onClick={() => {
						deleteNode.mutate({
							id: node.id,
						});
					}}
				>
					<Trash2 className="w-4 h-4 mr-2" />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
