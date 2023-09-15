import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ComboBox from "@/components/ui/combobox";
import { FIT_VIEW } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { useGet } from "@/lib/swr";
import useConfirm from "@/lib/useConfirm";
import { cn } from "@/lib/utils";
import { Canvas } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useReactFlow } from "reactflow";
import NewCanvasDialog from "./new";

export default function CanvasPanel() {
	const { data: session } = useSession();
	const canvasId = useStore((state) => state.canvasId);
	const setCanvasId = useStore((state) => state.setCanvasId);
	const toggleChooseCanvas = useStore((state) => state.toggleChooseCanvas);
	const chooseCanvas = useStore((state) => state.chooseCanvas);
	const toggleCreateNewCanvas = useStore((state) => state.toggleCreateNewCanvas);

	const canvases = useGet<(Canvas & { name: string })[]>("/api/canvas");
	// const createCanvas = trpc.canvas.add.useMutation({
	// 	onSuccess() {
	// 		toggleCreateNewCanvas(false);
	// 		canvases.refetch();
	// 	},
	// });
	// const deleteCanvas = trpc.canvas.delete.useMutation({
	// 	onSuccess() {
	// 		canvases.refetch();
	// 		setCanvasId("welcome");
	// 	},
	// });
	// const importCanvas = trpc.canvas.import.useMutation({
	// 	onSuccess() {
	// 		canvases.refetch();
	// 		toggleCreateNewCanvas(false);
	// 	},
	// });

	const { confirm, modal } = useConfirm();
	const lastCanvasId = useRef<string | null>(null);
	useEffect(() => {
		if (canvases.data && !canvasId && canvases.data.length > 0) {
			setCanvasId(canvases.data[0].id);
		} else if (canvases.data?.length === 0) {
			setCanvasId("welcome");
		}
		if (canvasId !== lastCanvasId.current) {
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					fitView(FIT_VIEW);
				});
			});
		}
		lastCanvasId.current = canvasId;
	}, [canvases.data, canvasId]);
	const togglePanel = useStore((state) => state.toggleCanvasPanel);
	const toggleMembersPanel = useStore((state) => state.toggleMembersPanel);
	const togglePresetsPanel = useStore((state) => state.togglePresetsPanel);
	const isMobile = useStore((state) => state.isMobile);
	const panelOpen = useStore((state) => state.canvasPanel);

	const { fitView } = useReactFlow();
	return (
		<div className="relative">
			{modal}
			<Card className={cn("w-64")}>
				<Button
					size="icon"
					className="absolute top-4 right-4"
					variant="ghost"
					onClick={() => {
						togglePanel();
						if (isMobile) {
							toggleMembersPanel(true);
							togglePresetsPanel(true);
						}
					}}
				>
					<ArrowDownLeft
						className={`w-4 h-4 ${
							!panelOpen ? "rotate-180" : ""
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
									data={[
										{
											label: "Welcome",
											value: "welcome",
											deletable: false,
										},
									].concat(
										canvases.data?.map((canvas) => ({
											label: canvas.name,
											value: canvas.id,
											deletable: canvas.ownerId === session.user?.id,
										})) ?? []
									)}
									value={canvasId || "welcome"}
									onSelect={(e) => {
										// console.log(e);
										setCanvasId(e);
										toggleChooseCanvas(false);
									}}
									onRemove={async (e) => {
										const res = await confirm(
											"Do you really want to delete this canvas?"
										);
										if (res) {
											// deleteCanvas.mutate({ id: e });
										}
									}}
									label="Select a Canvas"
									open={chooseCanvas}
									onOpenChange={(e) => toggleChooseCanvas(e)}
								/>
							</>
						) : (
							<p className="text-gray-400">Sign in to create a canvas</p>
						)}
					</div>

					<NewCanvasDialog>
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
					</NewCanvasDialog>
				</CardContent>
			</Card>
		</div>
	);
}
