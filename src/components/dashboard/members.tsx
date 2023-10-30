import { Canvas, Member, User } from "@prisma/client";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "../ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Check, Copy, Eye, Pencil, Plus } from "lucide-react";
import { MembersTable } from "../composed/members-table";
import { Button } from "../ui/button";
import { DialogHeader } from "../ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { useState } from "react";
import { createInvite } from "@/lib/mutations/invite";
import getConfig from "next/config";
import { useToast } from "../ui/use-toast";
import { AugmentedCanvas } from "@/pages/dashboard/[[...id]]";
import { useSession } from "next-auth/react";

const { publicRuntimeConfig } = getConfig();
const { APP_URL } = publicRuntimeConfig;

const formSchema = z.object({
	expires: z
		.date()
		.refine((d) => d > new Date(), {
			message: "Date must be in the future.",
		})
		.optional(),
	permission: z.enum(["view", "edit"]),
	uses: z.number().optional(),
});

export default function DashboardMembers({
	canvas,
	data,
}: {
	canvas?: string;
	data?: AugmentedCanvas;
}) {
	const { data: session } = useSession();
	const [open, setOpen] = useState(false);
	const { toast } = useToast();
	const [invite, setInvite] = useState<string | null>(null);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			permission: "view",
		},
	});
	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		if (!canvas) return;
		try {
			const { code } = await createInvite(
				canvas,
				values.expires,
				values.uses,
				values.permission,
			);
			setInvite(code);
			setOpen(false);
		} catch (e: any) {
			toast({
				title: "Error",
				description: e.message,
				duration: 3000,
				variant: "destructive",
			});
		}
	};
	let canInvite = false;
	if ((data?.settings as any)?.members.canInvite) {
		canInvite = true;
	} else if (data?.ownerId === session?.user.id) {
		canInvite = true;
	}

	return (
		<div className="flex flex-col gap-6 items-center justify-center h-[calc(100svh-100px)]">
			<h1 className="text-4xl font-bold">Members</h1>
			<p className="text-xl text-muted-foreground">View and manage members of this canvas.</p>
			<MembersTable
				members={data?.members ?? []}
				className="w-full md:w-[calc(70%-4rem)] min-h-[calc(70%-4rem)]"
			/>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogTrigger asChild>
					<Button size="lg" disabled={!canInvite}>
						<Plus className="mr-2 h-4 w-4" />
						Invite
					</Button>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite a Member</DialogTitle>
					</DialogHeader>
					<Tabs defaultValue="search">
						<TabsList>
							<TabsTrigger value="search">Search</TabsTrigger>
							<TabsTrigger value="invite">Invite</TabsTrigger>
						</TabsList>
						<TabsContent value="search"></TabsContent>
						<TabsContent value="invite">
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-8 w-full"
								>
									<FormField
										control={form.control}
										name="expires"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Expires</FormLabel> <br />
												<FormControl>
													<DatePicker
														date={field.value}
														setDate={field.onChange}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													When the invite expires.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="uses"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Uses:<b> {field.value ?? 1}</b>
												</FormLabel>
												<FormControl>
													<Slider
														min={1}
														max={20}
														value={[field.value ?? 1]}
														onValueChange={(v) => field.onChange(v[0])}
														className="w-full"
													/>
												</FormControl>
												<FormDescription>
													How many times the invite can be used.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="permission"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Permission</FormLabel>
												<FormControl>
													<Select
														value={field.value}
														onValueChange={field.onChange}
													>
														<SelectTrigger>
															<SelectValue>
																<div className="flex items-center space-x-2">
																	{field.value === "view" ? (
																		<Eye className="mr-2 h-4 w-4" />
																	) : (
																		<Pencil className="mr-2 h-4 w-4" />
																	)}
																	{field.value
																		.slice(0, 1)
																		.toUpperCase() +
																		field.value.slice(1)}
																</div>
															</SelectValue>
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="view">
																<div className="flex items-center space-x-2">
																	<Eye className="mr-2 h-4 w-4" />
																	View
																</div>
															</SelectItem>
															<SelectItem value="edit">
																<div className="flex items-center space-x-2">
																	<Pencil className="mr-2 h-4 w-4" />
																	Edit
																</div>
															</SelectItem>
														</SelectContent>
													</Select>
												</FormControl>
												<FormDescription>
													The permission level of the invite.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button type="submit">
										<Check className="mr-2 h-4 w-4" />
										Create
									</Button>
								</form>
							</Form>
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>
			<Dialog open={invite !== null} onOpenChange={(e) => e || setInvite(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Invite Created</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 items-center justify-center">
						<p className="text-xl text-muted-foreground mt-2">
							Share this link with your teammate:
						</p>
						<code className="font-semibold p-4 bg-accent rounded-lg flex items-center space-x-2">
							{APP_URL}/invite/{invite}
							<Button
								size="icon"
								variant="ghost"
								onClick={() => {
									navigator.clipboard.writeText(`${APP_URL}/invite/${invite}`);
									toast({
										title: "Copied to clipboard!",
									});
								}}
							>
								<Copy className="h-4 w-4 ml-2" />
							</Button>
						</code>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
