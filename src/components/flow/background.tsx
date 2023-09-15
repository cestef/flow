import { cn } from "@/lib/utils";
import { Background } from "reactflow";

export const BackgroundStyled = ({
	className,
	...props
}: React.ComponentProps<typeof Background>) => (
	<Background
		className={cn("bg-background", className)}
		size={1.5}
		{...props}
	/>
);

