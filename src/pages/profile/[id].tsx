import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";
import Moment from "react-moment";

export default function Profile({
	user,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen shadow-sm px-4">
			<Card className="w-full p-2 md:w-[450px] lg:w-[600px] relative">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">{user?.name}</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						<Tooltip>
							<TooltipTrigger>
								<p>
									Joined <Moment fromNow date={user?.createdAt} />
								</p>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									<Moment
										format="MMMM Do YYYY, h:mm:ss a"
										date={user?.createdAt}
									/>
								</p>
							</TooltipContent>
						</Tooltip>
						<p className="mt-2 text-muted-foreground">
							{user?.canvases.length} canvas
							{user?.canvases.length !== 1 && "es"}
						</p>
					</CardDescription>
					<Avatar className="absolute right-6 top-6 w-12 h-12">
						<AvatarImage src={user?.image ?? undefined} />
						<AvatarFallback>
							{user?.name?.slice(0, 2).toUpperCase() || "??"}
						</AvatarFallback>
					</Avatar>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 justify-center items-center" />
			</Card>
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, authOptions);
	if (!session) {
		return { redirect: { destination: "/auth/login" } };
	}
	let id = context.params?.id as string;
	if (!id) {
		id = session.user.id as string;
	}
	const user = await prisma.user.findUnique({
		where: {
			id,
		},
		select: {
			id: true,
			name: true,
			image: true,
			canvases: {
				select: { _count: true },
			},
			createdAt: true,
		},
	});

	if (!user) {
		return { notFound: true };
	}

	return {
		props: {
			user: {
				...user,
				createdAt: user.createdAt.toISOString(),
			},
		},
	};
}
