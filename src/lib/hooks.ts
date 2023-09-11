import { loginEdges, loginNodes } from "@/lib/node-presets/login-nodes";
import { useEffect, useRef } from "react";
import { welcomeEdges, welcomeNodes } from "./node-presets/welcome-nodes";
import { formatRemoteEdges, formatRemoteNodes, trpc } from "./utils";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useReactFlow } from "reactflow";
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
			enabled: !!session?.user?.id,
		},
	);
	const remoteEdges = trpc.edges.list.useQuery(
		{ canvasId },
		{
			enabled: !!session?.user?.id,
		},
	);

	const remoteComments = trpc.comments.get.useQuery(
		{ canvasId },
		{
			enabled: !!session?.user?.id,
		},
	);

	const memberMe = trpc.members.me.useQuery(
		{
			canvasId,
		},
		{
			enabled: !!session?.user?.id && !!canvasId,
		},
	);
	const me = trpc.users.me.useQuery(undefined, {
		enabled: !!session?.user?.id,
	});
	const [settings, setSettings] = useStore((state) => [
		state.settings,
		state.setSettings,
	]);
	useEffect(() => {
		if (me.data?.settings) {
			setSettings(me.data.settings);
		}
	}, [me.data]);

	const [permission, setPermission] = useStore((state) => [
		state.permission,
		state.setPermission,
	]);

	useEffect(() => {
		if (memberMe.data) {
			setPermission(memberMe.data.permission);
		}
	}, [memberMe.data]);

	useEffect(() => {
		if (remoteComments.data) {
			setComments(remoteComments.data);
		}
	}, [remoteComments.data]);

	useEffect(() => {
		console.log("canvasId", canvasId);
		console.log("remoteNodes.data", remoteNodes.data);
		console.log("remoteNodes.fetchStatus", remoteNodes.fetchStatus);
		if (canvasId === "welcome") {
			console.log("welcomeNodes", welcomeNodes);
			setNodes(welcomeNodes);
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					fitView();
				});
			});
		} else if (remoteNodes.data && canvasId) {
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
	}, [remoteNodes.data, remoteNodes.isFetched, canvasId]);

	useEffect(() => {
		if (canvasId === "welcome") {
			// console.log("welcomeEdges", welcomeEdges);
			setEdges(welcomeEdges);
		} else if (remoteEdges.data) {
			// console.log("remoteEdges.data", remoteEdges.data);
			setEdges(formatRemoteEdges(remoteEdges.data));
		} else if (
			(remoteEdges.error && remoteEdges.error.data?.code === "UNAUTHORIZED") ||
			!session?.user?.id
		) {
			// console.log("loginEdges", loginEdges);
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
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					fitView();
				});
			});
		}
	}, [canvasId]);

	const toggleCanvasPanel = useStore((state) => state.toggleCanvasPanel);
	const toggleMembersPanel = useStore((state) => state.toggleMembersPanel);
	const isMobile = useStore((state) => state.isMobile);
	const setIsMobile = useStore((state) => state.setIsMobile);

	useEffect(() => {
		const updateWindowDimensions = () => {
			const isMobile = window.innerWidth < 768;
			setIsMobile(isMobile);
		};

		setIsMobile(window.innerWidth < 768);

		window.addEventListener("resize", updateWindowDimensions);

		return () => window.removeEventListener("resize", updateWindowDimensions);
	}, []);

	useEffect(() => {
		if (isMobile) {
			toggleCanvasPanel(true);
			toggleMembersPanel(true);
		}
	}, [isMobile]);
};
