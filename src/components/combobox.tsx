import * as React from "react";

import { Check, ChevronsUpDown } from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ComboBox({
	open,
	value,
	onOpenChange,
	onSelect,
	data,
	label,
}: {
	open: boolean;
	value: string;
	onOpenChange: (open: boolean) => void;
	onSelect: (value: string) => void;
	data: {
		value: any;
		label: string;
	}[];
	label: string;
}) {
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					{value ? data.find((e) => e.value === value)?.label : label}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full">
				<Command>
					<CommandInput placeholder="Search..." />
					<CommandGroup>
						{data.map((e) => (
							<CommandItem key={e.value} onSelect={() => onSelect(e.value)}>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === e.value ? "opacity-100" : "opacity-0",
									)}
								/>
								{e.label}
							</CommandItem>
						))}
						{data.length === 0 && (
							<CommandItem disabled className="py-6 text-center">
								No item found.
							</CommandItem>
						)}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
