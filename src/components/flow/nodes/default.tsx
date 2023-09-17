import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Copy, Pipette, TextCursor, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { NodeProps } from "reactflow";

const CursorNode = ({ data: { label, borderColor }, selected, id }: NodeProps) => {
	const [color, setColor] = useState("#FFFFFF");
	return (
		<NodeContext>
			<div
				className={cn("outline outline-1 bg-accent rounded-md p-4", {
					"outline-primary": selected,
					"outline-2": selected || borderColor,
					"outline-stone-500": !selected && !borderColor,
				})}
				style={{
					outlineColor: borderColor ?? undefined,
				}}
			>
				<div
					className={cn(
						"px-2 absolute -top-10 h-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center bg-accent/90 rounded-md text-xs font-semibold opacity-0 transition-all duration-200 nodrag gap-2",
						{
							"opacity-100": selected,
							"pointer-events-none": !selected,
						},
					)}
				>
					<Popover>
						<PopoverTrigger asChild>
							<Button size="smallIcon" variant="ghost">
								<div
									className="w-4 h-4 rounded-[0.25rem]"
									style={{ backgroundColor: color }}
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent>
							<HexColorPicker
								className="w-full"
								color={color}
								onChange={(e) => setColor(e.toUpperCase())}
							/>
							<Input
								type="text"
								className="w-full mt-2"
								value={color}
								onChange={(e) => setColor(e.target.value)}
							/>
						</PopoverContent>
					</Popover>
					<Button size="smallIcon" variant="ghost">
						<TextCursor className="w-4 h-4" />
					</Button>
				</div>

				{label}
			</div>
		</NodeContext>
	);
};

const NodeContext = ({ children }: { children: React.ReactNode }) => {
	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuLabel>Node</ContextMenuLabel>
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

export default memo(CursorNode);
