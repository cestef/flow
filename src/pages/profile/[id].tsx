import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { ModeToggle } from "@/components/mode-toggle";
import { BackgroundStyled } from "@/components/themed-flow";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Moment from "react-moment";

export default function Profile({ id }: { id?: string }) {
	const { data: session, status: sessionStatus } = useSession();
	const { data: user, status } = trpc.users.get.useQuery({
		id: id ?? session?.user?.id ?? "",
	});

	if (status === "loading" || sessionStatus === "loading") {
		return (
			<div className="flex flex-col items-center justify-center w-screen h-[100svh]">
				<Loader2 className="w-12 h-12 animate-spin" />
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center w-screen h-[100svh] px-4">
			<ModeToggle className="absolute top-0 left-0 m-6" />

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
										format="MMMM Do YYYY, h:mm A"
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
				<CardContent>
					<p className="text-2xl font-bold mb-4 text-center text-muted-foreground">
						Shared with you
					</p>
					<div className="flex flex-wrap gap-4 justify-center items-center">
						{user?.canvases.map((canvas) => (
							<Link href={`/?canvasId=${canvas.id}`} key={canvas.id}>
								<div className="bg-card rounded-lg border px-6 py-4 cursor-pointer hover:shadow-md transition-shadow duration-200">
									<p className="text-xl font-bold">{canvas.name}</p>
									<Tooltip>
										<TooltipTrigger>
											<p className="text-muted-foreground mt-1 text-sm">
												Created <Moment fromNow date={canvas.createdAt} />
											</p>
										</TooltipTrigger>
										<TooltipContent>
											<p>
												<Moment
													format="MMMM Do YYYY, h:mm A"
													date={canvas.createdAt}
												/>
											</p>
										</TooltipContent>
									</Tooltip>
								</div>
							</Link>
						))}
					</div>
				</CardContent>
			</Card>
			<BackgroundStyled className="-z-10" />
		</div>
	);
}
