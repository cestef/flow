import UserComponent from "@/components/composed/user";
import DashboardMembers from "@/components/dashboard/members";
import DashboardOverview from "@/components/dashboard/overview";
import { Button } from "@/components/ui/button";
import ComboBox from "@/components/ui/combobox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createCanvas } from "@/lib/mutations/canvas";
import { useStore } from "@/lib/store";
import { useGet } from "@/lib/swr";
import { zodResolver } from "@hookform/resolvers/zod";
import { Canvas, Member, User } from "@prisma/client";
import { Plus } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
import localFont from "next/font/local";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { mutate } from "swr";
import * as z from "zod";

const sfPro = localFont({
	src: "../fonts/SfProRoundedSemibold.ttf",
});
const formSchema = z.object({
	name: z.string().min(1).max(64),
});

function CreateDialogButton() {
	const [open, setOpen] = useState(false);
	const setCanvasId = useStore((state) => state.setCanvasId);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema as any),
		defaultValues: {
			name: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		const { id } = await createCanvas(values.name);
		mutate("/api/canvas");
		setCanvasId(id);
		setOpen(false);
	}
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="w-full mt-2">
					<Plus className="mr-2 h-5 w-5" />
					Create Canvas
				</Button>
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Canvas</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="My amazing Canvas"
											{...field}
											className="w-full"
										/>
									</FormControl>
									<FormDescription>This will be the Canvas name.</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit">Submit</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

export default function Dashboard() {
	const { data: session, status } = useSession();
	const { data: canvases, isLoading } =
		useGet<(Canvas & { members: (Member & { user: User })[] })[]>("/api/canvas");
	const [canvas, setCanvas] = useState<string | undefined>(undefined);
	const router = useRouter();
	const data = canvases?.find((e) => e.id === canvas);

	if (status === "loading" || isLoading) return <Loader />;
	return (
		<>
			<Tabs defaultValue="overview">
				<header className="flex justify-between items-center px-4 sm:px-8 py-4 border-b">
					<ComboBox
						data={canvases?.map((e) => ({ value: e.id, label: e.name })) ?? []}
						className="w-48 hidden sm:inline-flex"
						popoverClassName="ml-4"
						placeholder="Select a Canvas"
						noItemsText="No canvases found."
						value={canvas}
						onSelect={setCanvas}
						createButton={<CreateDialogButton />}
					/>
					<TabsList className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
						<TabsTrigger value="select" className="block sm:hidden">
							Select
						</TabsTrigger>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="members" disabled={!canvas}>
							Members
						</TabsTrigger>
						<TabsTrigger
							value="settings"
							disabled={!canvas || data?.ownerId !== session?.user?.id}
						>
							Settings
						</TabsTrigger>
					</TabsList>

					<div className="flex items-center space-x-4">
						<UserComponent user={session?.user} />
					</div>
				</header>
				<main>
					<TabsContent value="select">
						<div className="flex flex-col gap-6 items-center justify-center h-[calc(100svh-100px)]">
							<h1 className="text-4xl font-bold">Select a Canvas</h1>
							<p className="text-xl text-muted-foreground">
								You can select a canvas from the dropdown below.
							</p>
							<ComboBox
								data={canvases?.map((e) => ({ value: e.id, label: e.name })) ?? []}
								className="w-64 h-[3.25rem]"
								popoverClassName="ml-4"
								placeholder="Select a Canvas"
								noItemsText="No canvases found."
								value={canvas}
								onSelect={setCanvas}
								createButton={<CreateDialogButton />}
							/>
						</div>
					</TabsContent>
					<TabsContent value="overview">
						<DashboardOverview canvas={canvas} data={data} />
					</TabsContent>
					<TabsContent value="members">
						<DashboardMembers canvas={canvas} data={data} />
					</TabsContent>
					<TabsContent value="settings">
						<div className="flex flex-col gap-6 items-center justify-center h-[calc(100svh-100px)]">
							<h1 className="text-4xl font-bold">Settings</h1>
							<p className="text-xl text-muted-foreground">
								You can view and manage settings of this canvas.
							</p>
						</div>
					</TabsContent>
				</main>
			</Tabs>
		</>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const session = await getSession(ctx);
	if (!session) {
		return {
			redirect: {
				destination: "/",
				permanent: false,
			},
		};
	}
	return {
		props: {},
	};
}
