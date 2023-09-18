"use-client";
import { ModeToggle } from "@/components/composed/mode-toggle";
import UserStack from "@/components/composed/users-stack";
import { BackgroundStyled } from "@/components/flow/background";
import FlowContext from "@/components/flow/context";
import { RoomProvider } from "@/components/providers/pluv";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { DEEFAULT_NODE_DIMENSIONS, NODE_NAMES } from "@/lib/constants";
import { useEdges, useNodes } from "@/lib/flow/elements";
import { formatNodesFlow } from "@/lib/flow/format";
import { useFlowProps } from "@/lib/flow/useProps";
import { usePluvOthers } from "@/lib/pluv/bundle";
import { useMouseTrack } from "@/lib/pluv/useMouseTrack";
import { prisma } from "@/lib/prisma";
import { canAccessCanvas, getRandomHexColor } from "@/lib/utils";
import { GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
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
				state: "default",
			}}
		>
			<Canvas />
		</RoomProvider>
	);
}

function Canvas() {
	const { data: session, status } = useSession();
	const others = usePluvOthers();

	const { nodes, remoteNodes, nodesShared } = useNodes();
	const { edges } = useEdges();

	const flowProps = useFlowProps(remoteNodes, nodesShared);
	useMouseTrack();
	const triggerNodeChanges = useStoreFlow((e) => e.triggerNodeChanges);
	if (status === "loading") return <Loader />;
	return (
		<div className="h-[100svh] w-full">
			<FlowContext>
				<ReactFlow nodes={formatNodesFlow(nodes, others)} edges={edges} {...flowProps}>
					<BackgroundStyled />
					<Panel position="top-right">
						{/* <User user={session?.user} className="mr-2 mt-2 justify-self-end" /> */}
						<UserStack
							users={(others as any[])
								.map((e) => e.user)
								.concat([{ ...session?.user, me: true }])}
							className="mr-2 mt-2"
						/>
					</Panel>
					<Panel position="top-left">
						<ModeToggle className="ml-2 mt-2" />
					</Panel>
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
											...DEEFAULT_NODE_DIMENSIONS,
										},
									},
								]);
							}}
						>
							Add Node
						</Button>
					</Panel>
				</ReactFlow>
			</FlowContext>
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
