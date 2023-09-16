import { cn } from "@/lib/utils";
import { Background } from "reactflow";

export const BackgroundStyled = ({
	className,
	...props
}: React.ComponentProps<typeof Background>) => (
	<Background className={cn("bg-background", className)} size={2.5} gap={35} {...props} />
);
