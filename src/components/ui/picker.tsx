import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";

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
		"#E2E2E2",
		"#ff75c3",
		"#ffa647",
		"#ffe83f",
		"#9fff5b",
		"#70e2ff",
		"#cd93ff",
		"#09203f",
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
	}, [background]);

	return (
		<Popover
			onOpenChange={(o) => {
				if (o) return;
				onSubmit?.();
			}}
		>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant={"outline"}
					className={cn(
						"w-full justify-start text-left font-normal text-primary",
						!background && "text-muted-foreground",
						className,
					)}
				>
					<div className="w-full flex items-center gap-2">
						{background ? (
							<div
								className="h-4 w-4 rounded !bg-center !bg-cover transition-all"
								style={{ background }}
							/>
						) : (
							<Paintbrush className="h-4 w-4" />
						)}
						<div className="truncate flex-1">
							{background ? background : message || "Pick a color"}
						</div>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64">
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
								style={{ background: s }}
								className="rounded-md h-6 w-6 cursor-pointer active:scale-105"
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

					<TabsContent value="password">Change your password here.</TabsContent>
				</Tabs>

				<Input
					id="custom"
					value={background}
					className="col-span-2 h-8 mt-4"
					onChange={(e) => setBackground(e.currentTarget.value)}
				/>
			</PopoverContent>
		</Popover>
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
			<div className="bg-popover/80 rounded-md p-1 text-xs text-center">
				{children}
			</div>
		</div>
	);
};
