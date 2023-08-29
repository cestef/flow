import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { sanitizeColor, trpc } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GradientPicker } from "@/components/ui/picker";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { useNodeId } from "reactflow";

export default function NodeEditor({
	label,
}: {
	label: string;
}) {
	const editing = useStore((state) => state.editing);
	const setEditing = useStore((state) => state.setEditing);
	const updateNode = trpc.nodes.update.useMutation();
	const id = useNodeId();

	if (!id) {
		return null;
	}

	return (
		<div className="flex flex-col items-center w-full">
			{editing[id]?.pickerStatus ? (
				<GradientPicker
					background={editing[id].pickerValue}
					setBackground={(color) => {
						const sanitized = sanitizeColor(color);
						setEditing(id, {
							pickerValue: sanitized,
						});
						updateNode.mutate({
							id,
							color: sanitized,
						});
					}}
					onSubmit={() => {
						setEditing(id, {
							pickerStatus: false,
						});
					}}
					gradient={true}
					className="w-full h-full"
				/>
			) : !editing[id]?.fontStatus ? (
				<>
					{editing[id]?.nameStatus ? (
						<form
							onSubmit={(ev) => {
								ev.preventDefault();
								setEditing(id, {
									nameStatus: false,
								});
								updateNode.mutate({
									id,
									name: editing[id].nameValue,
								});
							}}
						>
							<textarea
								value={editing[id].nameValue}
								onChange={(ev) =>
									setEditing(id, {
										nameValue: ev.target.value,
									})
								}
								onBlur={() => {
									setEditing(id, {
										nameStatus: false,
									});
									updateNode.mutate({
										id,
										name: editing[id].nameValue,
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
				</>
			) : (
				<div className="flex flex-col items-center gap-2 w-full">
					<Label htmlFor="font-size" className="mb-1">
						Font Size{" "}
						<code className="ml-1 bg-gray-100 dark:bg-gray-800 rounded-md py-1 px-2 text-primary">
							{editing[id]?.fontSize || 16}px
						</code>
					</Label>
					<Slider
						id="font-size"
						value={[editing[id]?.fontSize || 16]}
						onValueChange={([value]) =>
							setEditing(id, {
								fontSize: value,
							})
						}
						min={0}
						max={100}
						step={1}
					/>
					<Label htmlFor="font-color" className="mt-2">
						Font Color
					</Label>
					<GradientPicker
						id="font-color"
						// message="Font Color"
						background={editing[id]?.fontColor}
						setBackground={(value) =>
							setEditing(id, {
								fontColor: value,
							})
						}
						gradient={false}
					/>
					<div className="mb-1" />
					<Select
						value={editing[id]?.fontWeight}
						onValueChange={(value) =>
							setEditing(id, {
								fontWeight: value,
							})
						}
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
					<div className="mb-1" />
					<Button
						onClick={() => {
							setEditing(id, {
								fontStatus: false,
							});
							updateNode.mutate({
								id,
								fontSize: editing[id].fontSize,
								fontColor: editing[id].fontColor,
								fontWeight: editing[id].fontWeight,
							});
						}}
					>
						Save
					</Button>
				</div>
			)}
		</div>
	);
}
