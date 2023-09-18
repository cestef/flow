import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Pipette } from "lucide-react";
import { HexColorPicker } from "react-colorful";

export function GradientPicker({
	background,
	setBackground,
	className,
	onSubmit,
	gradient,
	message,
	id,
}: {
	background: string;
	setBackground: (background: string) => void;
	onSubmit?: () => void;
	className?: string;
	gradient?: boolean;
	message?: string;
	id?: string;
}) {
	const solids = [
		"#ff75c3",
		"#ff4500",
		"#ffa647",
		"#ffbb55",
		"#ffe83f",
		"#bada55",
		"#9fff5b",
		"#70e2ff",
		"#accbee",
		"#0088cc",
		"#cd93ff",
		"#09203f",
		"#537895",
		"#d5d4d0",
		"#e7f0fd",
		"transparent",
	];

	const gradients = [
		"linear-gradient(to top left,#accbee,#e7f0fd)",
		"linear-gradient(to top left,#d5d4d0,#d5d4d0,#eeeeec)",
		"linear-gradient(to top left,#000000,#434343)",
		"linear-gradient(to top left,#09203f,#537895)",
		"linear-gradient(to top left,#AC32E4,#7918F2,#4801FF)",
		"linear-gradient(to top left,#f953c6,#b91d73)",
		"linear-gradient(to top left,#ee0979,#ff6a00)",
		"linear-gradient(to top left,#F00000,#DC281E)",
		"linear-gradient(to top left,#00c6ff,#0072ff)",
		"linear-gradient(to top left,#4facfe,#00f2fe)",
		"linear-gradient(to top left,#0ba360,#3cba92)",
		"linear-gradient(to top left,#FDFC47,#24FE41)",
		"linear-gradient(to top left,#8a2be2,#0000cd,#228b22,#ccff00)",
		"linear-gradient(to top left,#40E0D0,#FF8C00,#FF0080)",
		"linear-gradient(to top left,#fcc5e4,#fda34b,#ff7882,#c8699e,#7046aa,#0c1db8,#020f75)",
		"linear-gradient(to top left,#ff75c3,#ffa647,#ffe83f,#9fff5b,#70e2ff,#cd93ff)",
	];

	const defaultTab = useMemo(() => {
		if (gradient && background?.includes("gradient")) return "gradient";
		return "solid";
	}, [background, gradient]);

	return (
		<div className="w-64 bg-card rounded-md p-4 border border-border flex flex-col gap-4">
			<Tabs defaultValue={defaultTab} className="w-full">
				<TabsList className="w-full mb-4">
					<TabsTrigger className="flex-1" value="solid">
						Solid
					</TabsTrigger>
					{gradient && (
						<TabsTrigger className="flex-1" value="gradient">
							Gradient
						</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="solid" className="flex flex-wrap gap-1 mt-0">
					{solids.map((s) => (
						<div
							key={s}
							style={{
								background: s,
							}}
							className={cn("rounded-md h-6 w-6 cursor-pointer active:scale-105", {
								"border-2 border-primary": background === s,
								"border border-muted-foreground": s === "transparent",
							})}
							onClick={() => setBackground(s)}
						/>
					))}
				</TabsContent>

				{gradient && (
					<TabsContent value="gradient" className="mt-0">
						<div className="flex flex-wrap gap-1 mb-2">
							{gradients.map((s) => (
								<div
									key={s}
									style={{ background: s }}
									className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
									onClick={() => setBackground(s)}
								/>
							))}
						</div>
					</TabsContent>
				)}
			</Tabs>

			<div className="flex flex-row gap-2 items-center">
				<Input
					id="custom"
					value={background}
					className="h-8 w-full"
					onChange={(e) => setBackground(e.currentTarget.value)}
				/>
				<Popover>
					<PopoverTrigger asChild>
						<Button size="icon" variant="ghost" className="min-w-[2.5rem]">
							<Pipette className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-64 h-64">
						<HexColorPicker
							color={background ?? "#000000"}
							onChange={(e) => setBackground(e)}
						/>
					</PopoverContent>
				</Popover>
			</div>
			<Button onClick={onSubmit}>
				<Check /> Save
			</Button>
		</div>
	);
}

const GradientButton = ({
	background,
	children,
}: {
	background: string;
	children: React.ReactNode;
}) => {
	return (
		<div
			className="p-0.5 rounded-md relative !bg-cover !bg-center transition-all"
			style={{ background }}
		>
			<div className="bg-popover/80 rounded-md p-1 text-xs text-center">{children}</div>
		</div>
	);
};
