import { FIT_VIEW } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Eye, LogOut, UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useCallback } from "react";
import { getRectOfNodes, useReactFlow } from "reactflow";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { usePluvOther, usePluvOthers } from "@/lib/pluv/bundle";

export default function User({
	user,
	side,
	className,
}: {
	user?: {
		id?: string;
		name?: string;
		image?: string;
		me?: boolean;
	};
	logout?: boolean;
	side?: string;
	className?: string;
}) {
	const { fitBounds } = useReactFlow();
	const others = usePluvOthers();
	const zoomToUser = useCallback(() => {
		const other = others.find((other) => other.user.id === user?.id);
		if (other) {
			const bounds = getRectOfNodes([
				{
					id: other.user.id,
					position: {
						x: other.presence.x,
						y: other.presence.y,
					},
					data: {},
					width: 24,
					height: 24,
				},
			]);
			fitBounds(bounds, FIT_VIEW);
		}
	}, [fitBounds, others]);
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar
					className={cn(
						"cursor-pointer hover:opacity-80 transition-opacity duration-200",
						className,
					)}
				>
					<AvatarImage src={user?.image} />
					<AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() ?? "??"}</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent side={side as any}>
				<DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
				<Link href={`/profile/${user?.me ? "me" : user?.id}`}>
					<DropdownMenuItem>
						<UserIcon size={16} className="mr-2" />
						Profile
					</DropdownMenuItem>
				</Link>
				{!user?.me && (
					<DropdownMenuItem onClick={zoomToUser}>
						<Eye size={16} className="mr-2" />
						Focus
					</DropdownMenuItem>
				)}
				{user?.me && (
					<DropdownMenuItem onClick={() => signOut()} className="text-destructive">
						<LogOut size={16} className="mr-2" />
						Log Out
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
