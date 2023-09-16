"use-client";
import { BackgroundStyled } from "@/components/flow/background";
import { Button } from "@/components/ui/button";
import { NODE_NAMES } from "@/lib/constants";
import { formatNodesFlow } from "@/lib/flow/format";
import { useFlowProps } from "@/lib/flow/useProps";
import { usePluvOthers, usePluvStorage } from "@/lib/pluv/bundle";
import { RoomProvider } from "@/lib/pluv/provider";
import { useMouseTrack } from "@/lib/pluv/useMouseTrack";
import { prisma } from "@/lib/prisma";
import { useStore } from "@/lib/store";
import { canAccessCanvas, getRandomHexColor } from "@/lib/utils";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import { useEffect } from "react";
import ReactFlow, { Panel, useStore as useStoreFlow } from "reactflow";

function Room({ id }: { id: string }) {
	return (
		<RoomProvider
			room={id}
			initialPresence={{
				color: getRandomHexColor(),
				x: 0,
				y: 0,
				grabbing: false,
				currentSelected: [],
			}}
		>
			<Canvas />
		</RoomProvider>
	);
}

function Canvas() {
	const others = usePluvOthers();
	const [nodes, setNodes] = useStore((e) => [e.nodes, e.setNodes] as const);
	const [edges, setEdges] = useStore((e) => [e.edges, e.setEdges] as const);

	const [remoteNodes, nodesShared] = usePluvStorage("nodes");
	const [remoteEdges, edgesShared] = usePluvStorage("edges");

	useEffect(() => {
		if (!nodesShared) return;
		const nodes = Object.values(remoteNodes ?? {});
		setNodes(nodes);
	}, [remoteNodes, setNodes, nodesShared]);

	useEffect(() => {
		if (!edgesShared) return;
		const edges = Object.values(remoteEdges ?? {});
		setEdges(edges);
	}, [remoteEdges, setEdges, edgesShared]);

	const flowProps = useFlowProps(remoteNodes, nodesShared);
	useMouseTrack();
	const triggerNodeChanges = useStoreFlow((e) => e.triggerNodeChanges);

	return (
		<div className="h-[100svh] w-full">
			<ReactFlow nodes={formatNodesFlow(nodes, others)} edges={edges} {...flowProps}>
				<BackgroundStyled />
				<Panel position="bottom-center">
					<Button
						onClick={() => {
							const id = Math.random().toString(36).substring(7);
							triggerNodeChanges([
								{
									type: "add",
									item: {
										id,
										type: NODE_NAMES.DEFAULT,
										position: {
											x: Math.random() * 100,
											y: Math.random() * 100,
										},
										data: {
											label: id,
										},
									},
								},
							]);
						}}
					>
						Add Node
					</Button>
				</Panel>
			</ReactFlow>
		</div>
	);
}

export default Room;

export async function getServerSideProps({ params, req }: GetServerSidePropsContext) {
	const session = await getSession({ req });
	if (!session) {
		return {
			redirect: {
				destination: "/auth/login",
				permanent: false,
			},
		};
	}
	const id = params?.id;
	if (!id || typeof id !== "string") {
		return {
			notFound: true,
		};
	}
	const canvas = await prisma.canvas.findUnique({
		where: {
			id,
		},
		include: {
			members: true,
		},
	});
	if (!canAccessCanvas(canvas, session.user.id)) {
		return {
			notFound: true,
		};
	}
	if (!canvas) {
		return {
			notFound: true,
		};
	}

	return {
		props: {
			id: canvas.id,
		},
	};
}
