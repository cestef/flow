import { cn } from "@/lib/utils";
import User from "./user-room";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const MAX_USERS = 3;

export default function UserStack({
	users,
	className,
}: {
	users: { name: string; image?: string; me?: boolean; id: string }[];
	className?: string;
}) {
	const me = users.find((user) => user.me);
	if (me) {
		users = users.filter((user) => user !== me);
		users = [me, ...users];
	}
	return (
		<div className={cn("flex flex-row items-center justify-center space-x-2", className)}>
			{users.length > MAX_USERS && (
				<Tooltip>
					<TooltipTrigger>
						<div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white text-sm">
							+{users.length - MAX_USERS}
						</div>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{users.slice(MAX_USERS).map((user) => (
							<>
								{user.name} {user.me ? "(You)" : ""}
							</>
						))}
					</TooltipContent>
				</Tooltip>
			)}
			{users
				.slice(0, MAX_USERS)
				.reverse()
				.map((user) => (
					<User user={user} key={user.id} />
				))}
		</div>
	);
}
