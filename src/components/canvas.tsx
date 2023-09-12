import { FIT_VIEW, edgeTypes, nodeTypes } from "@/lib/constants";
import { useKeyPress, useReactFlow } from "reactflow";
import { BackgroundStyled, ReactFlowStyled } from "./themed-flow";

import { registerCallbacks } from "@/lib/callbacks";
import { registerHooks } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { subscribe } from "@/lib/subscriptions";
import { canEdit } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRef } from "react";
import CanvasContext from "./canvas-context";
import HelperLines from "./helper-lines";

const Flow = ({
	children,
}: {
	children?: React.ReactNode;
}) => {
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { data: session } = useSession();
	const { nodes, edges } = useStore((s) => ({
		nodes: s.nodes,
		edges: s.edges,
	}));

	const shiftDown = useKeyPress("Shift");

	const { project } = useReactFlow();

	const setContextMenuPosition = useStore(
		(state) => state.setContextMenuPosition,
	);
	const permission = useStore((state) => state.permission);
	const helperLineHorizontal = useStore((state) => state.helperLineHorizontal);
	const helperLineVertical = useStore((state) => state.helperLineVertical);
	const setInstance = useStore((state) => state.setInstance);

	registerHooks();

	const {
		onConnect,
		onConnectStart,
		onConnectEnd,
		onEdgesChange,
		onNodesChange,
		onNodeDrag,
		onNodeDragStart,
		onNodeDragStop,
	} = registerCallbacks(reactFlowWrapper);
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
					// console.log(event);
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
					nodes={nodes.filter((n) => !n.data.preset)}
					edges={edges}
					onNodesChange={onNodesChange}
					onNodeDragStop={onNodeDragStop}
					onNodeDragStart={onNodeDragStart}
					onNodeDrag={onNodeDrag}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
					onConnectStart={onConnectStart}
					snapToGrid={shiftDown}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					minZoom={0.1}
					maxZoom={3}
					fitViewOptions={FIT_VIEW}
					proOptions={{
						hideAttribution: true,
					}}
					elementsSelectable={canEdit(permission)}
					className="h-full"
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
		</div>
	);
};

export default Flow;
