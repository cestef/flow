import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Github } from "lucide-react";
import { getServerSession } from "next-auth/next";

export default function Profile({
	user,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] shadow-sm">
			<Card className="w-[450px] p-3 relative">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">{user?.name}</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						{user?.canvases.length} canvases
					</CardDescription>
					<Avatar className="absolute right-6 top-6 w-12 h-12">
						<AvatarImage src={user?.image ?? undefined} />
						<AvatarFallback>
							{user?.name?.slice(0, 2).toUpperCase()}
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
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!user) {
		return { notFound: true };
	}

	return {
		props: {
			user,
		},
	};
}
