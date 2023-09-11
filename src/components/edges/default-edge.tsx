import { flowSelector } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { cn, sanitizeColor, trpc } from "@/lib/utils";
import {
	Check,
	Link,
	MoreHorizontal,
	Pipette,
	Play,
	Repeat,
	TextCursor,
	Trash,
} from "lucide-react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	EdgeProps,
	MarkerType,
	getBezierPath,
} from "reactflow";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { GradientPicker } from "../ui/picker";

export default function DefaultEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
	selected,
	animated,
	data = {},
	source,
	target,
}: EdgeProps) {
	const { getNode } = useStore(flowSelector);
	const sourceNode = getNode(source);
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const updateEdge = trpc.edges.update.useMutation();
	const invertEdge = trpc.edges.invert.useMutation();
	const removeEdge = trpc.edges.delete.useMutation();
	const [editing, setEditing] = useStore((state) => [
		state.editing,
		state.setEditing,
	]);

	return (
		<>
			<BaseEdge
				path={edgePath}
				markerEnd={MarkerType.Arrow}
				style={{
					...style,
					stroke:
						data.linkColor &&
						!["url", "gradient", "transparent"].some((s) =>
							sourceNode?.data.color?.includes(s),
						)
							? sourceNode?.data.color
							: editing[id]?.picker?.value ?? data.color,
				}}
			/>
			<EdgeLabelRenderer>
				{data.label && (
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
							fontSize: 12,
							// everything inside EdgeLabelRenderer has no pointer events by default
							// if you have an interactive element, set pointer-events: all
							pointerEvents: "all",
						}}
						className={cn(
							"opacity-100 transition-opacity duration-200 bg-accent p-1 rounded-md",
							selected && "opacity-0",
						)}
					>
						<p
							className={cn(
								"text-xs text-center opacity-100",
								selected && "opacity-0",
							)}
						>
							{data.label}
						</p>
					</div>
				)}
				<div
					style={{
						position: "absolute",
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						fontSize: 12,
						// everything inside EdgeLabelRenderer has no pointer events by default
						// if you have an interactive element, set pointer-events: all
						pointerEvents: "all",
					}}
					className={cn(
						"opacity-0 transition-opacity duration-200 z-10",
						selected && "opacity-100",
					)}
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="smallIcon" variant="outline" disabled={!selected}>
								<MoreHorizontal className="w-4 h-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onClick={() => {
									setEditing(id, "name", {
										status: true,
										value: data.label,
									});
								}}
							>
								<TextCursor className="w-4 h-4 mr-2" />
								Label
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									setEditing(id, "picker", {
										status: true,
										color: data.color,
									});
								}}
							>
								<Pipette className="w-4 h-4 mr-2" />
								Color
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									updateEdge.mutate({
										id,
										animated: !animated,
									});
								}}
							>
								<Play className="w-4 h-4 mr-2" />
								Animate
								{animated && <Check className="w-4 h-4 ml-auto" />}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									updateEdge.mutate({
										id,
										linkColor: !data.linkColor,
									});
								}}
							>
								<div className="flex justify-between items-center w-full">
									<Link className="w-4 h-4 mr-2" />
									Link Color
									<Check
										className={cn("w-4 h-4 ml-2", {
											"opacity-0": !data.linkColor,
											"opacity-100": data.linkColor,
										})}
									/>
								</div>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									invertEdge.mutate({
										id,
									});
								}}
							>
								<Repeat className="w-4 h-4 mr-2" />
								Invert
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									removeEdge.mutate({
										id,
									});
								}}
								className="text-destructive"
							>
								<Trash className="w-4 h-4 mr-2 text-destructive" />
								Remove
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					{editing[id]?.picker?.status && (
						<div className="scale-75 absolute transform left-1/2 top-0 -translate-x-1/2 -z-1">
							<GradientPicker
								background={editing[id]?.picker?.value as string}
								setBackground={(color) => {
									setEditing(id, "picker", {
										value: color,
									});
								}}
								onSubmit={() => {
									setEditing(id, "picker", {
										status: false,
									});
									if (!editing[id]?.picker?.value) return;
									const sanitized = sanitizeColor(
										editing[id]?.picker?.value as string,
									);
									updateEdge.mutate({
										id,
										color: sanitized,
									});
								}}
								gradient={false}
								className="w-full h-full nodrag"
							/>
						</div>
					)}
					{editing[id]?.name?.status && (
						<div
							className={cn(
								"bg-accent p-1 rounded-md bsolute transform left-1/2 top-0 -translate-x-1/2",
							)}
						>
							<textarea
								className="bg-transparent text-xs resize-none outline-none z-50 self-center"
								value={editing[id]?.name?.value}
								onChange={(e) => {
									setEditing(id, "name", {
										value: e.target.value,
									});
								}}
								onBlur={() => {
									setEditing(id, "name", {
										status: false,
									});
									updateEdge.mutate({
										id,
										name: editing[id]?.name?.value,
									});
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										setEditing(id, "name", {
											status: false,
										});
										updateEdge.mutate({
											id,
											name: editing[id]?.name?.value,
										});
									}
								}}
							/>
						</div>
					)}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
