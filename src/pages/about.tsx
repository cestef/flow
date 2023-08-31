import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { BackgroundStyled } from "@/components/themed-flow";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import Link from "next/link";
import React from "react";

const AboutPage = () => {
	return (
		<div className="flex flex-col items-center justify-center w-screen h-screen shadow-sm">
			<Card className="w-[750px] p-3 relative animate-in fade-in zoom-in-75 duration-300">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">About Flow</CardTitle>
					<CardDescription className="text-xl pt-2">
						A real-time collaborative flowchart editor.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-gray-500 text-lg pt-2">
						Flow is a web application that allows you to create and share
						canvases consisting of nodes and groups that can be connected to
						each other.
					</p>
					<p className="text-gray-500 text-lg pt-2">
						It is built with{" "}
						<Link
							href="https://nextjs.org"
							className="text-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							Next.js
						</Link>
						,{" "}
						<Link
							href="https://trpc.io"
							className="text-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							tRPC
						</Link>
						,{" "}
						<Link
							href="https://prisma.io"
							className="text-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							Prisma
						</Link>
						,{" "}
						<Link
							href="https://next-auth.js.org/"
							className="text-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							next-auth
						</Link>{" "}
						and{" "}
						<Link
							href="https://reactflow.dev"
							className="text-primary"
							target="_blank"
							rel="noopener noreferrer"
						>
							react-flow
						</Link>
					</p>
					<p className="text-gray-500 text-lg pt-6">
						The source code is available on{" "}
						<span>
							<Link
								href="https://github.com/cestef/flow"
								className="text-primary"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Github className="inline-block w-6 h-6 text-primary align-text-bottom mx-1" />
								GitHub
							</Link>
						</span>
					</p>
				</CardContent>
				<CardFooter className="flex flex-col gap-4 justify-center items-center">
					<div className="flex-grow" />
					<Link href="/" className="w-1/2">
						<Button size="lg" className="w-full">
							Back
						</Button>
					</Link>
				</CardFooter>
			</Card>
			<BackgroundStyled className="-z-10" />
		</div>
	);
};

export default AboutPage;
