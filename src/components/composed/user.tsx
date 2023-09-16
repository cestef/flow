import { cn } from "@/lib/utils";
import { LogOut, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export default function User({
	user,
	side,
	className,
}: {
	user?: {
		name?: string;
		image?: string;
	};
	side?: string;
	className?: string;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar
					className={cn(
						"cursor-pointer hover:opacity-80 transition-opacity duration-200",
						className
					)}
				>
					<AvatarImage src={user?.image} />
					<AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "??"}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent side={side as any}>
				<DropdownMenuItem>
					<UserIcon size={16} className="mr-2" />
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem>
					<LogOut size={16} className="mr-2" />
					Log Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
