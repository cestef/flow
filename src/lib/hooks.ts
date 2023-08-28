import { formatRemoteData, trpc } from "./utils";
import { loginEdges, loginNodes } from "@/login-nodes";

import { flowSelector } from "./constants";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "./store";

export const registerHooks = () => {
	const search = useSearchParams();

	const { data: session } = useSession();

	const [canvasId, setCurrentCanvasId] = useStore((state) => [
		state.currentCanvasId,
		state.setCurrentCanvasId,
	]);
	const { setNodes, setEdges } = useStore(flowSelector);

	const remoteNodes = trpc.nodes.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id },
	);
	const remoteEdges = trpc.edges.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id },
	);
	useEffect(() => {
		if (remoteNodes.data) {
			setNodes(formatRemoteData(remoteNodes.data, true));
		} else if (
			(remoteNodes.error && remoteNodes.error.data?.code === "UNAUTHORIZED") ||
			!session?.user?.id
		) {
			setNodes(loginNodes);
		} else if (session.user.id && !remoteNodes.data) {
			// setNodes(welcomeNodes);
		}
	}, [remoteNodes.data, canvasId]);

	useEffect(() => {
		console.log("remoteEdges", remoteEdges);
		if (remoteEdges.data) {
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
		} else if (session.user.id && !remoteNodes.data) {
			// setNodes(welcomeEdges);
		}
	}, [remoteEdges.data]);
	useEffect(() => {
		const canvasId = search.get("canvasId");
		if (canvasId) {
			setCurrentCanvasId(canvasId);
		}
	}, [search]);
};
