import { FIT_VIEW, NODE_NAMES, NODE_TYPES } from "@/lib/constants";
import { AugmentedCanvas } from "@/pages/dashboard/[[...id]]";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import ReactFlow from "reactflow";

export default function DashboardOverview({
	canvas,
	data,
}: {
	canvas?: string;
	data?: AugmentedCanvas;
}) {
	const router = useRouter();
	return (
		<div className="flex flex-col gap-6 items-center justify-center h-[calc(100svh-100px)]">
			{canvas ? (
				<div className="w-full h-full flex flex-col gap-6 items-center justify-center">
					<h1 className="text-4xl font-bold">Overview</h1>
					<p className="text-xl text-muted-foreground">
						You can view and manage this canvas.
					</p>
					<div
						onClick={() => router.push(`/canvas/${data?.id}`)}
						className="relative w-full h-full md:w-[calc(70%-4rem)] md:h-[calc(70%-4rem)] border rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200 group cursor-pointer"
					>
						<ReactFlow
							proOptions={{ hideAttribution: true }}
							nodes={
								data?.nodes.length === 0
									? [
											{
												id: "1",
												type: "preview",
												position: { x: 0, y: 0 },
												data: {
													label: "This canvas doesn't have any node !",
												},
											},
									  ]
									: data?.nodes.map((e) => ({
											...e,
											type: NODE_NAMES.PREVIEW,
									  })) ?? [
											{
												id: "1",
												type: "preview",
												position: { x: 0, y: 0 },
												data: {
													label: "This canvas doesn't have any node !",
												},
											},
									  ]
							}
							edges={data?.edges ?? []}
							fitView
							fitViewOptions={FIT_VIEW}
							panOnDrag={false}
							zoomOnPinch={false}
							zoomOnScroll={false}
							nodeTypes={NODE_TYPES}
						/>
						<ArrowRight
							size={24}
							className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
						/>
					</div>
				</div>
			) : (
				<p className="text-xl text-muted-foreground">
					You are not currently viewing any canvas.
				</p>
			)}
		</div>
	);
}
