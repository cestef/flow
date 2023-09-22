import { updateCanvasSettings } from "@/lib/mutations/canvas";
import { AugmentedCanvas } from "@/pages/dashboard/[[...id]]";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "../ui/form";
import { Switch } from "../ui/switch";
import { toast } from "../ui/use-toast";

const SettingsFormSchema = z.object({
	members: z.object({
		canInvite: z.boolean(),
	}),
});
export default function DashboardSettings({
	canvas,
	data,
}: {
	canvas?: string;
	data?: AugmentedCanvas;
}) {
	const form = useForm<z.infer<typeof SettingsFormSchema>>({
		resolver: zodResolver(SettingsFormSchema),
		defaultValues: {
			...((data?.settings as any) ?? {}),
		},
	});

	async function onSubmit(data: z.infer<typeof SettingsFormSchema>) {
		if (!canvas) return;
		await updateCanvasSettings(canvas, data);
		toast({
			title: "Settings updated",
			description: "Your settings have been updated.",
			duration: 3000,
		});
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
				<div>
					<h3 className="mb-4 text-lg font-medium">Members</h3>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="members.canInvite"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Invite other users</FormLabel>
										<FormDescription>
											Members can invite other users to the canvas.
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
				{/* <div>
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
														<strong>Note:</strong> People won't be able
														to search for your profile.
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
				</div> */}
				<Button type="submit">Save</Button>
			</form>
		</Form>
	);
}
