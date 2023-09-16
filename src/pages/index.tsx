import { BackgroundStyled } from "@/components/flow/background";
import Hero from "@/components/home/hero";
import { Loader } from "@/components/ui/loader";
import { useGet } from "@/lib/swr";
import { Canvas } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Index() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: canvases } = useGet<Canvas[]>("/api/canvas");

	if (status === "loading") return <Loader />;
	return (
		<div className="min-h-[100svh] w-screen flex flex-col justify-center items-center">
			<Hero />
			<BackgroundStyled className="-z-10" />
		</div>
	);
}
