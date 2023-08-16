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
import { getProviders, signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

const icons = {
	github: <Github className="mr-2 h-6 w-6" />,
};

export default function Login({
	providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen shadow-sm">
			<Card className="w-[450px] p-2">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">Login to Flow</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						Collaborate with your team and get more done.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 justify-center items-center">
					{Object.values(providers || {}).map((provider) => (
						<Button
							onClick={() => signIn(provider.id)}
							size="lg"
							variant="default"
							className="w-full"
							key={provider.name}
						>
							{(icons as any)[provider.id]}
							Sign in with {provider.name}
						</Button>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
	const session = await getServerSession(context.req, context.res, authOptions);
	if (session) {
		return { redirect: { destination: "/" } };
	}

	const providers = await getProviders();

	return {
		props: { providers: providers ?? [] },
	};
}
