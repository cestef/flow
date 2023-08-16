import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, LogIn } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import Flow from "@/components/canvas";
import CanvasPanel from "@/components/canvas-panel";
import MembersPanel from "@/components/members-panel";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Panel } from "reactflow";

export default () => {
	const { data: session, status: sessionStatus } = useSession();
	if (sessionStatus === "loading") {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader2 className="h-16 w-16 stroke-2 animate-spin" />
			</div>
		);
	}
	return (
		<div className="h-screen">
			<Flow>
				<Panel position="top-left" className="pl-4 pt-4">
					<ModeToggle />
				</Panel>
				<Panel position="top-right" className="pr-4 pt-4">
					{session ? (
						<div className="flex items-center">
							<Avatar
								className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
								onClick={() => signOut()}
							>
								<AvatarImage src={session.user.image} />
								<AvatarFallback>
									{session.user.name.slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</div>
					) : (
						<Button size="icon" onClick={() => signIn()}>
							<LogIn />
						</Button>
					)}
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
