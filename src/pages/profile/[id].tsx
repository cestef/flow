import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ModeToggle } from "@/components/composed/mode-toggle";
import { BackgroundStyled } from "@/components/flow/background";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { prisma } from "@/lib/prisma";
import { Home, Loader2 } from "lucide-react";
import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { getSession, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import Moment from "react-moment";

export default function Profile({ user }: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const router = useRouter();
	const { data: session, status: sessionStatus } = useSession();

	if (sessionStatus === "loading") {
		return (
			<div className="flex flex-col items-center justify-center w-screen h-[100svh]">
				<Loader2 className="w-12 h-12 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] px-4">
			<ModeToggle className="absolute top-0 left-0 m-6" />
			<Button
				onClick={() => router.push("/")}
				className="absolute top-0 right-0 m-6"
				size="icon"
			>
				<Home className="w-6 h-6" />
			</Button>
			<Card className="w-full p-2 md:w-[450px] lg:w-[600px] relative">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">
						{user?.name ?? "Private User"}
					</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						<Tooltip>
							<TooltipTrigger>
								<p>
									Joined <Moment fromNow date={user?.createdAt} />
								</p>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									<Moment format="MMMM Do YYYY, h:mm A" date={user?.createdAt} />
								</p>
							</TooltipContent>
						</Tooltip>
						{/* {user.settings.canvas_count !== false && user.settings.public && ( */}
						<p className="mt-2 text-muted-foreground">
							{user?.canvases.length} canvas
							{user?.canvases.length !== 1 && "es"}
						</p>
						{/* )} */}
					</CardDescription>
					<Avatar className="absolute right-6 top-6 w-12 h-12">
						<AvatarImage src={user?.image ?? undefined} />
						<AvatarFallback>
							{user?.name?.slice(0, 2).toUpperCase() || "??"}
						</AvatarFallback>
					</Avatar>
				</CardHeader>
				<CardContent>
					{/* {user.settings.public === false ? (
						<p className="text-lg font-semibold text-center text-muted-foreground">
							This user has their profile set to private
						</p>
					) : (
						user.settings.canvas_count === false && (
							<p className="text-lg font-semibold text-center text-muted-foreground">
								This user turned off canvas sharing
							</p>
						)
					)} */}
					{/* {user.settings.canvas_count && ( */}
					<>
						<p className="text-2xl font-bold mb-4 text-center">Shared with you</p>
						<div className="flex flex-wrap gap-4 justify-center items-center">
							{user?.canvases.map((canvas) => (
								<Link href={`/?canvasId=${canvas.id}`} key={canvas.id}>
									<div className="bg-accent rounded-lg border dark:border-stone-700 px-6 py-4 cursor-pointer hover:shadow-md transition-shadow duration-200">
										<p className="text-xl font-bold">{canvas.name}</p>
										<Tooltip>
											<TooltipTrigger>
												<p className="text-muted-foreground mt-1 text-sm">
													Created{" "}
													<Moment fromNow date={canvas.createdAt} />
												</p>
											</TooltipTrigger>
											<TooltipContent>
												<p>
													<Moment
														format="MMMM Do YYYY, h:mm A"
														date={canvas.createdAt}
													/>
												</p>
											</TooltipContent>
										</Tooltip>
									</div>
								</Link>
							))}
							{user?.canvases.length === 0 && (
								<p className="text-center text-lg text-muted-foreground">
									{user.id === session?.user.id
										? "Wait. You can't share canvases with yourself..."
										: "This user hasn't shared any canvases with you"}
								</p>
							)}
						</div>
					</>
					{/* )} */}
				</CardContent>
			</Card>
			<BackgroundStyled className="-z-10" />
		</div>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const session = await getSession(ctx);
	if (!session) {
		return {
			redirect: {
				destination: "/auth/login",
				permanent: false,
			},
		};
	}

	let id = ctx.params?.id as string;
	if (!id) {
		return {
			notFound: true,
		};
	}

	if (id === "me") {
		id = session.user.id;
	}

	const user = await prisma.user.findUnique({
		where: {
			id,
		},
		include: {
			canvases: {
				select: {
					id: true,
					name: true,
					createdAt: true,
					members: {
						select: {
							userId: true,
						},
					},
				},
			},
		},
	});

	if (!user) {
		return {
			notFound: true,
		};
	}

	user.canvases = user?.canvases
		.filter((canvas) => canvas.members?.some((member) => member.userId === session.user.id))
		.map((canvas) => ({
			...canvas,
			members: null,
		})) as any;

	return {
		props: {
			user: {
				...user,
				createdAt: user.createdAt.toString(),
				updatedAt: user.updatedAt.toString(),
				canvases: user.canvases.map((canvas) => ({
					...canvas,
					createdAt: canvas.createdAt.toString(),
				})),
			},
		},
	};
}
