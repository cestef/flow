import Flow from "@/components/canvas";
import ActionsPanel from "@/components/panels/actions-panel";
import CanvasPanel from "@/components/panels/canvas-panel";
import DragPanel from "@/components/panels/drag-panel";
import MembersPanel from "@/components/panels/members-panel";
import UserPanel from "@/components/panels/user-panel";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Panel } from "reactflow";

export default () => {
	const { status: sessionStatus } = useSession();
	const [membersPanelHidden, canvasPanelHidden, dragPanelHidden] = useStore(
		(state) => [
			state.membersPanelHidden,
			state.canvasPanelHidden,
			state.dragPanelHidden,
		],
	);
	if (sessionStatus === "loading") {
		return (
			<div className="flex justify-center items-center h-[100svh]">
				<Loader2 className="h-16 w-16 stroke-2 animate-spin" />
			</div>
		);
	}
	return (
		<div className="h-[100svh] select-none">
			<Flow>
				<Panel position="top-left" className="pl-4 pt-4">
					<ActionsPanel />
				</Panel>
				<Panel position="top-right" className="pr-4 pt-4">
					<UserPanel />
				</Panel>
				<Panel
					position="bottom-left"
					className={cn("transition-all duration-300 ease-in-out", {
						"z-[4]": canvasPanelHidden,
						"z-[6]": !canvasPanelHidden,
						"transform -translate-x-[calc(100%-3.5rem)] translate-y-[calc(100%-3.5rem)]":
							canvasPanelHidden,
					})}
					onContextMenu={(e) => e.preventDefault()}
				>
					<CanvasPanel />
				</Panel>
				<Panel
					position="bottom-right"
					className={cn("transition-all duration-300 ease-in-out", {
						"z-[4]": membersPanelHidden,
						"z-[6]": !membersPanelHidden,
						"transform translate-x-[calc(100%-3.5rem)] translate-y-[calc(100%-3.5rem)]":
							membersPanelHidden,
					})}
					onContextMenu={(e) => e.preventDefault()}
				>
					<MembersPanel />
				</Panel>
				<Panel
					position="bottom-center"
					className={cn(
						"mx-0 transition-all duration-300 ease-in-out -translate-x-1/2",
						{
							"z-[4]": dragPanelHidden,
							"z-[6]": !dragPanelHidden,
							"transform translate-y-[calc(100%-3.5rem)]": dragPanelHidden,
							"transform translate-y-0": !dragPanelHidden,
						},
					)}
					onContextMenu={(e) => e.preventDefault()}
				>
					<DragPanel />
				</Panel>
			</Flow>
		</div>
	);
};
