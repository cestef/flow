import * as React from "react";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Cross, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ComboBox({
	open,
	value,
	onOpenChange,
	onSelect,
	data,
	label,
	onRemove,
	popoverClassName,
	getItemStyle,
	className,
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
	label?: string;
}) {
	const [isOpen, setIsOpen] =
		typeof open === "undefined" ? React.useState(false) : [open, onOpenChange];

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
				>
					{value
						? data.find((e) => e.value === value)?.label
						: label || "Select"}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn("w-full", popoverClassName)}>
				<Command className="w-full h-60">
					<CommandInput placeholder="Search..." />
					<CommandGroup className="w-full max-h-full overflow-y-auto">
						<div className="max-h-full ">
							{data.map((e) => (
								<CommandItem
									key={e.value}
									onSelect={() => onSelect?.(e.value)}
									className="mt-1"
									style={getItemStyle?.(e)}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === e.value ? "opacity-100" : "opacity-0",
										)}
									/>
									{e.label}
									<p className="absolute opacity-0">{e.value}</p>
									{e.deletable && (
										<Button
											size="icon"
											className="ml-auto"
											variant="ghost"
											onClick={() => onRemove?.(e.value)}
										>
											<X className="h-4 w-4 text-red-500" />
										</Button>
									)}
								</CommandItem>
							))}
							{data.length === 0 && (
								<CommandItem disabled className="py-6 text-center">
									No item found.
								</CommandItem>
							)}
						</div>
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
