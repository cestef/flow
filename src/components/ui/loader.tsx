import { Loader2 } from "lucide-react";

export const Loader = () => (
	<div className="flex justify-center items-center h-[100svh]">
		<Loader2 className="h-16 w-16 stroke-2 animate-spin" />
	</div>
);
