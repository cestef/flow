import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { ModeToggle } from "@/components/mode-toggle";
import { BackgroundStyled } from "@/components/themed-flow";
import Twemoji from "@/components/twemoji";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getLatestTag, trpc } from "@/lib/utils";
import { Github, Home } from "lucide-react";
import { useTheme } from "next-themes";
import config from "next/config";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import semver from "semver";

const { publicRuntimeConfig } = config();
const { VERSION } = publicRuntimeConfig;

const AboutPage = () => {
	const [latestTag, setLatestTag] = useState<string | null>(null);
	useEffect(() => {
		getLatestTag("cestef/flow").then((tag) => setLatestTag(tag));
	}, []);
	const { theme } = useTheme();
	const [realTheme, setRealTheme] = useState<
		"light" | "dark" | "system" | undefined
	>(undefined);
	useEffect(() => {
		if (theme === "system") {
			setRealTheme(
				window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light",
			);
		} else {
			setRealTheme(theme as "light" | "dark" | undefined);
		}
	}, [theme]);

	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] shadow-sm px-4">
			<ModeToggle className="absolute top-0 left-0 m-6" />
			<Card className="w-full p-2 md:w-[450px] lg:w-[750px] relative animate-in fade-in zoom-in-75 duration-300">
				{realTheme === undefined ? (
					<Skeleton className="absolute top-4 right-4 rounded-[50px] w-[200px] h-[200px]" />
				) : realTheme === "dark" ? (
					<Image
						src="/icon_dark_nobg.svg"
						alt="Flow"
						width={150}
						height={150}
						className="absolute top-4 right-4 hidden lg:block"
					/>
				) : (
					<Image
						src="/icon_light_nobg.svg"
						alt="Flow"
						width={150}
						height={150}
						className="absolute top-4 right-4 hidden lg:block"
					/>
				)}
				<CardHeader>
					<CardTitle className="text-4xl font-bold">
						Flow{" "}
						<Tooltip>
							<TooltipTrigger>
								<span
									className={cn("text-2xl text-muted-foreground", {
										"text-destructive": semver.gt(
											latestTag?.replace(/^v/, "") || "0.0.0",
											VERSION || "0.0.0",
										),
									})}
								>
									v{VERSION}
								</span>
							</TooltipTrigger>
							<TooltipContent>
								<span className="text-muted-foreground text-lg font-semibold">
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
					<p className="text-gray-500 text-lg">
						Like this project?{" "}
						<span className="text-primary text-lg">
							<Link
								href="https://github.com/cestef/flow"
								className="text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								Leave a <Twemoji emoji="⭐" /> on GitHub
							</Link>
						</span>
					</p>
					<p className="text-gray-500 text-lg pt-2">
						Built with <Twemoji emoji="❤️" /> by{" "}
						<Link
							href="cstef.dev"
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							cstef
						</Link>
					</p>
				</CardContent>
				<CardFooter className="flex flex-row justify-center">
					<Link href="/">
						<Button size="lg" className="w-full lg:w-auto">
							<Home className="w-6 h-6 mr-2" />
							Back to Flow
						</Button>
					</Link>
				</CardFooter>
			</Card>
			<BackgroundStyled className="-z-10" />
		</div>
	);
};

export default AboutPage;
