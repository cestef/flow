import { LogIn } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Switch } from "../ui/switch";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { useStore } from "@/lib/store";
import { trpc } from "@/lib/utils";
import { Separator } from "../ui/separator";

const SettingsFormSchema = z.object({
	watermark: z.boolean(),
	public: z.boolean(),
	canvas_count: z.boolean(),
});

export function SettingsForm() {
	const [settingsOpen, setSettingsOpen] = useStore(
		(s) => [s.userSettingsOpen, s.setUserSettingsOpen] as const,
	);
	const [settings, setSettings] = useStore(
		(s) => [s.settings, s.setSettings] as const,
	);

	const updateSettings = trpc.users.updateSettings.useMutation({
		onSuccess(data) {
			if (data) {
				setSettings(data);
			}
		},
	});
	useEffect(() => {
		form.setValue("watermark", settings?.watermark ?? true);
		form.setValue("public", settings?.public ?? true);
		form.setValue("canvas_count", settings?.canvas_count ?? true);
	}, [settings]);
	const form = useForm<z.infer<typeof SettingsFormSchema>>({
		resolver: zodResolver(SettingsFormSchema),
		defaultValues: {
			watermark: true,
			public: true,
			canvas_count: true,
		},
	});

	async function onSubmit(data: z.infer<typeof SettingsFormSchema>) {
		await updateSettings.mutateAsync({
			settings: data,
		});
		toast({
			title: "Settings updated",
			description: "Your settings have been updated.",
			duration: 3000,
		});
		setSettingsOpen(false);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
				<div>
					<h3 className="mb-4 text-lg font-medium">Exporting</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="watermark"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Watermark</FormLabel>
										<FormDescription>
											Display a watermark on your exported images.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>
				<div>
					<h3 className="mb-4 text-lg font-medium">Privacy</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="public"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Public profile</FormLabel>
										<FormDescription>
											Your profile will be visible to other users.
											{!form.watch("public") && (
												<>
													<Separator className="my-2" />
													<p className="text-sm text-muted-foreground">
														<strong>Note:</strong> People won't be able to
														search for your profile.
													</p>
												</>
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canvas_count"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Display canvas count</FormLabel>
										<FormDescription>
											Display the number of canvases you have created on your
											profile.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value && form.watch("public")}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				</div>
				<Button type="submit">Save</Button>
			</form>
		</Form>
	);
}

export default function () {
	const { data: session } = useSession();
	const router = useRouter();
	const [settingsOpen, setSettingsOpen] = useStore(
		(s) => [s.userSettingsOpen, s.setUserSettingsOpen] as const,
	);
	return (
		<>
			<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DialogContent>
					<DialogHeader>
						<h1 className="text-2xl font-bold">Settings</h1>
					</DialogHeader>
					<SettingsForm />
				</DialogContent>
			</Dialog>
			{session ? (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
							<AvatarImage src={session.user.image} />
							<AvatarFallback>
								{(session.user.name || session.user.login)
									.slice(0, 2)
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="left" className="mr-2 mt-6">
						<DropdownMenuItem
							onClick={() => router.push(`/profile/${session.user.id}`)}
						>
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setSettingsOpen(true)}>
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => router.push("/about")}>
							About
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => signOut()}>
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Button size="icon" onClick={() => signIn()}>
					<LogIn />
				</Button>
			)}
		</>
	);
}
