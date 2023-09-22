import * as React from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Cross, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DialogTrigger } from "./dialog";

export default function ComboBox({
	open,
	value,
	onOpenChange,
	onSelect,
	data,
	onRemove,
	popoverClassName,
	getItemStyle,
	className,
	side,
	placeholder,
	noItemsText,
	createButton,
}: {
	popoverClassName?: string;
	className?: string;
	open?: boolean;
	value?: string;
	onOpenChange?: (open: boolean) => void;
	onSelect?: (value: string) => void;
	onRemove?: (value: string) => void;
	getItemStyle?: (item: any) => any;
	data: {
		value: any;
		label: string;
		deletable?: boolean;
	}[];
	side?: "top" | "right" | "bottom" | "left";
	placeholder?: string;
	noItemsText?: string;
	createButton?: React.ReactNode;
}) {
	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<Popover open={open ?? isOpen} onOpenChange={onOpenChange ?? setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
				>
					<p className="truncate">
						{value
							? data.find((e) => e.value === value)?.label
							: placeholder || "Select"}
					</p>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn("w-full", popoverClassName)} side={side}>
				<Command className="w-full h-60">
					<CommandInput placeholder="Search..." />
					<CommandGroup className="w-full h-32 overflow-y-auto">
						<div className="max-h-full">
							{data.map((e) => (
								<CommandItem
									key={e.value}
									onSelect={() => onSelect?.(e.value)}
									className="mt-1 h-12 cursor-pointer"
									style={getItemStyle?.(e)}
								>
									<Check
										className={cn(
											"mx-2 h-4 w-4",
											value === e.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{e.label}
									<p className="absolute opacity-0">{e.value}</p>
									{e.deletable && (
										<Button
											size="icon"
											className="ml-auto hover:bg-destructive/50"
											variant="ghost"
											onClick={() => onRemove?.(e.value)}
										>
											<X className="h-4 w-4 text-red-500" />
										</Button>
									)}
								</CommandItem>
							))}
							{data.length === 0 && (
								<CommandItem disabled className="py-6 text-center h-32">
									{noItemsText || "No item found."}
								</CommandItem>
							)}
						</div>
					</CommandGroup>
					{createButton && (
						<>
							<CommandSeparator />
							<CommandGroup>{createButton}</CommandGroup>
						</>
					)}
				</Command>
			</PopoverContent>
		</Popover>
	);
}
