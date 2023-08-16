"use client";

import * as React from "react";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

export function ModeToggle() {
	const { setTheme, theme } = useTheme();

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				>
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={() => setTheme("light")}>
					Light
				</ContextMenuItem>
				<ContextMenuItem onClick={() => setTheme("dark")}>Dark</ContextMenuItem>
				<ContextMenuItem onClick={() => setTheme("system")}>
					System
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
