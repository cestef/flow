import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DEEFAULT_NODE_DIMENSIONS } from "@/lib/constants";
import { usePluvMyPresence, usePluvNode } from "@/lib/pluv/bundle";
import { cn } from "@/lib/utils";
import { Copy, Trash2 } from "lucide-react";
import { memo } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { NodeProps, NodeResizer, useKeyPress, useStore as useStoreFlow } from "reactflow";
import { match } from "ts-pattern";
import DefaultNodeEditor, { useEditing } from "./editor";

const DefaultNode = ({
	data: { label, borderColor, color, textAlign, textColor, fontStyles },
	selected,
	id,
}: NodeProps) => {
	const [_, updateNode] = usePluvNode(id);
	const [__, updatePresence] = usePluvMyPresence();
	const alt = useKeyPress("Alt");
	const size = useStoreFlow((s) => {
		const node = s.nodeInternals.get(id);
		if (!node) {
			return {
				width: 0,
				height: 0,
			};
		}
		return {
			width: node.width ?? 0,
			height: node.height ?? 0,
		};
	});
	const { editing, start, stop, update, toggle } = useEditing({
		onStarts: {
			label: () => {
				updatePresence({
					state: "text",
				});
			},
			color: () => {
				updatePresence({
					state: "color",
				});
			},
			textColor: () => {
				updatePresence({
					state: "color",
				});
			},
		},
		onStops: {
			label: () => {
				updatePresence({
					state: "default",
				});
			},
			color: () => {
				updatePresence({
					state: "default",
				});
			},
			textColor: () => {
				updatePresence({
					state: "default",
				});
			},
		},
	});
	const editingState = editing(id);
	return (
		<NodeContext>
			<div
				className={cn("rounded-md p-4 flex items-center text-center", {
					"outline outline-2": borderColor,
					// "outline-stone-500": !selected && !borderColor,
					"bg-accent": !color,
				})}
				id={id}
				style={{
					outlineColor: borderColor ?? undefined,
					width: size.width,
					height: size.height,
					background: color,
					justifyContent: textAlign ?? "center",
					textAlign: textAlign ?? "center",
				}}
				onDoubleClick={(e) => {
					if (![id, "label"].includes((e.target as HTMLElement).id)) return;
					if (!editingState) {
						start(id, "label", label);
					}
				}}
			>
				<NodeResizer
					isVisible={selected}
					handleClassName="w-2 h-2 bg-primary"
					handleStyle={{
						borderRadius: 2.5,
					}}
					minWidth={DEEFAULT_NODE_DIMENSIONS.width}
					minHeight={DEEFAULT_NODE_DIMENSIONS.height}
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
				<DefaultNodeEditor
					{...{
						id,
						data: {
							label,
							color,
							textAlign,
							textColor,
							fontStyles: fontStyles ?? "",
						},
						selected,
						editing: { start, stop, update, toggle, editing },
						updateNode,
					}}
				/>
				{match(editingState.type)
					.with("label", () => (
						<TextareaAutosize
							className={cn(
								"resize-none bg-transparent outline-none nodrag w-full overflow-hidden h-min",
								{
									"font-bold": fontStyles?.includes("bold"),
									italic: fontStyles?.includes("italic"),
									underline: fontStyles?.includes("underline"),
									"line-through": fontStyles?.includes("strike"),
								},
							)}
							style={{
								textAlign: textAlign ?? "center",
								color: textColor,
							}}
							value={editingState.data as string}
							onChange={(e) => {
								update(id, e.target.value);
								updateNode({
									data: {
										label: e.target.value,
									},
								});
							}}
							onBlur={() => {
								stop(id);
								updateNode({
									data: {
										label: editingState.data,
									},
								});
							}}
							autoFocus
							onFocus={(e) => {
								e.target.select();
							}}
						/>
					))
					.otherwise(() => getLabel(label, fontStyles, textColor))}
				{/* {[Position.Left, Position.Right, Position.Top, Position.Bottom].map((position) => (
					<Handle
						key={position}
						id={position}
						position={position}
						type="source"
						className={cn(
							"absolute border rounded-[0.125rem] bg-accent border-foreground opacity-0 transition-opacity duration-200",
							{
								"w-2 h-4":
									position === Position.Left || position === Position.Right,
								"w-4 h-2":
									position === Position.Top || position === Position.Bottom,
								"opacity-100": selected,
								"pointer-events-none": !selected,
							},
						)}
					/>
				))} */}
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

export const getLabel = (
	text: string,
	fontStyles?: string,
	textColor?: string,
	className?: string,
) => {
	const bold = fontStyles?.includes("bold") ? "font-bold" : "";
	const italic = fontStyles?.includes("italic") ? "italic" : "";
	const underline = fontStyles?.includes("underline") ? "underline" : "";
	const strike = fontStyles?.includes("strike") ? "line-through" : "";

	return (
		<p
			className={cn(className, bold, italic, underline, strike)}
			style={{ color: textColor }}
			id="label"
		>
			{text}
		</p>
	);
};

export default memo(DefaultNode);
