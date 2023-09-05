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
import { getProviders, signIn } from "next-auth/react";

import { BackgroundStyled } from "@/components/themed-flow";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Github } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { useSearchParams } from "next/navigation";

const icons = {
	github: <Github className="mr-2 h-6 w-6" />,
	discord: (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			className="mr-2 h-6 w-6 fill-current"
			viewBox="0 0 16 16"
		>
			<title>Discord</title>
			<path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z" />
		</svg>
	),
};

export default function Login({
	providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
	const search = useSearchParams();
	const callbackUrl = search.get("callbackUrl") ?? "/";
	const error = search.get("error") ?? undefined;

	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] shadow-sm px-4">
			<Card className="w-full p-2 md:w-[450px] lg:w-[600px]">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">Login to Flow</CardTitle>
					<CardDescription className="text-gray-500 text-lg pt-2">
						Collaborate with your team and get more done.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 justify-center items-center">
					{Object.values(providers || {}).map((provider) => (
						<Button
							onClick={() => signIn(provider.id, { callbackUrl })}
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
			<BackgroundStyled className="-z-10" />
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
