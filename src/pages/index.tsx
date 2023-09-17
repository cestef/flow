import { BackgroundStyled } from "@/components/flow/background";
import Hero from "@/components/home/hero";
import { Loader } from "@/components/ui/loader";
import { useSession } from "next-auth/react";
import { ModeToggle } from "@/components/composed/mode-toggle";

export default function Index() {
	const { status } = useSession();

	if (status === "loading") return <Loader />;
	return (
		<div className="min-h-[100svh] w-screen flex flex-col justify-center items-center">
			<ModeToggle className={"absolute top-4 left-4 z-50"} />
			<Hero />
			<BackgroundStyled className="-z-10" />
		</div>
	);
}
