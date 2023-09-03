import { useStore } from "@/lib/store";
import { cn, trpc } from "@/lib/utils";
import { ArrowDown, Loader2 } from "lucide-react";
import { useRef } from "react";
import PresetNode from "../nodes/preset-node";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function DragPanel() {
	const [panelHidden, togglePanel] = useStore((state) => [
		state.dragPanelHidden,
		state.toggleDragPanel,
	]);
	const toggleCanvasPanel = useStore((state) => state.toggleCanvasPanel);
	const toggleMembersPanel = useStore((state) => state.toggleMembersPanel);
	const isMobile = useStore((state) => state.isMobile);
	const canvasId = useStore((state) => state.currentCanvasId);
	const nodes = useStore((state) => state.nodes);

	const cardRef = useRef<HTMLDivElement>(null);

	return (
		<>
			<Card
				className={`w-52 md:w-96 lg:w-[30rem] text-right ${
					panelHidden
						? "transform translate-y-[calc(100%-3.5rem)]"
						: "transform translate-x-0"
				} transition-all duration-300 ease-in-out flex flex-col justify-center items-center`}
				ref={cardRef}
			>
				<Button
					size="icon"
					variant="ghost"
					className="absolute top-4 right-4"
					onClick={() => {
						togglePanel();
						if (isMobile) {
							toggleCanvasPanel(true);
							toggleMembersPanel(true);
						}
					}}
				>
					<ArrowDown
						className={`w-4 h-4 ${
							panelHidden ? "rotate-180" : ""
						} transition-all duration-300 ease-in-out`}
					/>
				</Button>
				<CardHeader
					className={cn(
						"transition-opacity duration-300 ease-in-out",
						panelHidden ? "opacity-0" : "opacity-100",
					)}
				>
					<CardTitle>Presets</CardTitle>
				</CardHeader>
				<CardContent>
					{nodes.filter((e) => e.data.preset).length === 0 && (
						<p
							className={cn(
								"text-center text-muted-foreground transition-opacity duration-300 ease-in-out",
								panelHidden ? "opacity-0" : "opacity-100",
							)}
						>
							You have no presets yet.
						</p>
					)}
					<div className="flex flex-wrap justify-center gap-x-2 gap-y-4">
						{nodes
							.filter((e) => e.data.preset)
							.map((node) => (
								<PresetNode node={node} />
							))}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
