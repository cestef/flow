import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DialogFooter, DialogHeader } from "./ui/dialog";
import { Loader2, Plus } from "lucide-react";

import { Button } from "./ui/button";
import ComboBox from "./combobox";
import { Input } from "./ui/input";
import { trpc } from "@/lib/utils";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/store";

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

	return (
		<Card className="w-64">
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
						<p>Sign in to create a canvas</p>
					)}
				</div>

				<Dialog
					open={createNewCanvasState.opened}
					onOpenChange={(e) => toggleCreateNewCanvas(e)}
				>
					<DialogTrigger asChild>
						<Button
							size="sm"
							variant="secondary"
							className="mt-4 w-full"
							onClick={() => toggleCreateNewCanvas(true)}
						>
							<Plus className="mr-2 w-4 h-4" />
							Create
						</Button>
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
