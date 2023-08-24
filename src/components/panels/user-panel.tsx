import { Github, LogIn } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useRouter } from "next/router";
import { useState } from "react";
import { Button } from "../ui/button";

export default function () {
	const { data: session } = useSession();
	const router = useRouter();
	return (
		<>
			{session ? (
				<DropdownMenu>
					<DropdownMenuTrigger>
						<Avatar className="cursor-pointer hover:opacity-80 transition-opacity duration-200">
							<AvatarImage src={session.user.image} />
							<AvatarFallback>
								{session.user.name.slice(0, 2).toUpperCase()}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent side="left" className="mr-2 mt-6">
						<DropdownMenuItem
							onClick={() => router.push(`/profile/${session.user.id}`)}
						>
							Profile
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => router.push("/about")}>
							About
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => signOut()}>
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				<Button size="icon" onClick={() => signIn()}>
					<LogIn />
				</Button>
			)}
		</>
	);
}
