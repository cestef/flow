import { useReactFlow } from "reactflow";
import { usePluvMyPresence } from "./bundle";
import { useStore } from "../store";
import { useEffect } from "react";

export const useMouseTrack = () => {
	const [_, updateMyPresence] = usePluvMyPresence();
	const { project } = useReactFlow();
	const canvasId = useStore((e) => e.canvasId);

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			updateMyPresence({
				x: projected.x,
				y: projected.y,
			});
		};

		window.addEventListener("mousemove", onMouseMove);

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
		};
	}, [project, canvasId]);
};
