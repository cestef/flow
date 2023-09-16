import { cn } from "@/lib/utils";
import { LogOut, UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
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
	const router = useRouter();
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
				<DropdownMenuItem onClick={() => router.push("/profile/me")}>
					<UserIcon size={16} className="mr-2" />
					Profile
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => signOut()}>
					<LogOut size={16} className="mr-2" />
					Log Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
