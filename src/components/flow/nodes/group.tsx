import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DEFAULT_GROUP_DIMENSIONS } from "@/lib/constants";
import { usePluvMyPresence } from "@/lib/pluv/bundle";
import { cn } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";
import { memo } from "react";
import { NodeProps, NodeResizer, useKeyPress } from "reactflow";

function GroupNode({ data: { label, borderColor }, selected }: NodeProps) {
	const [_, updatePresence] = usePluvMyPresence();
	const alt = useKeyPress("Alt");
	return (
		<GroupContext>
			<div
				className={cn(
					"p-4 h-full w-full dark:bg-[rgba(255,255,255,0.1)] rounded-md bg-[rgba(0,0,0,0.1)]",
					borderColor && "border-primary border-2",
				)}
				style={{
					borderColor,
				}}
			>
				<NodeResizer
					isVisible={selected}
					handleClassName="w-2 h-2 bg-primary"
					handleStyle={{
						borderRadius: 2.5,
					}}
					minWidth={DEFAULT_GROUP_DIMENSIONS.width}
					minHeight={DEFAULT_GROUP_DIMENSIONS.height}
					lineClassName="border-foreground border border-dashed"
					keepAspectRatio={alt}
					onResizeStart={() => {
						updatePresence({
							state: "resize",
						});
					}}
					onResizeEnd={() => {
						updatePresence({
							state: "default",
						});
					}}
				/>
			</div>
		</GroupContext>
	);
}

const GroupContext = ({ children }: { children: React.ReactNode }) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuLabel>Group</ContextMenuLabel>
				<ContextMenuItem>
					<Copy className="w-4 h-4 mr-2" />
					Duplicate
				</ContextMenuItem>
				<ContextMenuItem className="text-destructive">
					<Trash2 className="w-4 h-4 mr-2" />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};

export default memo(GroupNode);
