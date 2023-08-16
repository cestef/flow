import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Loader2, Plus } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { trpc } from "@/lib/utils";
import useConfirm from "@/lib/useConfirm";
import { useSession } from "next-auth/react";
import { useStore } from "@/store";

export default function MembersPanel() {
	const { data: session } = useSession();
	const currentCanvasId = useStore((state) => state.currentCanvasId);
	const createCanvas = trpc.canvas.add.useMutation();
	const currentCanvas = trpc.canvas.get.useQuery(
		{ id: currentCanvasId },
		{ enabled: !!currentCanvasId },
	);
	const addNewMemberState = useStore((state) => state.addNewMember);
	const toggleAddNewMember = useStore((state) => state.toggleAddNewMember);
	const setAddNewMemberEmail = useStore((state) => state.setAddNewMemberEmail);

	const addMember = trpc.members.add.useMutation({
		onSuccess() {
			toggleAddNewMember(false);
			currentCanvas.refetch();
		},
	});
	const deleteMember = trpc.members.delete.useMutation({
		onSuccess() {
			currentCanvas.refetch();
		},
	});
	const { confirm, modal } = useConfirm();
	return (
		<Card className="w-64 text-right">
			{modal}
			<CardHeader>
				<CardTitle>Members</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-end gap-2">
					<Dialog
						open={addNewMemberState.opened}
						onOpenChange={(e) => toggleAddNewMember(e)}
					>
						<DialogTrigger asChild>
							<Avatar
								className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
								onClick={() => toggleAddNewMember(true)}
							>
								<AvatarFallback>
									<Plus className="w-5 h-5" />
								</AvatarFallback>
							</Avatar>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add new member</DialogTitle>
							</DialogHeader>
							<div className="flex flex-col">
								<Input
									type="email"
									placeholder="Email"
									value={addNewMemberState.email}
									onChange={(e) => setAddNewMemberEmail(e.target.value)}
								/>
							</div>
							<DialogFooter>
								<Button
									variant="secondary"
									onClick={() => toggleAddNewMember(false)}
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={() => {
										// Validate email
										if (
											!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(
												addNewMemberState.email,
											)
										)
											return;
										addMember.mutate({
											canvasId: currentCanvasId,
											email: addNewMemberState.email,
										});
									}}
									disabled={createCanvas.isLoading}
								>
									{createCanvas.isLoading && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Add
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					{(currentCanvas.data?.members.some((e) => e.id === session?.user.id)
						? [currentCanvas.data?.owner]
						: currentCanvas.data?.members ?? []
					).map((member) => (
						<Avatar
							className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
							onClick={async () => {
								const result = await confirm(
									"Are you sure you want to remove this member?",
								);
								if (result) {
									deleteMember.mutate({
										canvasId: currentCanvasId,
										userId: member.id,
									});
								}
							}}
							key={member.id}
						>
							<AvatarImage src={member?.image ?? undefined} />
							<AvatarFallback>
								{member.name?.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					))}
					<Avatar className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
						<AvatarImage src={session?.user.image} />
						<AvatarFallback>
							{session?.user.name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
				</div>
			</CardContent>
		</Card>
	);
}
