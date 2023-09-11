import {
	ArrowDownRight,
	Copy,
	Crown,
	Eye,
	Pencil,
	Plus,
	Trash2,
	User,
	UserCog,
} from "lucide-react";
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
import { canEdit, cn, trpc } from "@/lib/utils";
import { useSession } from "next-auth/react";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useDebounce } from "use-debounce";
import { Button } from "../ui/button";
import { DatePicker } from "../ui/date-picker";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Slider } from "../ui/slider";
import { useToast } from "../ui/use-toast";

const { publicRuntimeConfig } = getConfig();

const { APP_URL, WS_URL } = publicRuntimeConfig;

export default function MembersPanel() {
	const { data: session } = useSession();
	const router = useRouter();

	const currentCanvasId = useStore((state) => state.currentCanvasId);
	const addNewMemberState = useStore((state) => state.addNewMember);
	const toggleAddNewMember = useStore((state) => state.toggleAddNewMember);
	const setAddNewMemberEmail = useStore((state) => state.setAddNewMemberEmail);
	const setAddNewMemberPermission = useStore(
		(state) => state.setAddNewMemberPermission,
	);
	const togglePanel = useStore((state) => state.toggleMembersPanel);
	const panelHidden = useStore((state) => state.membersPanelHidden);
	const isMobile = useStore((state) => state.isMobile);
	const toggleCanvasPanel = useStore((state) => state.toggleCanvasPanel);
	const toggleDragPanel = useStore((state) => state.toggleDragPanel);
	const {
		setMaxUses,
		setExpires,
		createInviteStatus,
		setShowResult,
		setCopied,
		setPermission,
	} = useStore((state) => ({
		setMaxUses: state.setCreateInvitePanelMaxUses,
		setExpires: state.setCreateInvitePanelExpires,
		createInviteStatus: state.createInvitePanel,
		setShowResult: state.setCreateInvitePanelShowResult,
		setCopied: state.setCreateInvitePanelCopied,
		setPermission: state.setCreateInvitePanelPermission,
	}));
	const permission = useStore((state) => state.permission);

	const [debouncedEmail] = useDebounce(addNewMemberState.email, 500);

	// const createCanvas = trpc.canvas.add.useMutation();
	const currentCanvas = trpc.canvas.get.useQuery(
		{ id: currentCanvasId },
		{
			enabled: !!currentCanvasId && !["welcome", ""].includes(currentCanvasId),
		},
	);
	const addMember = trpc.members.add.useMutation({
		onSuccess() {
			toggleAddNewMember(false);
			currentCanvas.refetch();
		},
		onError(err) {
			toast({
				title: "An error occurred",
				description: err.message,
				variant: "destructive",
			});
		},
	});
	const deleteMember = trpc.members.delete.useMutation({
		onSuccess() {
			currentCanvas.refetch();
		},
		onError(err) {
			toast({
				title: "An error occurred",
				description: err.message,
				variant: "destructive",
			});
		},
	});
	const updateMemberPermissions = trpc.members.updatePermission.useMutation({
		onSuccess() {
			currentCanvas.refetch();
		},
		onError(err) {
			toast({
				title: "An error occurred",
				description: err.message,
				variant: "destructive",
			});
		},
	});
	const findUser = trpc.users.find.useQuery(
		{
			emailOrName: debouncedEmail,
		},
		{
			enabled: !!debouncedEmail,
		},
	);
	const createInvite = trpc.invites.create.useMutation({
		onSuccess(data) {
			toggleAddNewMember(false);
			setShowResult(data.code);
		},
		onError(err) {
			toast({
				title: "An error occurred",
				description: err.message,
				variant: "destructive",
			});
		},
	});

	const { confirm, modal } = useConfirm();
	const { toast } = useToast();

	return (
		<>
			{modal}

			<Dialog
				open={!!createInviteStatus.showResult}
				onOpenChange={async (e) => {
					if (
						e === false &&
						createInviteStatus.showResult &&
						!createInviteStatus.copied
					) {
						const res = await confirm(
							"Are you sure you want to close this dialog? The invite link will be lost.",
						);
						if (res) {
							setShowResult(undefined);
						}
					} else {
						setShowResult(e ? createInviteStatus.showResult : undefined);
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							<h1 className="text-2xl font-bold">Invite created</h1>
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col space-y-2">
						<p className="text-sm font-semibold mb-2 mt-2">
							Share this link with your friends:
						</p>
						<code className="bg-accent px-4 py-2 rounded-md w-fit self-center flex items-center text-base">
							{APP_URL}/invite/
							{createInviteStatus.showResult}
							<Button
								size="icon"
								variant="ghost"
								className="ml-2"
								onClick={() => {
									navigator.clipboard.writeText(
										`${APP_URL}/invite/${createInviteStatus.showResult}`,
									);
									setCopied(true);
									toast({
										title: "Copied to clipboard",
										description:
											"The invite link has been copied to your clipboard.",
										duration: 3000,
									});
								}}
							>
								<Copy className="w-4 h-4" />
							</Button>
						</code>
					</div>
				</DialogContent>
			</Dialog>
			<Card
				className={cn(
					"w-64 text-right transition-all duration-300 ease-in-out",
					{
						"transform translate-x-[calc(100%-3.5rem)] translate-y-[calc(100%-3.5rem)]":
							panelHidden,
					},
				)}
			>
				<Button
					size="icon"
					className="absolute top-4 left-4"
					variant="ghost"
					onClick={() => {
						togglePanel();
						if (isMobile) {
							toggleCanvasPanel(true);
							toggleDragPanel(true);
						}
					}}
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
							onOpenChange={(e) => {
								if (!canEdit(permission) && e) return;
								toggleAddNewMember(e);
							}}
						>
							<DialogTrigger asChild disabled={!canEdit(permission)}>
								{session && (
									<Avatar
										className={cn({
											"cursor-pointer hover:opacity-80 transition-opacity duration-200":
												canEdit(permission),
											"cursor-not-allowed": !canEdit(permission),
										})}
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
									<TabsContent value="invite" className="p-2 rounded-md">
										<div className="flex flex-col gap-4 mt-4">
											<Label htmlFor="uses">
												Max Uses: {createInviteStatus.maxUses}
											</Label>
											<Slider
												id="uses"
												min={1}
												max={30}
												value={[createInviteStatus.maxUses]}
												onValueChange={(e) => setMaxUses(e[0])}
												className="w-full mb-2"
											/>
											<Label htmlFor="expires">Expires</Label>
											<DatePicker
												id="expires"
												date={createInviteStatus.expires}
												setDate={setExpires}
												buttonClassName="w-full"
											/>
											<Select
												value={createInviteStatus.permission}
												onValueChange={setPermission}
											>
												<SelectTrigger>
													<SelectValue placeholder="Permission" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="view">
														<div className="flex items-center">
															<Eye className="w-4 h-4 mr-2" />
															View
														</div>
													</SelectItem>
													<SelectItem value="edit">
														<div className="flex items-center">
															<Pencil className="w-4 h-4 mr-2" />
															Edit
														</div>
													</SelectItem>
												</SelectContent>
											</Select>
											<Button
												className="mt-4"
												onClick={() => {
													createInvite.mutate({
														canvasId: currentCanvasId,
														maxUses: createInviteStatus.maxUses,
														expires: createInviteStatus.expires,
													});
												}}
											>
												Create
											</Button>
										</div>
									</TabsContent>
									<TabsContent value="search" className="p-2 rounded-md">
										<div className="flex flex-col space-y-2">
											<Label htmlFor="email" className="my-2">
												Search
											</Label>
											<Input
												type="email"
												id="email"
												placeholder="Email or name"
												className="w-full"
												autoComplete="off"
												value={addNewMemberState.email}
												onChange={(e) => setAddNewMemberEmail(e.target.value)}
											/>
											{(findUser?.data?.length || 0) > 0 ? (
												<div className="flex flex-col space-y-2">
													<p className="text-sm font-semibold mb-2 mt-2">
														Found users:
													</p>
													{findUser.data?.map((user) => (
														<Card>
															<CardHeader>
																<div className="flex items-center space-x-6">
																	<Avatar>
																		<AvatarImage
																			src={user.image ?? undefined}
																		/>
																		<AvatarFallback>
																			{user?.name?.slice(0, 2).toUpperCase()}
																		</AvatarFallback>
																	</Avatar>
																	<div className="md:flex-row md:space-x-4 flex flex-col space-y-2">
																		<div className="flex flex-col">
																			<p className="lg:text-2xl text-xl">
																				{user.name ?? user.login}
																			</p>
																			<p className="hidden md:block text-lg text-muted-foreground">
																				{user.login}
																			</p>
																		</div>
																		<div className="md:flex-grow" />
																		<Select
																			value={addNewMemberState.permission}
																			onValueChange={setAddNewMemberPermission}
																		>
																			<SelectTrigger>
																				<SelectValue placeholder="Permission" />
																			</SelectTrigger>
																			<SelectContent>
																				<SelectItem value="view">
																					<div className="flex items-center">
																						<Eye className="w-4 h-4 mr-2" />
																						View
																					</div>
																				</SelectItem>
																				<SelectItem value="edit">
																					<div className="flex items-center">
																						<Pencil className="w-4 h-4 mr-2" />
																						Edit
																					</div>
																				</SelectItem>
																			</SelectContent>
																		</Select>
																	</div>
																	<div className="flex-grow" />

																	<Button
																		onClick={() => {
																			addMember.mutate({
																				canvasId: currentCanvasId,
																				id: user.id,
																				permission:
																					addNewMemberState.permission as
																						| "view"
																						| "edit",
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
										</div>
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
						{(currentCanvas.data?.members.some(
							(e) => e.user.id === session?.user.id,
						)
							? [
									{
										user: currentCanvas.data?.owner,
										permission: "edit",
										id: "",
									},
									...currentCanvas.data.members.filter(
										(e) => e.user.id !== session?.user.id,
									),
							  ]
							: currentCanvas.data?.members ?? []
						).map((member) => (
							<div className="relative" key={member.user.id}>
								{currentCanvas.data?.owner.id === member.user.id && (
									<Crown className="text-yellow-400 w-4 h-4 absolute -top-3 left-1/2 transform -translate-x-1/2" />
								)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Avatar
											className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
											key={member.user.id}
										>
											<AvatarImage src={member?.user.image ?? undefined} />
											<AvatarFallback>
												{member.user.name?.slice(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onClick={() => router.push(`/profile/${member.user.id}`)}
										>
											<User className="w-4 h-4 mr-2" />
											Profile
										</DropdownMenuItem>
										{currentCanvas.data?.owner.id === session?.user.id && (
											<>
												<DropdownMenuSub>
													<DropdownMenuSubTrigger>
														<UserCog className="w-4 h-4 mr-2" />
														Permissions
													</DropdownMenuSubTrigger>
													<DropdownMenuSubContent>
														<DropdownMenuRadioGroup
															value={member.permission}
															onValueChange={(value) => {
																if (["view", "edit"].includes(value))
																	updateMemberPermissions.mutate({
																		canvasId: currentCanvasId,
																		id: member.id,
																		permission: value as "view" | "edit",
																	});
															}}
														>
															<DropdownMenuRadioItem value="view">
																<Eye className="w-4 h-4 mr-2" />
																View
															</DropdownMenuRadioItem>
															<DropdownMenuRadioItem value="edit">
																<Pencil className="w-4 h-4 mr-2" />
																Edit
															</DropdownMenuRadioItem>
														</DropdownMenuRadioGroup>
													</DropdownMenuSubContent>
												</DropdownMenuSub>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive"
													onClick={async () => {
														if (
															currentCanvas.data?.owner.id !== session?.user.id
														)
															return;
														const result = await confirm(
															"Are you sure you want to remove this member?",
														);
														if (result) {
															deleteMember.mutate({
																canvasId: currentCanvasId,
																id: member.id,
															});
														}
													}}
												>
													<Trash2 className="w-4 h-4 mr-2" />
													Remove
												</DropdownMenuItem>
											</>
										)}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
						{session ? (
							<div className="relative">
								{currentCanvas.data?.owner.id === session.user.id && (
									// Place a crown icon on the top middle of the avatar
									<Crown className="text-yellow-400 w-4 h-4 absolute -top-3 left-1/2 transform -translate-x-1/2" />
								)}
								<Avatar>
									<AvatarImage src={session?.user?.image || undefined} />
									<AvatarFallback>
										{(session?.user.name || session.user.login)
											.slice(0, 2)
											.toUpperCase()}
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
