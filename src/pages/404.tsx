import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ModeToggle } from "@/components/composed/mode-toggle";
import { BackgroundStyled } from "@/components/flow/background";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/router";

export default function NotFound() {
	const router = useRouter();

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
				<CardHeader className="flex flex-col items-center justify-center">
					<h1 className="text-8xl font-bold">404</h1>
				</CardHeader>
				<CardContent>
					<p className="text-center text-2xl">Page not found.</p>
					<p className="text-center text-lg text-muted-foreground mt-2">
						The page you are looking for does not exist.
					</p>
					<Button onClick={() => router.back()} className="mt-4 w-full">
						Go back
					</Button>
				</CardContent>
			</Card>
			<BackgroundStyled className="-z-10" />
		</div>
	);
}
