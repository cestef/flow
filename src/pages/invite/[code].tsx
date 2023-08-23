import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { prisma } from "@/lib/prisma";
import { trpc } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Profile({
	invite,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const { data: session, status } = useSession();
	const { toast } = useToast();
	const router = useRouter();
	const redeemInvite = trpc.invites.redeem.useMutation({
		onSuccess: () => {
			toast({
				title: "Invite accepted",
				description: `You have accepted the invite to ${invite.canvas?.name}`,
			});
			router.push(`/?canvasId=${invite.canvas?.id}`);
		},
	});

	if (!invite || status === "loading") {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader2 className="h-16 w-16 stroke-2 animate-spin" />
			</div>
		);
	}

	if (invite.user?.id === session?.user?.id) {
		return (
			<div className="flex flex-col items-center justify-center w-screen h-screen shadow-sm">
				<Card className="w-[450px] p-3 relative">
					<CardHeader>
						<CardTitle>Wait a second...</CardTitle>
						<CardDescription className="text-gray-500 text-lg pt-2">
							You can't accept your own invite!
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 justify-center items-center" />
					<CardFooter className="flex flex-col gap-4 justify-center items-center">
						<Button
							className="w-full"
							onClick={() => {
								router.push("/");
							}}
						>
							Go back
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen shadow-sm">
			<Card className="w-[450px] p-3 relative">
				<CardHeader>
					<CardTitle>
						<p className="text-xl">
							<Tooltip>
								<TooltipTrigger>
									<span className="text-gray-500 font-bold">
										{invite.user?.name}
									</span>
								</TooltipTrigger>
								<TooltipContent
									className="border-none bg-transparent"
									side="left"
								>
									<Avatar>
										<AvatarImage src={invite.user?.image ?? undefined} />
										<AvatarFallback>
											{invite.user?.name?.slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</TooltipContent>
							</Tooltip>
							<span className="text-gray-400"> invited you to</span>
						</p>
						<p className="text-2xl font-bold mt-2">{invite.canvas?.name}</p>
					</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						You can accept the invite by clicking the button below.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 justify-center items-center" />
				<CardFooter className="flex flex-col gap-4 justify-center items-center">
					<Button
						className="w-full"
						onClick={() => {
							if (!session) {
								const res = toast({
									title: "Login required",
									action: (
										<>
											<Button
												className="ml-2"
												onClick={() => {
													res.dismiss();
													router.push(
														`/auth/login?callbackUrl=${router.asPath}`,
													);
												}}
											>
												Login
											</Button>
										</>
									),
								});
								return;
							}
							redeemInvite.mutate({
								code: router.query.code as string,
							});
						}}
					>
						Accept
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	// const session = await getServerSession(context.req, context.res, authOptions);
	// if (!session) {
	// 	return { redirect: { destination: "/auth/login" } };
	// }
	const code = context.params?.code as string;
	if (!code) {
		return { notFound: true };
	}
	const invite = await prisma.invite.findUnique({
		where: {
			code,
		},
		select: {
			id: true,
			user: {
				select: {
					id: true,
					name: true,
					image: true,
				},
			},
			canvas: {
				select: {
					id: true,
					name: true,
				},
			},
			maxUses: true,
			uses: true,
			expires: true,
		},
	});

	if (!invite) {
		return { notFound: true };
	}

	if (invite.maxUses && invite.uses >= invite.maxUses) {
		return { notFound: true };
	}

	if (invite.expires && new Date(invite.expires) < new Date()) {
		return { notFound: true };
	}

	return {
		props: {
			invite,
		},
	};
}
