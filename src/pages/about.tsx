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
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getLatestTag, trpc } from "@/lib/utils";
import { Github } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import semver from "semver";

const AboutPage = () => {
	const version = trpc.version.useQuery();
	const [latestTag, setLatestTag] = useState<string | null>(null);
	useEffect(() => {
		getLatestTag("cestef/flow").then((tag) => setLatestTag(tag));
	}, []);
	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] shadow-sm">
			<Card className="w-[750px] p-3 relative animate-in fade-in zoom-in-75 duration-300">
				<CardHeader>
					<CardTitle className="text-4xl font-bold">
						Flow{" "}
						<Tooltip>
							<TooltipTrigger>
								<span
									className={cn("text-2xl text-muted-foreground", {
										"text-destructive": semver.gt(
											latestTag?.replace(/^v/, "") || "0.0.0",
											version.data?.version,
										),
									})}
								>
									v{version.data?.version}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<span className="text-muted-foreground text-lg font-semibold">
									{/* Updated{" "}
									<Moment format="DD MMM YYYY" withTitle>
										{version.data?.updatedAt}
									</Moment>{" "}
									at{" "}
									<Moment format="HH:mm:ss" withTitle>
										{version.data?.updatedAt}
									</Moment> */}
									{latestTag && (
										<span>
											Latest version:{" "}
											<Link
												href={`https://github.com/cestef/flow/releases/tag/${latestTag}`}
												className="text-primary"
												target="_blank"
												rel="noopener noreferrer"
											>
												{latestTag}
											</Link>
										</span>
									)}
								</span>
							</TooltipContent>
						</Tooltip>
					</CardTitle>
					<CardDescription className="text-xl pt-2">
						A real-time collaborative flowchart editor.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-gray-500 text-lg pt-2">
						Flow is a web application that allows you to create, edit and share
						flowcharts.
					</p>
					<p className="text-gray-500 text-lg pt-6">
						The source code is available on{" "}
						<span>
							<Link
								href="https://github.com/cestef/flow"
								className="text-primary hover:underline"
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
