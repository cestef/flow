import { ArrowDownRight, Copy, Crown, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

import { useStore } from "@/lib/store";
import useConfirm from "@/lib/useConfirm";
import { trpc } from "@/lib/utils";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useDebounce } from "use-debounce";
import { Button } from "../ui/button";
import { DatePicker } from "../ui/date-picker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

const { publicRuntimeConfig } = getConfig();

const { APP_URL, WS_URL } = publicRuntimeConfig;

export default function MembersPanel() {
	const { data: session } = useSession();
	const currentCanvasId = useStore((state) => state.currentCanvasId);
	// const createCanvas = trpc.canvas.add.useMutation();
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

	const [debouncedEmail] = useDebounce(addNewMemberState.email, 500);

	const findUser = trpc.users.find.useQuery(
		{
			emailOrName: debouncedEmail,
		},
		{
			enabled: !!debouncedEmail,
		},
	);

	const { confirm, modal } = useConfirm();
	const togglePanel = useStore((state) => state.toggleMembersPanel);
	const panelHidden = useStore((state) => state.membersPanelHidden);
	const {
		setCreateInvitePanelMaxUses,
		setCreateInvitePanelExpires,
		createInvitePanel,
		setCreateInvitePanelShowResult,
	} = useStore((state) => ({
		setCreateInvitePanelMaxUses: state.setCreateInvitePanelMaxUses,
		setCreateInvitePanelExpires: state.setCreateInvitePanelExpires,
		createInvitePanel: state.createInvitePanel,
		setCreateInvitePanelShowResult: state.setCreateInvitePanelShowResult,
	}));

	const createInvite = trpc.invites.create.useMutation({
		onSuccess(data) {
			toggleAddNewMember(false);
			setCreateInvitePanelShowResult(data.code);
		},
	});
	return (
		<>
			{modal}

			<Dialog
				open={!!createInvitePanel.showResult}
				onOpenChange={(e) =>
					setCreateInvitePanelShowResult(
						e ? createInvitePanel.showResult : undefined,
					)
				}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite created</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col space-y-2">
						<p className="text-sm font-semibold mb-2 mt-2">
							Share this link with your friends:
						</p>
						<code className="dark:bg-gray-800 bg-gray-100 px-4 py-2 rounded-md w-fit self-center flex items-center">
							{APP_URL}/invite/
							{createInvitePanel.showResult}
							<Button
								size="icon"
								variant="ghost"
								className="ml-2"
								onClick={() =>
									navigator.clipboard.writeText(
										`${APP_URL}/invite/${createInvitePanel.showResult}`,
									)
								}
							>
								<Copy className="w-4 h-4" />
							</Button>
						</code>
					</div>
				</DialogContent>
			</Dialog>
			<Card
				className={`w-64 text-right ${
					panelHidden
						? "transform translate-x-[78%] translate-y-[60%]"
						: "transform translate-x-0"
				} transition-all duration-300 ease-in-out`}
			>
				<Button
					size="icon"
					className="absolute top-4 left-4"
					variant="ghost"
					onClick={() => togglePanel()}
				>
					<ArrowDownRight
						className={`w-4 h-4 ${
							panelHidden ? "rotate-180" : ""
						} transition-all duration-300 ease-in-out`}
					/>
				</Button>
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
								{session && (
									<Avatar
										className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
										onClick={() => toggleAddNewMember(true)}
									>
										<AvatarFallback>
											<Plus className="w-5 h-5" />
										</AvatarFallback>
									</Avatar>
								)}
							</DialogTrigger>

							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add new member</DialogTitle>
								</DialogHeader>
								<Tabs defaultValue="search">
									<TabsList>
										<TabsTrigger value="search">
											Search for a member
										</TabsTrigger>
										<TabsTrigger value="invite">Create an invite</TabsTrigger>
									</TabsList>
									<TabsContent value="invite">
										<div className="flex flex-col gap-4 mt-4">
											<Label htmlFor="uses">
												Max Uses: {createInvitePanel.maxUses}
											</Label>
											<Slider
												id="uses"
												min={1}
												max={30}
												value={[createInvitePanel.maxUses]}
												onValueChange={(e) => setCreateInvitePanelMaxUses(e[0])}
												className="w-full mb-2"
											/>
											<Label htmlFor="expires">Expires</Label>
											<DatePicker
												id="expires"
												date={createInvitePanel.expires}
												setDate={setCreateInvitePanelExpires}
												buttonClassName="w-full"
											/>
											<Button
												className="mt-4"
												onClick={() => {
													createInvite.mutate({
														canvasId: currentCanvasId,
														maxUses: createInvitePanel.maxUses,
														expires: createInvitePanel.expires,
													});
												}}
											>
												Create
											</Button>
										</div>
									</TabsContent>
									<TabsContent value="search">
										<div className="flex flex-col space-y-2">
											<div className="flex w-full items-center space-x-2">
												<Input
													type="email"
													placeholder="Email or name"
													value={addNewMemberState.email}
													onChange={(e) => setAddNewMemberEmail(e.target.value)}
												/>
											</div>
											{(findUser?.data?.length || 0) > 0 ? (
												<div className="flex flex-col space-y-2">
													<p className="text-sm font-semibold mb-2 mt-2">
														Found users:
													</p>
													{findUser.data?.map((user) => (
														<Card>
															<CardHeader>
																<div className="flex items-center space-x-4">
																	<Avatar>
																		<AvatarImage
																			src={user.image ?? undefined}
																		/>
																		<AvatarFallback>
																			{user?.name?.slice(0, 2).toUpperCase()}
																		</AvatarFallback>
																	</Avatar>
																	<p className="text-lg">{user.name}</p>
																	<div className="flex-grow" />
																	<Button
																		onClick={() => {
																			addMember.mutate({
																				canvasId: currentCanvasId,
																				id: user.id,
																			});
																		}}
																	>
																		Add
																	</Button>
																</div>
															</CardHeader>
														</Card>
													))}
												</div>
											) : (
												<div className="flex flex-col space-y-2">
													<p className="text-sm font-semibold mb-2 mt-2">
														No users found.
													</p>
												</div>
											)}
											{addMember.error?.message && (
												<p className="text-red-500 text-sm">
													An error occurred: {addMember.error.message}
												</p>
											)}
										</div>
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
						{(currentCanvas.data?.members.some((e) => e.id === session?.user.id)
							? [
									currentCanvas.data?.owner,
									...currentCanvas.data.members.filter(
										(e) => e.id !== session?.user.id,
									),
							  ]
							: currentCanvas.data?.members ?? []
						).map((member) => (
							<div className="relative" key={member.id}>
								{currentCanvas.data?.owner.id === member.id && (
									// Place a crown icon on the top middle of the avatar
									<Crown className="text-yellow-400 w-4 h-4 absolute -top-3 left-1/2 transform -translate-x-1/2" />
								)}
								<Avatar
									className={`${
										currentCanvas.data?.owner.id === session?.user.id &&
										"cursor-pointer  hover:opacity-80 transition-opacity duration-200"
									}`}
									onClick={async () => {
										if (member.id === session?.user.id) return;
										if (currentCanvas.data?.owner.id !== session?.user.id)
											return;
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
							</div>
						))}
						{session ? (
							<div className="relative">
								{currentCanvas.data?.owner.id === session.user.id && (
									// Place a crown icon on the top middle of the avatar
									<Crown className="text-yellow-400 w-4 h-4 absolute -top-3 left-1/2 transform -translate-x-1/2" />
								)}
								<Avatar className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
									<AvatarImage src={session?.user.image} />
									<AvatarFallback>
										{session?.user.name.slice(0, 2).toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</div>
						) : (
							<p className="text-gray-400">Sign in to add members</p>
						)}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
