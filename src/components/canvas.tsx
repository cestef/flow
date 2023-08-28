import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";
import { edgeTypes, flowSelector, nodeTypes } from "@/lib/constants";
import { formatRemoteData, trpc } from "@/lib/utils";
import { loginEdges, loginNodes } from "@/login-nodes";
import { useEffect, useRef } from "react";
import { useKeyPress, useReactFlow } from "reactflow";

import CanvasContext from "./canvas-context";
import HelperLines from "./helper-lines";
import Selecto from "react-selecto";
import { registerCallbacks } from "@/lib/callbacks";
import { registerHooks } from "@/lib/hooks";
import { subscribe } from "@/lib/subscriptions";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";

const Flow = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();
	const { nodes, edges } = useStore(flowSelector);

	const shiftDown = useKeyPress("Shift");

	const { project } = useReactFlow();

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const helperLineHorizontal = useStore((state) => state.helperLineHorizontal);
	const helperLineVertical = useStore((state) => state.helperLineVertical);
	const selectedBrush = useStore((state) => state.selectedBrush);

	registerHooks();

	const {
		onConnect,
		onEdgesChange,
		onNodeClick,
		onNodeDrag,
		onNodeDragStart,
		onNodeDragStop,
		onNodesChange,
	} = registerCallbacks();

	if (session?.user?.id) subscribe();

	return (
		<div
			ref={reactFlowWrapper}
			className="flex-grow h-full"
			onContextMenu={(event) => {
				const targetIsPane = (event.target as any).classList.contains(
					"react-flow__pane",
				);

				if (targetIsPane) {
					console.log(event);
					// we need to remove the wrapper bounds, in order to get the correct position
					const { top, left } =
						reactFlowWrapper.current!.getBoundingClientRect();
					const position = project({
						x: event.clientX - left,
						y: event.clientY - top,
					});
					setContextMenuPosition(position.x, position.y);
				}
			}}
		>
			<CanvasContext>
				<ReactFlowStyled
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onNodeDragStop={onNodeDragStop}
					onNodeDragStart={onNodeDragStart}
					onNodeDrag={onNodeDrag}
					onEdgesChange={onEdgesChange}
					onNodeClick={onNodeClick}
					onConnect={onConnect}
					snapToGrid={shiftDown}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					minZoom={0.1}
					proOptions={{
						hideAttribution: true,
					}}
					className="h-full"
					panOnDrag={["pointer", "delete", undefined].includes(selectedBrush)}
				>
					<BackgroundStyled />
					<HelperLines
						horizontal={helperLineHorizontal}
						vertical={helperLineVertical}
					/>
					{children}
				</ReactFlowStyled>
			</CanvasContext>
			{selectedBrush === "select" && (
				<Selecto
					selectableTargets={[".react-flow__node"]}
					hitRate={50}
					onSelect={(e) => {
						const addedIds = e.added
							.map((el) => el.getAttribute("data-id"))
							.filter(Boolean) as string[];
						const removedIds = e.removed
							.map((el) => el.getAttribute("data-id"))
							.filter(Boolean) as string[];

						onNodesChange(
							addedIds.map((id) => ({
								id,
								type: "select",
								selected: true,
							})),
						);

						onNodesChange(
							removedIds.map((id) => ({
								id,
								type: "select",
								selected: false,
							})),
						);
					}}
					onSelectEnd={(e) => {
						onNodesChange(
							e.selected.map((el) => ({
								id: el.id,
								type: "select",
								selected: true,
							})),
						);
					}}
				/>
			)}
		</div>
	);
};

export default Flow;
