import Flow from "@/components/canvas";
import ActionsPanel from "@/components/panels/actions-panel";
import CanvasPanel from "@/components/panels/canvas-panel";
import MembersPanel from "@/components/panels/members-panel";
import UserPanel from "@/components/panels/user-panel";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Panel } from "reactflow";

export default () => {
	const { status: sessionStatus } = useSession();
	if (sessionStatus === "loading") {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader2 className="h-16 w-16 stroke-2 animate-spin" />
			</div>
		);
	}
	return (
		<div className="h-[100svh]">
			<Flow>
				<Panel position="top-left" className="pl-4 pt-4">
					<ActionsPanel />
				</Panel>
				<Panel position="top-right" className="pr-4 pt-4">
					<UserPanel />
				</Panel>
				<Panel position="bottom-left">
					<CanvasPanel />
				</Panel>
				<Panel position="bottom-right">
					<MembersPanel />
				</Panel>
			</Flow>
		</div>
	);
};
