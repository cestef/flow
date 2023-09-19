import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	Paintbrush2,
	Strikethrough,
	TextCursor,
	Type,
	Underline,
} from "lucide-react";
import { useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { match } from "ts-pattern";
import { getLabel } from ".";

type EditingType = "label" | "color" | "align" | "textColor" | "fontStyles";
interface EditingDataTypes {
	label: string;
	color: string;
	align: "left" | "center" | "right";
	textColor: string;
	fontStyles: string;
}

export const useEditing = (props?: {
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

export default function DefaultNodeEditor({
	id,
	data: { label, color, textAlign, textColor, fontStyles },
	selected,
	editing: { start, stop, update, toggle, editing },
	updateNode,
}: {
	id: string;
	data: {
		label: string;
		color: string;
		textAlign: "left" | "center" | "right";
		textColor: string;
		fontStyles: string;
	};
	selected: boolean;
	editing: ReturnType<typeof useEditing>;
	updateNode: any;
}) {
	const editingState = editing(id);
	return (
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
					<Button size="smallIcon" variant="ghost">
						<div
							className="w-4 h-4 rounded-[0.25rem] border border-muted-foreground"
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
			<Button size="smallIcon" variant="ghost" onClick={() => toggle(id, "label", label)}>
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
								<AlignCenter className="w-4 h-4" />
							))}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					side="top"
					className="mb-2 rounded-2xl flex flex-row items-center justify-center p-2 w-fit gap-1"
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
			<Popover>
				<PopoverTrigger asChild>
					<Button
						size="smallIcon"
						variant="ghost"
						className="flex items-center justify-center"
						onClick={() => toggle(id, "fontStyles", fontStyles)}
					>
						{getLabel("T", fontStyles, textColor, "text-lg w-4")}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					side="top"
					className="mb-2 rounded-2xl flex flex-row items-center justify-center p-2 w-fit gap-1"
				>
					<Popover
						open={editingState?.type === "textColor"}
						onOpenChange={(e) => (e ? start(id, "textColor", textColor) : stop(id))}
					>
						<PopoverTrigger asChild>
							<Button size="icon" variant="ghost">
								<Paintbrush2
									className={cn("w-6 h-6", {
										"text-foreground": !textColor,
									})}
									style={{ color: textColor }}
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent side="top">
							<HexColorPicker
								className="w-full"
								color={textColor}
								onChange={(e) =>
									updateNode({
										data: {
											textColor: e,
										},
									})
								}
							/>
							<Input
								type="text"
								className="w-full mt-2"
								value={textColor}
								onChange={(e) => {
									updateNode({
										data: {
											textColor: e.target.value,
										},
									});
								}}
							/>
						</PopoverContent>
					</Popover>
					<Button
						size="icon"
						variant={fontStyles.includes("bold") ? "default" : "ghost"}
						onClick={() => {
							const newFontStyles = fontStyles.includes("bold")
								? fontStyles.replace("bold", "")
								: fontStyles + " bold";
							updateNode({
								data: {
									fontStyles: newFontStyles.trim(),
								},
							});
						}}
					>
						<Bold className="w-6 h-6" />
					</Button>
					<Button
						size="icon"
						variant={fontStyles.includes("italic") ? "default" : "ghost"}
						onClick={() => {
							const newFontStyles = fontStyles.includes("italic")
								? fontStyles.replace("italic", "")
								: fontStyles + " italic";
							updateNode({
								data: {
									fontStyles: newFontStyles.trim(),
								},
							});
						}}
					>
						<Italic className="w-6 h-6" />
					</Button>
					<Button
						size="icon"
						variant={fontStyles.includes("underline") ? "default" : "ghost"}
						onClick={() => {
							const newFontStyles = fontStyles.includes("underline")
								? fontStyles.replace("underline", "")
								: fontStyles + " underline";
							updateNode({
								data: {
									fontStyles: newFontStyles.trim(),
								},
							});
						}}
					>
						<Underline className="w-6 h-6" />
					</Button>
					<Button
						size="icon"
						variant={fontStyles.includes("strike") ? "default" : "ghost"}
						onClick={() => {
							const newFontStyles = fontStyles.includes("strike")
								? fontStyles.replace("strike", "")
								: fontStyles + " strike";
							updateNode({
								data: {
									fontStyles: newFontStyles.trim(),
								},
							});
						}}
					>
						<Strikethrough className="w-6 h-6" />
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	);
}
