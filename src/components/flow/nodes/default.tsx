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
import { usePluvMyPresence, usePluvNode } from "@/lib/pluv/bundle";
import { cn } from "@/lib/utils";
import { AlignCenter, AlignLeft, AlignRight, Copy, TextCursor, Trash2, Type } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { NodeProps, NodeResizer, useKeyPress, useStore as useStoreFlow } from "reactflow";
import { match } from "ts-pattern";
import TextareaAutosize from "react-textarea-autosize";

type EditingType = "label" | "color" | "align";
interface EditingDataTypes {
	label: string;
	color: string;
	align: "left" | "center" | "right";
}

const useEditing = (props?: {
	onStarts?: {
		[key: string]: (
			id: string,
			type: EditingType,
			data?: EditingDataTypes[EditingType],
		) => void;
	};
	onStops?: {
		[key: string]: (
			id: string,
			type: EditingType,
			data?: EditingDataTypes[EditingType],
		) => void;
	};
}) => {
	const onStarts = props?.onStarts ?? {};
	const onStops = props?.onStops ?? {};
	const [states, setStates] = useState<{
		[key: string]: {
			type: EditingType;
			data?: EditingDataTypes[EditingType];
		};
	}>({});
	const start = useCallback(
		(id: string, type: EditingType, data?: EditingDataTypes[EditingType]) => {
			if (onStarts[type]) {
				onStarts[type](id, type, data);
			}
			setStates((prev) => ({
				...prev,
				[id]: {
					type,
					data,
				},
			}));
		},
		[],
	);
	const stop = useCallback(
		(id: string) => {
			const type = states[id]?.type;
			const data = states[id]?.data;
			if (type && onStops[type]) {
				onStops[type](id, type, data);
			}
			setStates((prev) => {
				const { [id]: _, ...rest } = prev;
				return rest;
			});
		},
		[states],
	);

	const update = useCallback((id: string, data: EditingDataTypes[EditingType]) => {
		setStates((prev) => ({
			...prev,
			[id]: {
				...prev[id],
				data,
			},
		}));
	}, []);

	const editing = useCallback(
		(id: string) => {
			return states[id] ?? false;
		},
		[states],
	);

	const toggle = useCallback(
		(id: string, type: EditingType, data?: EditingDataTypes[EditingType]) => {
			if (editing(id).type === type) {
				stop(id);
			} else {
				start(id, type, data);
			}
		},
		[editing, start, stop],
	);

	return {
		editing,
		start,
		stop,
		update,
		toggle,
	};
};

const DefaultNode = ({
	data: { label, borderColor, color, textAlign },
	selected,
	id,
}: NodeProps) => {
	const [node, updateNode] = usePluvNode(id);
	const [_, updatePresence] = usePluvMyPresence();
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
					if ((e.target as HTMLElement).id !== id) return;
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
					lineClassName="border-accent border border-dashed"
					keepAspectRatio={alt}
				/>
				<div
					className={cn(
						"px-2 absolute -top-10 h-8 left-1/2 transform -translate-x-1/2 flex items-center justify-center bg-accent/90 rounded-md text-xs font-semibold opacity-0 transition-all duration-200 nodrag gap-2 overflow-hidden",
						{
							"opacity-100": selected,
							"pointer-events-none": !selected,
						},
					)}
				>
					<Popover
						open={editingState?.type === "color"}
						onOpenChange={(e) => (e ? start(id, "color", color) : stop(id))}
					>
						<PopoverTrigger asChild>
							<Button size="smallIcon" variant="ghost" className="border">
								<div
									className="w-4 h-4 rounded-[0.25rem]"
									style={{ backgroundColor: color }}
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent side="top">
							<HexColorPicker
								className="w-full"
								color={color}
								onChange={(e) =>
									updateNode({
										data: {
											color: e,
										},
									})
								}
							/>
							<Input
								type="text"
								className="w-full mt-2"
								value={color}
								onChange={(e) => {
									updateNode({
										data: {
											color: e.target.value,
										},
									});
								}}
							/>
						</PopoverContent>
					</Popover>
					<Button
						size="smallIcon"
						variant="ghost"
						onClick={() => toggle(id, "label", label)}
					>
						<TextCursor className="w-4 h-4" />
					</Button>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								size="smallIcon"
								variant="ghost"
								onClick={() => toggle(id, "align", textAlign)}
							>
								{match(textAlign)
									.with("left", () => <AlignLeft className="w-4 h-4" />)
									.with("center", () => <AlignCenter className="w-4 h-4" />)
									.with("right", () => <AlignRight className="w-4 h-4" />)
									.otherwise(() => (
										<Type className="w-4 h-4" />
									))}
							</Button>
						</PopoverTrigger>
						<PopoverContent
							side="top"
							className="mb-2 rounded-2xl flex flex-row items-center justify-center p-2 w-fit"
						>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => {
									updateNode({
										data: {
											textAlign: "left",
										},
									});
								}}
							>
								<AlignLeft className="w-4 h-4" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => {
									updateNode({
										data: {
											textAlign: "center",
										},
									});
								}}
							>
								<AlignCenter className="w-4 h-4" />
							</Button>
							<Button
								size="icon"
								variant="ghost"
								onClick={() => {
									updateNode({
										data: {
											textAlign: "right",
										},
									});
								}}
							>
								<AlignRight className="w-4 h-4" />
							</Button>
						</PopoverContent>
					</Popover>
				</div>
				{match(editingState.type)
					.with("label", () => (
						<TextareaAutosize
							className="resize-none bg-transparent outline-none nodrag w-full overflow-hidden h-min"
							style={{
								textAlign: textAlign ?? "center",
							}}
							value={editingState.data}
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
					.otherwise(() => (
						<>{label}</>
					))}
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

export default memo(DefaultNode);
