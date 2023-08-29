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
		{
			enabled:
				!!session?.user?.id && !["welcome", "", undefined].includes(canvasId),
		},
	);
	const remoteEdges = trpc.edges.list.useQuery(
		{ canvasId },
		{
			enabled:
				!!session?.user?.id && !["welcome", "", undefined].includes(canvasId),
		},
	);

	const remoteComments = trpc.comments.get.useQuery(
		{ canvasId },
		{
			enabled:
				!!session?.user?.id && !["welcome", "", undefined].includes(canvasId),
		},
	);

	useEffect(() => {
		if (remoteComments.data) {
			setComments(remoteComments.data);
		}
	}, [remoteComments.data]);

	useEffect(() => {
		if ((!canvasId && session?.user.id) || canvasId === "welcome") {
			console.log("welcomeNodes", welcomeNodes);
			setNodes(welcomeNodes);
		} else if (remoteNodes.data) {
			console.log("remoteNodes.data", remoteNodes.data);
			const formattedNodes = formatRemoteNodes(remoteNodes.data, true);
			console.log("formattedNodes", formattedNodes);
			setNodes(formattedNodes);
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
