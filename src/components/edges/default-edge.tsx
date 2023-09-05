import { cn, trpc } from "@/lib/utils";
import { Check, MoreHorizontal, Play, Repeat, Trash } from "lucide-react";
import {
	BaseEdge,
	EdgeLabelRenderer,
	EdgeProps,
	getBezierPath,
} from "reactflow";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
}: EdgeProps) {
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

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
			<EdgeLabelRenderer>
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
						"opacity-0 transition-opacity duration-200",
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
									invertEdge.mutate({
										id,
									});
								}}
							>
								<Repeat className="w-4 h-4 mr-2" />
								Invert
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => {}} className="text-destructive">
								<Trash className="w-4 h-4 mr-2 text-destructive" />
								Remove
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
