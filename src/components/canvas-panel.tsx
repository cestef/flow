import { ArrowDownLeft, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DialogFooter, DialogHeader } from "./ui/dialog";

import { trpc } from "@/lib/utils";
import { useStore } from "@/store";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import ComboBox from "./combobox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function CanvasPanel() {
	const { data: session } = useSession();
	const currentCanvasId = useStore((state) => state.currentCanvasId);
	const setCurrentCanvasId = useStore((state) => state.setCurrentCanvasId);
	const toggleChooseCanvas = useStore((state) => state.toggleChooseCanvas);
	const chooseCanvas = useStore((state) => state.chooseCanvas);
	const toggleCreateNewCanvas = useStore(
		(state) => state.toggleCreateNewCanvas,
	);
	const createNewCanvasState = useStore((state) => state.createNewCanvas);
	const setCreateNewCanvasName = useStore(
		(state) => state.setCreateNewCanvasName,
	);
	const canvases = trpc.canvas.list.useQuery({}, { enabled: !!session });
	const createCanvas = trpc.canvas.add.useMutation({
		onSuccess() {
			toggleCreateNewCanvas(false);
			canvases.refetch();
		},
	});

	useEffect(() => {
		if (canvases.data && !currentCanvasId && canvases.data.length > 0) {
			setCurrentCanvasId(canvases.data[0].id);
		}
	}, [canvases.data, currentCanvasId]);
	const togglePanel = useStore((state) => state.toggleCanvasPanel);
	const panelHidden = useStore((state) => state.canvasPanelHidden);
	return (
		<Card
			className={`w-64 ${
				panelHidden
					? "transform -translate-x-[77%] translate-y-[70%]"
					: "transform translate-x-0"
			} transition-all duration-300 ease-in-out`}
		>
			<Button
				size="icon"
				className="absolute top-4 right-4"
				variant="ghost"
				onClick={() => togglePanel()}
			>
				<ArrowDownLeft
					className={`w-4 h-4 ${
						panelHidden ? "rotate-180" : ""
					} transition-all duration-300 ease-in-out`}
				/>
			</Button>
			<CardHeader>
				<CardTitle>Canvas</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-center">
					{session?.user ? (
						<>
							{canvases.isLoading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							<ComboBox
								data={
									canvases.data?.map((canvas) => ({
										label: canvas.name,
										value: canvas.id,
									})) ?? []
								}
								value={currentCanvasId}
								onSelect={(e) => {
									console.log(e);
									setCurrentCanvasId(e);
									toggleChooseCanvas(false);
								}}
								label="Select a Canvas"
								open={chooseCanvas.opened}
								onOpenChange={(e) => toggleChooseCanvas(e)}
							/>
						</>
					) : (
						<p className="text-gray-400">Sign in to create a canvas</p>
					)}
				</div>

				<Dialog
					open={createNewCanvasState.opened}
					onOpenChange={(e) => toggleCreateNewCanvas(e)}
				>
					<DialogTrigger asChild>
						{session && (
							<Button
								size="sm"
								variant="secondary"
								className="mt-4 w-full"
								onClick={() => toggleCreateNewCanvas(true)}
							>
								<Plus className="mr-2 w-4 h-4" />
								Create
							</Button>
						)}
					</DialogTrigger>

					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create new canvas</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col">
							<Input
								type="text"
								placeholder="Canvas name"
								value={createNewCanvasState.name}
								onChange={(e) => setCreateNewCanvasName(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button
								variant="secondary"
								onClick={() => toggleCreateNewCanvas(false)}
							>
								Cancel
							</Button>
							<Button
								variant="default"
								onClick={() =>
									createCanvas.mutate({ name: createNewCanvasState.name })
								}
								disabled={createCanvas.isLoading}
							>
								{createCanvas.isLoading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Create
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardContent>
		</Card>
	);
}
