import { edgeTypes, flowSelector, nodeTypes } from "@/lib/constants";
import { useKeyPress, useReactFlow } from "reactflow";
import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";

import { registerCallbacks } from "@/lib/callbacks";
import { registerHooks } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { subscribe } from "@/lib/subscriptions";
import { useSession } from "next-auth/react";
import { useRef } from "react";
import Selecto from "react-selecto";
import CanvasContext from "./canvas-context";
import HelperLines from "./helper-lines";

const Flow = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();
	const { nodes, edges, findAndUpdateNode } = useStore(flowSelector);

	const shiftDown = useKeyPress("Shift");

	const { project } = useReactFlow();

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const [selecting, setSelecting] = useStore((state) => [
		state.selecting,
		state.setSelecting,
	]);
	const helperLineHorizontal = useStore((state) => state.helperLineHorizontal);
	const helperLineVertical = useStore((state) => state.helperLineVertical);
	const selectedBrush = useStore((state) => state.selectedBrush);
	const setInstance = useStore((state) => state.setInstance);

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
					selectionKeyCode={"Meta"}
					onInit={setInstance}
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

						console.log(
							addedIds,
							removedIds,
							e.selected.map((el) => el.getAttribute("data-id")),
						);

						findAndUpdateNode(
							(n) => addedIds.includes(n.id),
							(node) => ({
								...node,
								selected: true,
							}),
						);

						findAndUpdateNode(
							(n) => removedIds.includes(n.id),
							(node) => ({
								...node,
								selected: false,
							}),
						);
					}}
				/>
			)}
		</div>
	);
};

export default Flow;
