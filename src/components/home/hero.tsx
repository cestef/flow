import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import localFont from "next/font/local";
import { TypeAnimation } from "react-type-animation";
import { Button } from "../ui/button";
import { ArrowRight, Github, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useGet } from "@/lib/swr";
import { useSession } from "next-auth/react";
import {useTheme} from "next-themes";

const sfPro = localFont({
	src: "../../fonts/SfProRoundedSemibold.ttf",
});

export default function Hero() {
	const { status } = useSession();
	const { data: github } = useGet("https://api.github.com/repos/cestef/flow");
	const { theme} = useTheme();
	const realTheme = theme === "system" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : theme;
	return (
		<div className="flex flex-col lg:flex-row items-center space-y-24 lg:space-x-24 justify-center px-10 md:px-8 max-w-full lg:max-w-[1600px]">
			<div className="flex flex-col space-y-8 max-w-full">
				<h1 className="text-5xl md:text-7xl font-semibold max-w-full">
					Use <b className={cn("text-primary", sfPro.className)}>Flow</b> to <br />
					<span className="font-bold">
						<TypeAnimation
							sequence={[
								"organize projects",
								2000,
								"organize notes",
								2000,
								"plan vacations",
								2000,
								"plan events",
								2000,
								"make flowcharts",
								2000,
								"make a sandwich",
								2000,
							]}
							repeat={Infinity}
							speed={15}
							deletionSpeed={15}
						/>
					</span>
				</h1>

				<p className="text-xl md:text-2xl font-medium dark:text-gray-400 text-gray-600 max-w-full">
					Flow is a real-time collaborative flowchart editor. I&apos;s free, open-source,
					and easy to use. Why not give it a try?
				</p>
				<div className="flex flex-wrap gap-4 w-full">
					<Link
						href={status === "authenticated" ? "/dashboard" : "/auth/login"}
						className="w-full md:w-auto"
					>
						<Button size="jumbo" className="w-full">
							{status === "authenticated" ? <>Go to Dashboard</> : <>Get Started</>}
							<ArrowRight size={24} className="ml-2 w-6 h-6 hidden md:block" />
						</Button>
					</Link>
					<Link
						href="https://github.com/cestef/flow"
						target="_blank"
						className="w-full md:w-auto"
					>
						<Button size="jumbo" variant="secondary" className="w-full">
							{humanFormatStars(github?.stargazers_count ?? 0)}
							<Star size={24} className="mx-2 fill-yellow-400 text-yellow-400" />
							on GitHub
						</Button>
					</Link>
				</div>
			</div>
			<Image
				// src="https://placehold.co/750x500/png?text=Super+Cool+Hero+Image"
				src={`/banner_${realTheme}.png`}
				width={750}
				height={500}
				alt="banner"
				className="hidden md:block rounded-xl"
			/>
		</div>
	);
}

const humanFormatStars = (stars: number) => {
	if (stars > 1000) return `${Math.round(stars / 100) / 10}k`;
	return stars;
};
