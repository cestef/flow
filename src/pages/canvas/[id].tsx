"use-client";
import UserStack from "@/components/composed/users-stack";
import { BackgroundStyled } from "@/components/flow/background";
import FlowContext from "@/components/flow/context";
import HelperLinesRenderer from "@/components/flow/helper-lines";
import { RoomProvider } from "@/components/providers/pluv";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupItem } from "@/components/ui/button-group";
import Keyboard from "@/components/ui/keyboard";
import { Loader } from "@/components/ui/loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FIT_VIEW } from "@/lib/constants";
import { useEdges, useNodes } from "@/lib/flow/elements";
import { formatNodesFlow } from "@/lib/flow/format";
import { useFlowProps } from "@/lib/flow/useProps";
import {
	usePluvCanRedo,
	usePluvCanUndo,
	usePluvOthers,
	usePluvRedo,
	usePluvUndo,
} from "@/lib/pluv/bundle";
import { useMouseTrack } from "@/lib/pluv/useMouseTrack";
import { prisma } from "@/lib/prisma";
import { useStore } from "@/lib/store";
import { canAccessCanvas, getRandomHexColor } from "@/lib/utils";
import { BoxSelect, Focus, Hand, Home, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { GetServerSidePropsContext } from "next";
import { getSession, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import ReactFlow, { Panel, useReactFlow } from "reactflow";

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
				startX: 0,
				startY: 0,
			}}
		>
			<Canvas />
		</RoomProvider>
	);
}

function Canvas() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const others = usePluvOthers();
	const [leaving, setLeaving] = useState(false);
	const [tool, setTool] = useStore((e) => [e.tool, e.setTool] as const);
	const { nodes, remoteNodes, nodesShared } = useNodes();
	const { edges } = useEdges();
	const canRedo = usePluvCanRedo();
	const canUndo = usePluvCanUndo();
	const redo = usePluvRedo();
	const undo = usePluvUndo();

	const flowProps = useFlowProps(remoteNodes, nodesShared);
	const { fitView, zoomIn, zoomOut } = useReactFlow();
	useHotkeys(["meta+-", "ctrl+-"], (e) => {
		e.preventDefault();
		zoomOut({ duration: 300 });
	});
	useHotkeys(
		["meta$+", "ctrl$+", "meta$shift$1", "ctrl$shift$1"],
		(e) => {
			e.preventDefault();
			zoomIn({ duration: 300 });
		},
		{ combinationKey: "$" },
	);
	useHotkeys(["meta+0", "ctrl+0"], (e) => {
		e.preventDefault();
		fitView(FIT_VIEW);
	});
	useHotkeys(["s"], (e) => {
		e.preventDefault();
		setTool("select");
	});
	useHotkeys(["v"], (e) => {
		e.preventDefault();
		setTool("drag");
	});
	useHotkeys(["meta+z", "ctrl+z"], (e) => {
		e.preventDefault();
		undo();
	});
	useHotkeys(["meta+shift+z", "ctrl+shift+z"], (e) => {
		e.preventDefault();
		redo();
	});

	useMouseTrack();
	const [vertical, horizontal] = useStore((e) => [
		e.helperLines.vertical,
		e.helperLines.horizontal,
	]);
	if (status === "loading") return <Loader />;
	return (
		<div className="h-[100svh] w-full">
			<FlowContext>
				<ReactFlow
					nodes={leaving ? [] : formatNodesFlow(nodes, others)}
					edges={edges}
					selectionOnDrag={tool === "select"}
					panOnDrag={!leaving && tool === "drag"}
					{...flowProps}
				>
					<HelperLinesRenderer horizontal={horizontal} vertical={vertical} />
					<BackgroundStyled />
					<Panel position="top-right">
						<UserStack
							users={(others as any[])
								.map((e) => e.user)
								.concat([{ ...session?.user, me: true }])}
							className="mr-2 mt-2"
						/>
					</Panel>
					<Panel position="top-left">
						{/* <ModeToggle className="ml-2 mt-2" /> */}
						<Button
							size="icon"
							className="ml-2 mt-2"
							onClick={() => {
								setLeaving(true);
								router.push("/dashboard");
							}}
						>
							<Home className="w-6 h-6" />
						</Button>
					</Panel>
					<Panel position="bottom-center">
						<ButtonGroup
							className="gap-1 px-2 py-6"
							value={tool}
							onValueChange={setTool}
						>
							<Tooltip>
								<TooltipTrigger>
									<ButtonGroupItem value="drag" className="p-2">
										<Hand className="w-4 h-4" />
									</ButtonGroupItem>
								</TooltipTrigger>
								<TooltipContent className="bg-transparent border-none shadow-none mb-2">
									<Keyboard keys={["V"]} modifiers={[]} />
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<ButtonGroupItem value="select" className="p-2">
										<BoxSelect className="w-4 h-4" />
									</ButtonGroupItem>
								</TooltipTrigger>
								<TooltipContent className="bg-transparent border-none shadow-none mb-2">
									<Keyboard keys={["S"]} modifiers={[]} />
								</TooltipContent>
							</Tooltip>
						</ButtonGroup>
					</Panel>
					<Panel position="bottom-right">
						<div className="flex flex-col items-center justify-center gap-2 mb-2 mr-2 bg-accent shadow-sm py-2 px-2 rounded-md">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => fitView(FIT_VIEW)}>
										<Focus className="w-6 h-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">Fit to screen</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => zoomIn({ duration: 300 })}>
										<Plus className="w-6 h-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">Zoom in</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => zoomOut({ duration: 300 })}>
										<Minus className="w-6 h-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">Zoom out</TooltipContent>
							</Tooltip>
						</div>
					</Panel>
					<Panel position="bottom-left">
						<div className="flex flex-col items-center justify-center gap-2 mb-2 mr-2 bg-accent shadow-sm py-2 px-2 rounded-md">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => undo()} disabled={!canUndo}>
										<Undo2 className="w-6 h-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">Undo</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button size="icon" onClick={() => redo()} disabled={!canRedo}>
										<Redo2 className="w-6 h-6" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="left">Redo</TooltipContent>
							</Tooltip>
						</div>
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
