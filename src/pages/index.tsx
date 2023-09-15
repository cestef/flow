import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useGet } from "@/lib/swr";
import { Canvas } from "@prisma/client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Index() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: canvases } = useGet<Canvas[]>("/api/canvas");

	if (status === "loading") return <Loader />;
	return (
		<div className="h-[100svh] w-screen flex-col justify-center items-center">
			<Button
				onClick={() => {
					if (session?.user) {
						signOut();
					} else {
						signIn();
					}
				}}
			>
				{session?.user?.name ?? "Login"}
			</Button>
			{canvases?.map((canvas) => (
				<div key={canvas.id} className="flex flex-col items-center">
					<h1 className="text-2xl font-bold">{canvas.name}</h1>
					<Button onClick={() => router.push(`/canvas/${canvas.id}`)}>Join</Button>
				</div>
			))}
		</div>
	);
}
