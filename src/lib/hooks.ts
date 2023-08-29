import { formatRemoteData, trpc } from "./utils";
import { loginEdges, loginNodes } from "@/lib/node-presets/login-nodes";
import { useEffect, useRef } from "react";
import { welcomeEdges, welcomeNodes } from "./node-presets/welcome-nodes";

import { flowSelector } from "./constants";
import { useReactFlow } from "reactflow";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "./store";

export const registerHooks = () => {
	const search = useSearchParams();

	const { data: session } = useSession();
	const lastCanvasId = useRef<string | undefined>();
	const [canvasId, setCurrentCanvasId] = useStore((state) => [
		state.currentCanvasId,
		state.setCurrentCanvasId,
	]);
	const { setNodes, setEdges } = useStore(flowSelector);

	const remoteNodes = trpc.nodes.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id && !["welcome", ""].includes(canvasId) },
	);
	const remoteEdges = trpc.edges.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id && !["welcome", ""].includes(canvasId) },
	);
	useEffect(() => {
		if ((!canvasId && session?.user.id) || canvasId === "welcome") {
			setNodes(welcomeNodes);
		} else if (remoteNodes.data) {
			console.log("remoteNodes.data", remoteNodes.data);
			setNodes(formatRemoteData(remoteNodes.data, true));
		} else if (
			(remoteNodes.error && remoteNodes.error.data?.code === "UNAUTHORIZED") ||
			!session?.user?.id
		) {
			setNodes(loginNodes);
		}
	}, [remoteNodes.data, canvasId]);

	useEffect(() => {
		if ((!canvasId && session?.user.id) || canvasId === "welcome") {
			setEdges(welcomeEdges);
		} else if (remoteEdges.data) {
			setEdges(
				remoteEdges.data.map((edge) => ({
					id: edge.id,
					source: edge.fromId,
					target: edge.toId,
					type: edge.type,
				})),
			);
		} else if (
			(remoteEdges.error && remoteEdges.error.data?.code === "UNAUTHORIZED") ||
			!session?.user?.id
		) {
			setEdges(loginEdges);
		}
	}, [remoteEdges.data]);
	useEffect(() => {
		const canvasId = search.get("canvasId");
		if (canvasId) {
			setCurrentCanvasId(canvasId);
		}
	}, [search]);

	const { fitView } = useReactFlow();

	useEffect(() => {
		if (canvasId && canvasId !== lastCanvasId.current) {
			lastCanvasId.current = canvasId;
			fitView();
		}
	}, [canvasId]);
};
