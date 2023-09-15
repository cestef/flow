import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useStore } from "@/lib/store";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef } from "react";
import { createCanvas } from "@/lib/mutations/canvas";
import { mutate } from "swr";

export default function NewCanvasDialog({ children }: { children: React.ReactNode }) {
	const createNewCanvasState = useStore((state) => state.createNewCanvas);
	const setCanvasId = useStore((state) => state.setCanvasId);
	const setNewCanvasName = useStore((state) => state.setNewCanvasName);
	const newCanvasName = useStore((state) => state.newCanvasName);
	const toggleCreateNewCanvas = useStore((state) => state.toggleCreateNewCanvas);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { toast } = useToast();

	return (
		<Dialog open={createNewCanvasState} onOpenChange={(e) => toggleCreateNewCanvas(e)}>
			<DialogTrigger asChild>{children}</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new canvas</DialogTitle>
				</DialogHeader>
				<Tabs defaultValue="create">
					<TabsList>
						<TabsTrigger value="create">Create</TabsTrigger>
						<TabsTrigger value="import">Import</TabsTrigger>
					</TabsList>
					<TabsContent value="create">
						<div className="flex flex-col">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									// createCanvas.mutate({
									// 	name: createNewCanvasState.name,
									// });
								}}
							>
								<Input
									type="text"
									placeholder="Canvas name"
									className="w-full"
									value={newCanvasName}
									onChange={(e) => setNewCanvasName(e.target.value)}
								/>
							</form>
						</div>
						<DialogFooter className="mt-4">
							<Button
								variant="secondary"
								onClick={() => toggleCreateNewCanvas(false)}
							>
								Cancel
							</Button>
							<Button
								variant="default"
								onClick={async () => {
									const { id } = await createCanvas(newCanvasName);
									toggleCreateNewCanvas(false);
									await mutate("/api/canvas");
									setCanvasId(id);
								}}
								// disabled={createCanvas.isLoading}
							>
								{/* {createCanvas.isLoading && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)} */}
								Create
							</Button>
						</DialogFooter>
					</TabsContent>
					<TabsContent value="import">
						<div className="flex flex-col gap-2">
							<Label htmlFor="canvasName">Canvas name</Label>
							<Input
								type="text"
								id="canvasName"
								placeholder="Canvas name"
								className="w-full mb-2"
								value={newCanvasName}
								onChange={(e) => setNewCanvasName(e.target.value)}
							/>
							<Label htmlFor="canvasFile">JSON file</Label>
							<Input
								type="file"
								id="canvasFile"
								className="w-full"
								accept="application/json"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) {
										const reader = new FileReader();
										reader.onload = async (e) => {
											try {
												const data = JSON.parse(e.target?.result as string);
												const ZFile = z.object({
													nodes: z.array(z.any()),
													edges: z.array(z.any()),
													canvas: z.string().optional(),
												});
												console.log(data);
												const parsed = ZFile.parse(data);
												setNewCanvasName(parsed.canvas ?? "Untitled");
											} catch (err) {
												console.error(err);
												toast({
													title: "Error",
													description: "Invalid file",
													variant: "destructive",
												});
											}
										};
										reader.readAsText(file);
									}
								}}
								ref={fileInputRef}
							/>
							<DialogFooter className="mt-4">
								<Button
									variant="secondary"
									onClick={() => toggleCreateNewCanvas(false)}
								>
									Cancel
								</Button>
								<Button
									variant="default"
									onClick={() => {
										const file = fileInputRef.current?.files?.[0];
										if (file) {
											const reader = new FileReader();
											reader.onload = async (e) => {
												try {
													const data = JSON.parse(
														e.target?.result as string
													);
													// const ZFile = z.object({
													// 	nodes: z.array(z.any()),
													// 	edges: z.array(z.any()),
													// 	canvas: z.string().optional(),
													// });
													console.log(data);
													// const parsed = ZFile.parse(data);
													// importCanvas.mutate({
													// 	name:
													// 		createNewCanvasState.name ??
													// 		"Untitled",
													// 	nodes: formatLocalNodes(
													// 		parsed.nodes
													// 	),
													// 	edges: formatLocalEdges(
													// 		parsed.edges
													// 	),
													// });
												} catch (err) {
													console.error(err);
													toast({
														title: "Error",
														description: "Invalid file",
														variant: "destructive",
													});
												}
											};
											reader.readAsText(file);
										}
									}}
									// disabled={importCanvas.isLoading}
								>
									{/* {importCanvas.isLoading && (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												)} */}
									Import
								</Button>
							</DialogFooter>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
