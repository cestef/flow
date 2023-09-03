import { useStore } from "@/lib/store";
import { useHotkeys } from "react-hotkeys-hook";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command";

export function CmdK() {
	const [open, setOpen] = useStore((state) => [state.cmdk, state.setCmdk]);
	const [search, setSearch] = useStore((state) => [
		state.cmdkSearch,
		state.setCmdkSearch,
	]);

	useHotkeys("ctrl+k,meta+k", (e) => {
		e.preventDefault();
		setOpen(!open);
	});

	return (
		<CommandDialog
			open={open}
			onOpenChange={setOpen}
			value={search}
			onValueChange={setSearch}
		>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Suggestions">
					<CommandItem onSelect={() => console.log("calendar")}>
						Calendar
					</CommandItem>
					<CommandItem>Search Emoji</CommandItem>
					<CommandItem>Calculator</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
