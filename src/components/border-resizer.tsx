import { cn, trpc } from "@/lib/utils";
import { D3DragEvent, SubjectPosition, drag } from "d3-drag";
import { useEffect, useRef } from "react";
import {
	NodeChange,
	NodeDimensionChange,
	NodePositionChange,
	clamp,
	useGetPointerPosition,
	useNodeId,
	useStoreApi,
} from "reactflow";

import { flowSelector } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { select } from "d3-selection";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const initPrevValues = { x: 0, y: 0 };

const initStartValues = {
	...initPrevValues,
	pointerX: 0,
	pointerY: 0,
};

type ResizeDragEvent = D3DragEvent<HTMLDivElement, null, SubjectPosition>;

const BorderResizerControl = ({
	position,
	onResize,
}: {
	position: Position;
	onResize?: any;
}) => {
	const id = useNodeId();
	const storeApi = useStoreApi();
	const { updateNode } = useStore(flowSelector);
	const startValues = useRef<typeof initStartValues>(initStartValues);
	const prevValues = useRef<typeof initPrevValues>(initPrevValues);
	const controlRef = useRef<HTMLDivElement>(null);
	const getPointerPosition = useGetPointerPosition();
	const MupdateNode = trpc.nodes.update.useMutation();
	useEffect(() => {
		if (!controlRef.current || !id) return;

		const selection = select(controlRef.current);

		const dragHandler = drag<HTMLDivElement, unknown>()
			.on("start", (event: ResizeDragEvent) => {
				const node = storeApi.getState().nodeInternals.get(id);
				const { xSnapped, ySnapped } = getPointerPosition(event);

				prevValues.current = {
					x: node?.position.x ?? 0,
					y: node?.position.y ?? 0,
				};

				startValues.current = {
					...prevValues.current,
					pointerX: xSnapped,
					pointerY: ySnapped,
				};
				// console.log("start", startValues.current);
			})
			.on("drag", (event: ResizeDragEvent) => {
				const { nodeInternals, triggerNodeChanges } = storeApi.getState();
				const { xSnapped, ySnapped } = getPointerPosition(event);
				const node = nodeInternals.get(id);

				if (!node) return;

				const { pointerX: startX, pointerY: startY } = startValues.current;

				const distX = Math.floor(xSnapped - startX);
				const distY = Math.floor(ySnapped - startY);
				// console.log(distX, distY, position);

				let dist = 0;

				switch (position) {
					case "top-left":
						if (distX > 0 && distY > 0) {
							dist = Math.sqrt(distX ** 2 + distY ** 2);
						}
						break;
					case "top-right":
						if (distX < 0 && distY > 0) {
							dist = Math.sqrt(distX ** 2 + distY ** 2);
						}
						break;
					case "bottom-left":
						if (distX > 0 && distY < 0) {
							dist = Math.sqrt(distX ** 2 + distY ** 2);
						}
						break;
					case "bottom-right":
						if (distX < 0 && distY < 0) {
							dist = Math.sqrt(distX ** 2 + distY ** 2);
						}
						break;
				}

				updateNode({
					id,
					data: {
						...node.data,
						borderRadius: dist,
					},
				});

				MupdateNode.mutate({
					id,
					borderRadius: dist,
				});

				onResize?.(prevValues.current);
				// triggerNodeChanges(changes);
			})
			.on("end", (event: ResizeDragEvent) => {
				const dimensionChange: NodeDimensionChange = {
					id: id,
					type: "dimensions",
					resizing: false,
				};

				storeApi.getState().triggerNodeChanges([dimensionChange]);
			});
		selection.call(dragHandler);

		return () => {
			selection.on(".drag", null);
		};
	}, [id]);
	return (
		<div
			ref={controlRef}
			className={cn(
				"absolute border border-accent rounded-[5px] bg-primary z-10 w-1 h-1",
				{
					"top-2 left-2 cursor-nwse-resize": position === "top-left",
					"top-2 right-2 cursor-nesw-resize": position === "top-right",
					"bottom-2 left-2 cursor-nesw-resize": position === "bottom-left",
					"bottom-2 right-2 cursor-nwse-resize": position === "bottom-right",
				},
			)}
		/>
	);
};

const corners: Position[] = [
	"top-left",
	// "top-right",
	// "bottom-left",
	// "bottom-right",
];

const BorderResizer = ({
	onResize,
	visible = true,
}: {
	onResize?: any;
	visible?: boolean;
}) => {
	if (!visible) return null;
	return (
		<>
			{corners.map((c) => (
				<BorderResizerControl key={c} position={c} onResize={onResize} />
			))}
		</>
	);
};

export default BorderResizer;
