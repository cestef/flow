export default function Keyboard({
	modifiers,
	keys,
}: {
	modifiers: string[];
	keys: string[];
}) {
	return (
		<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
			{modifiers.map((modifier) => (
				<span key={modifier} className="ml-1 text-muted-foreground">
					{modifier}
				</span>
			))}
			{keys.map((key) => (
				<span key={key} className="text-muted-foreground">
					{key}
				</span>
			))}
		</kbd>
	);
}
