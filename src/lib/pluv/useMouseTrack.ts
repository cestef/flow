import { useReactFlow } from "reactflow";
import { usePluvMyPresence } from "./bundle";
import { useStore } from "../store";
import { useEffect } from "react";

export const useMouseTrack = () => {
	const [state, updateMyPresence] = usePluvMyPresence((e) => e.state);
	const { project } = useReactFlow();
	const canvasId = useStore((e) => e.canvasId);

	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			const projected = project({
				x: e.clientX,
				y: e.clientY,
			});
			if (!["color"].includes(state))
				updateMyPresence({
					x: projected.x,
					y: projected.y,
				});
		};

		window.addEventListener("mousemove", onMouseMove);

		return () => {
			window.removeEventListener("mousemove", onMouseMove);
		};
	}, [project, canvasId, state]);
};
