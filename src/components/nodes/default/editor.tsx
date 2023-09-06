import ComboBox from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { GradientPicker } from "@/components/ui/picker";
import { Popover, PopoverContent } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { flowSelector } from "@/lib/constants";
import { top250 } from "@/lib/fonts";
import { useStore } from "@/lib/store";
import { cn, sanitizeColor, trpc } from "@/lib/utils";
// import { getAvailableFonts } from "@remotion/google-fonts";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useNodeId } from "reactflow";
import useFitText from "use-fit-text";

export const fonts = top250;

export default function NodeEditor({
	label,
	color,
	fontSize,
	fontSizeAuto,
	fontWeight,
	fontFamily,
	verticalAlign,
	horizontalAlign,
}: {
	label: string;
	color: string;
	fontSize: number;
	fontSizeAuto: boolean;
	fontWeight: string;
	fontFamily: string;
	verticalAlign: string;
	horizontalAlign: string;
}) {
	const editing = useStore((state) => state.editing);
	const getEditing = useStore((state) => state.getEditing);
	const setEditing = useStore((state) => state.setEditing);
	const { findAndUpdateNode } = useStore(flowSelector);
	const MupdateNode = trpc.nodes.update.useMutation();
	const { ref, fontSize: autoFontSize } = useFitText({
		minFontSize: 0.1,
	});
	const id = useNodeId();

	if (!id) {
		return null;
	}

	const fontSizeComputed = editing[id]?.font?.size ?? fontSize ?? 16;

	return (
		<div className="flex flex-col items-center w-full h-full">
			<div
				style={{
					color: editing[id]?.font?.color ?? color,
					fontSize: fontSizeComputed,
					fontWeight: editing[id]?.font?.weight ?? fontWeight,
					fontFamily: editing[id]?.font?.family ?? fontFamily,
					justifyContent: verticalAlign ?? "center",
					alignItems: horizontalAlign ?? "center",
				}}
				className={cn("w-full flex flex-col", {
					"h-full": !editing[id]?.name?.status,
				})}
			>
				{editing[id]?.name?.status ? (
					<form
						onSubmit={(ev) => {
							ev.preventDefault();
							setEditing(id, "name", {
								status: false,
							});
							MupdateNode.mutate({
								id,
								name: getEditing(id, "name")?.value,
							});
						}}
					>
						<textarea
							value={editing[id]?.name?.value}
							onChange={(ev) =>
								setEditing(id, "name", {
									value: ev.target.value,
								})
							}
							onBlur={() => {
								setEditing(id, "name", {
									status: false,
								});
								const sanizited = getEditing(id, "name")?.value?.trim();
								findAndUpdateNode(
									(n) => n.id === id,
									(n) => ({
										...n,
										data: {
											...n.data,
											label: sanizited,
										},
									}),
								);
								MupdateNode.mutate({
									id,
									name: sanizited,
								});
							}}
							onKeyDown={(ev) => {
								// If user pressed cmd+enter or ctrl+enter
								if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") {
									ev.preventDefault();
									setEditing(id, "name", {
										status: false,
									});
									const sanizited = getEditing(id, "name")?.value?.trim();
									findAndUpdateNode(
										(n) => n.id === id,
										(n) => ({
											...n,
											data: {
												...n.data,
												label: sanizited,
											},
										}),
									);
									MupdateNode.mutate({
										id,
										name: sanizited,
									});
								}
							}}
							className="w-full resize-none bg-transparent text-center outline-none nodrag"
						/>
					</form>
				) : (
					<p
						style={{
							wordBreak: "break-word",
							fontSize: fontSizeAuto ? autoFontSize : undefined,
						}}
						className="text-center w-full h-full"
						ref={ref}
					>
						{label}
					</p>
				)}
			</div>
			{editing[id]?.picker?.status && (
				<div className="absolute -bottom-56 flex flex-col items-center w-64 h-64 scale-[0.70]">
					<GradientPicker
						background={editing[id]?.picker?.value as string}
						setBackground={(color) => {
							const sanitized = sanitizeColor(color);
							setEditing(id, "picker", {
								value: sanitized,
							});
							MupdateNode.mutate({
								id,
								color: sanitized,
							});
						}}
						onSubmit={() => {
							setEditing(id, "picker", {
								status: false,
							});
						}}
						gradient={true}
						className="w-full h-full nodrag"
					/>
				</div>
			)}

			{editing[id]?.font?.status === "size" && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<Slider
						id="font-size"
						className="nodrag"
						value={[editing[id]?.font?.size || 16]}
						onValueChange={([value]) =>
							setEditing(id, "font", {
								size: value,
							})
						}
						min={0}
						max={100}
						step={1}
					/>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "font", {
								status: undefined,
							});
							MupdateNode.mutate({
								id,
								fontSize: editing[id]?.font?.size,
							});
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
			{editing[id]?.font?.status === "color" && (
				<div className="absolute -bottom-56 flex flex-col items-center w-64 h-64 scale-[0.70]">
					<GradientPicker
						background={editing[id]?.font?.color as string}
						setBackground={(color) => {
							const sanitized = sanitizeColor(color);
							setEditing(id, "font", {
								color: sanitized,
							});
							MupdateNode.mutate({
								id,
								fontColor: sanitized,
							});
						}}
						onSubmit={() => {
							setEditing(id, "font", {
								status: undefined,
							});
						}}
						gradient={false}
						className="w-full h-full"
					/>
				</div>
			)}
			{editing[id]?.font?.status === "weight" && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<Select
						value={editing[id]?.font?.weight || "normal"}
						onValueChange={(value) => setEditing(id, "font", { weight: value })}
					>
						<SelectTrigger>
							<SelectValue placeholder="Font weight" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="normal">Normal</SelectItem>
								<SelectItem value="bold">Bold</SelectItem>
								<SelectItem value="bolder">Bolder</SelectItem>
								<SelectItem value="lighter">Lighter</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "font", {
								status: undefined,
							});
							MupdateNode.mutate({
								id,
								fontWeight: editing[id]?.font?.weight,
							});
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
			{editing[id]?.font?.status === "family" && (
				<div className="absolute -bottom-12 flex flex-row items-center justify-center w-60">
					<ComboBox
						data={fonts.map((font) => ({
							label: font.family,
							value: font.family,
							deletable: false,
						}))}
						value={editing[id]?.font?.family}
						onSelect={(value) => {
							const font = fonts.find((f) => f.family === value);
							if (!font) {
								return console.error("Font not found");
							}
							// For some reason, sometimes the font load fails
							try {
								const loaded = font.load();
								loaded.then((l) => {
									//@ts-ignore
									l.loadFont();
								});
							} catch {}

							setEditing(id, "font", { family: value });
						}}
						getItemStyle={(item) => {
							return {
								fontFamily: item.value,
							};
						}}
						className="nodrag"
					/>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "font", {
								status: undefined,
							});
							MupdateNode.mutate({
								id,
								fontFamily: editing[id]?.font?.family,
							});
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
			{editing[id]?.border?.status === "color" && (
				<div className="absolute -bottom-56 flex flex-col items-center w-64 h-64 scale-[0.70]">
					<GradientPicker
						background={editing[id].border?.color as string}
						setBackground={(color) => {
							const sanitized = sanitizeColor(color);
							setEditing(id, "border", {
								color: sanitized,
							});
							MupdateNode.mutate({
								id,
								borderColor: sanitized,
							});
						}}
						onSubmit={() => {
							setEditing(id, "border", {
								status: undefined,
							});
						}}
						gradient={false}
						className="w-full h-full"
					/>
				</div>
			)}
			{editing[id]?.border?.status === "width" && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<Slider
						id="border-width"
						className="nodrag"
						value={[editing[id].border?.width || 0]}
						onValueChange={([value]) =>
							setEditing(id, "border", {
								width: value,
							})
						}
						min={0}
						max={100}
						step={1}
					/>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "border", {
								status: undefined,
							});
							MupdateNode.mutate({
								id,
								borderWidth: editing[id].border?.width,
							});
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
			{editing[id]?.border?.status === "style" && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<Select
						value={editing[id].border?.style || "solid"}
						onValueChange={(value) =>
							setEditing(id, "border", { style: value })
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Border style" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								<SelectItem value="solid">Solid</SelectItem>
								<SelectItem value="dashed">Dashed</SelectItem>
								<SelectItem value="dotted">Dotted</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "border", {
								status: undefined,
							});
							MupdateNode.mutate({
								id,
								borderStyle: editing[id].border?.style,
							});
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
