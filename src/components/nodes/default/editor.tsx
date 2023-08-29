import ComboBox from "@/components/combobox";
import { Button } from "@/components/ui/button";
import { GradientPicker } from "@/components/ui/picker";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { top250 } from "@/lib/fonts";
import { useStore } from "@/lib/store";
import { sanitizeColor, trpc } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useNodeId } from "reactflow";

const fonts = top250;

export default function NodeEditor({
	label,
}: {
	label: string;
}) {
	const editing = useStore((state) => state.editing);
	const getEditing = useStore((state) => state.getEditing);
	const setEditing = useStore((state) => state.setEditing);
	const { theme } = useTheme();
	const updateNode = trpc.nodes.update.useMutation();
	const id = useNodeId();

	if (!id) {
		return null;
	}

	return (
		<div className="flex flex-col items-center w-full">
			{editing[id]?.name?.status ? (
				<form
					onSubmit={(ev) => {
						ev.preventDefault();
						setEditing(id, "name", {
							status: false,
						});
						updateNode.mutate({
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
							updateNode.mutate({
								id,
								name: getEditing(id, "name")?.value,
							});
						}}
						className="w-full resize-none bg-transparent text-center outline-none min-h-6"
					/>
				</form>
			) : (
				<p
					style={{
						wordBreak: "break-word",
					}}
					className="text-center"
				>
					{label}
				</p>
			)}
			{editing[id]?.picker?.status && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<GradientPicker
						background={editing[id]?.picker?.value as string}
						setBackground={(color) => {
							const sanitized = sanitizeColor(color);
							setEditing(id, "picker", {
								value: sanitized,
							});
							updateNode.mutate({
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
						className="w-full h-full"
					/>
				</div>
			)}

			{editing[id]?.font?.status === "size" && (
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<Slider
						id="font-size"
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
							updateNode.mutate({
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
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
					<GradientPicker
						background={editing[id]?.font?.color as string}
						setBackground={(color) => {
							const sanitized = sanitizeColor(color);
							setEditing(id, "font", {
								color: sanitized,
							});
							updateNode.mutate({
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
							updateNode.mutate({
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
				<div className="absolute -bottom-12 left-0 w-full flex flex-row items-center">
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
							const loaded = font.load();

							loaded.then((l) => {
								const info = l.getInfo();
								const styles = Object.keys(info.fonts);
								console.log("Font", info.fontFamily, " Styles", styles);
								for (const style of styles) {
									const weightObject =
										info.fonts[style as keyof typeof info.fonts];
									const weights = Object.keys(weightObject);
									console.log("- Style", style, "supports weights", weights);
									for (const weight of weights) {
										const scripts = Object.keys((weightObject as any)[weight]);
										console.log(
											"-- Weight",
											weight,
											"supports scripts",
											scripts,
										);
									}
								}
							});
							setEditing(id, "font", { family: value });
						}}
					/>
					<Button
						size="icon"
						className="ml-2 min-w-[2rem] h-8"
						onClick={() => {
							setEditing(id, "font", {
								status: undefined,
							});
							// updateNode.mutate({
							//     id,
							//     fontFamily: editing[id]?.font?.family,
							// });
						}}
					>
						<Check className="w-4 h-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
