import { loginEdges, loginNodes } from "@/lib/node-presets/login-nodes";
import { useEffect, useRef } from "react";
import { welcomeEdges, welcomeNodes } from "./node-presets/welcome-nodes";
import { formatRemoteEdges, formatRemoteNodes, trpc } from "./utils";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { MarkerType, useReactFlow } from "reactflow";
import { flowSelector } from "./constants";
import { useStore } from "./store";

export const registerHooks = () => {
	const search = useSearchParams();

	const { data: session } = useSession();
	const lastCanvasId = useRef<string | undefined>();
	const [canvasId, setCurrentCanvasId] = useStore((state) => [
		state.currentCanvasId,
		state.setCurrentCanvasId,
	]);
	const { setNodes, setEdges, setComments } = useStore(flowSelector);

	const remoteNodes = trpc.nodes.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id && !["welcome", ""].includes(canvasId) },
	);
	const remoteEdges = trpc.edges.list.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id && !["welcome", ""].includes(canvasId) },
	);

	const remoteComments = trpc.comments.get.useQuery(
		{ canvasId },
		{ enabled: !!session?.user?.id && !["welcome", ""].includes(canvasId) },
	);

	useEffect(() => {
		if (remoteComments.data) {
			setComments(remoteComments.data);
		}
	}, [remoteComments.data]);

	useEffect(() => {
		if (
			((!canvasId && session?.user.id) || canvasId === "welcome") &&
			!remoteNodes.isLoading
		) {
			setNodes(welcomeNodes);
		} else if (remoteNodes.data) {
			console.log("remoteNodes.data", remoteNodes.data);
			setNodes(formatRemoteNodes(remoteNodes.data, true));
		} else if (
			(remoteNodes.error && remoteNodes.error.data?.code === "UNAUTHORIZED") ||
			!session?.user?.id
		) {
			setNodes(loginNodes);
		}
	}, [remoteNodes.data, canvasId]);

	useEffect(() => {
		if (
			((!canvasId && session?.user.id) || canvasId === "welcome") &&
			!remoteEdges.isLoading
		) {
			setEdges(welcomeEdges);
		} else if (remoteEdges.data) {
			setEdges(formatRemoteEdges(remoteEdges.data));
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
