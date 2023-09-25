import UserComponent from "@/components/composed/user";
import DashboardMembers from "@/components/dashboard/members";
import DashboardOverview from "@/components/dashboard/overview";
import DashboardSettings from "@/components/dashboard/settings";
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
import { FIT_VIEW } from "@/lib/constants";
import { createCanvas } from "@/lib/mutations/canvas";
import { prisma } from "@/lib/prisma";
import { useStore } from "@/lib/store";
import { useGet } from "@/lib/swr";
import { canAccessCanvas } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Canvas, Member, User } from "@prisma/client";
import { Plus } from "lucide-react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Edge, Node, useReactFlow } from "reactflow";
import { mutate } from "swr";
import * as z from "zod";

const formSchema = z.object({
	name: z.string().min(1).max(64),
});

function CreateDialogButton() {
	const [open, setOpen] = useState(false);
	const [canvasId, setCanvasId] = useStore(
		(state) => [state.canvasId, state.setCanvasId] as const,
	);

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

type MembersWithUser = Member & { user: User };
type CanvasWithMembersAndUsers = Canvas & { members: MembersWithUser[] };
export type AugmentedCanvas = CanvasWithMembersAndUsers & { nodes: Node[]; edges: Edge[] };

export default function Dashboard({
	id,
	tab: defaultTab,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const [tab, setTab] = useState<"select" | "overview" | "members" | "settings">(
		defaultTab ?? "overview",
	);
	const { data: session, status } = useSession();
	const { data: canvases, isLoading } = useGet<AugmentedCanvas[]>("/api/canvas");
	const [canvas, setCanvas] = useState<string | undefined>(undefined);
	const router = useRouter();
	const { fitView } = useReactFlow();
	useEffect(() => {
		if (canvas) {
			router.replace(`/dashboard/${canvas}/${tab}`, undefined, { shallow: true });
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					fitView(FIT_VIEW);
				});
			});
		}
	}, [canvas, tab]);
	useEffect(() => {
		if (id) {
			setCanvas(id);
		}
	}, [id]);
	const canvasId = canvas ?? canvases?.[0]?.id;
	const data = canvases?.find((e) => e.id === canvasId);

	if (status === "loading" || isLoading) return <Loader />;
	return (
		<>
			<Tabs value={tab} onValueChange={(e) => setTab(e as any)}>
				<header className="flex justify-center sm:justify-between items-center px-4 sm:px-8 py-4 border-b">
					<ComboBox
						data={canvases?.map((e) => ({ value: e.id, label: e.name })) ?? []}
						className="w-40 hidden sm:inline-flex"
						popoverClassName="ml-4"
						placeholder="Select a Canvas"
						noItemsText="No canvases found."
						value={canvasId}
						onSelect={setCanvas}
						createButton={<CreateDialogButton />}
					/>
					<TabsList className="sm:absolute sm:left-1/2 sm:transform sm:-translate-x-1/2">
						<TabsTrigger value="select" className="block sm:hidden">
							Select
						</TabsTrigger>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="members" disabled={!canvasId}>
							Members
						</TabsTrigger>
						<TabsTrigger
							value="settings"
							disabled={!canvasId || data?.ownerId !== session?.user?.id}
						>
							Settings
						</TabsTrigger>
					</TabsList>

					<div className="flex items-center space-x-4">
						<UserComponent user={session?.user} className="hidden sm:block" />
					</div>
				</header>
				<main className="sm:px-8 px-4">
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
								value={canvasId}
								onSelect={setCanvas}
								createButton={<CreateDialogButton />}
							/>
						</div>
					</TabsContent>
					<TabsContent value="overview">
						<DashboardOverview canvas={canvasId} data={data} />
					</TabsContent>
					<TabsContent value="members">
						<DashboardMembers canvas={canvasId} data={data} />
					</TabsContent>
					<TabsContent value="settings">
						<div className="flex flex-col gap-6 items-center justify-center h-[calc(100svh-100px)]">
							<h1 className="text-4xl font-bold">Settings</h1>
							<p className="text-xl text-muted-foreground">
								You can view and manage settings of this canvas.
							</p>
							<div className="w-full md:w-[calc(50%-4rem)]">
								<DashboardSettings canvas={canvasId} data={data} />
							</div>
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
	let id: string | null = null;
	let tab: "overview" | "members" | "settings" | null = null;
	const idAndTab = ctx.query.id;
	if (Array.isArray(idAndTab)) {
		id = idAndTab[0];
		tab = (idAndTab[1] as "overview" | "members" | "settings" | null) ?? null;
	}
	if (id) {
		const canvas = await prisma.canvas.findUnique({
			where: {
				id,
			},
			include: {
				members: true,
			},
		});
		if (!canvas) {
			return {
				notFound: true,
			};
		}
		if (!canAccessCanvas(canvas, session.user.id)) {
			return {
				notFound: true,
			};
		}
		if (tab === "settings" && canvas.ownerId !== session.user.id) {
			tab = "overview";
		}
	}
	return {
		props: {
			id,
			tab,
		},
	};
}
