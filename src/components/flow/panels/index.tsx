import { useStore } from "@/lib/store";
import { Panel } from "reactflow";
import CanvasPanel from "./canvas";
import { cn } from "@/lib/utils";

export default function Panels() {
	const canvasPanelOpen = useStore((state) => state.canvasPanel);
	return (
		<>
			<Panel
				position="bottom-left"
				className={cn("transition-all duration-300 ease-in-out", {
					"z-[4]": !canvasPanelOpen,
					"z-[6]": canvasPanelOpen,
					"transform -translate-x-[calc(100%-3.5rem)] translate-y-[calc(100%-3.5rem)]":
						!canvasPanelOpen,
				})}
				onContextMenu={(e) => e.preventDefault()}
			>
				<CanvasPanel />
			</Panel>
		</>
	);
}
