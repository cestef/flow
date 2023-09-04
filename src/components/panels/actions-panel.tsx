import { NODES_TYPES, flowSelector } from "@/lib/constants";
import { useStore, useTemporalStore } from "@/lib/store";
import { cn, nodesEqual, orderNodes, trpc } from "@/lib/utils";
import ELK, { ElkNode, LayoutOptions } from "elkjs/lib/elk.bundled.js";
import {
	ClipboardCopy,
	ClipboardPaste,
	Download,
	FileJson2,
	Image,
	Maximize,
	MoveHorizontal,
	MoveVertical,
	Settings2,
} from "lucide-react";
import {
	Node,
	getRectOfNodes,
	getTransformForBounds,
	useOnSelectionChange,
	useReactFlow,
} from "reactflow";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import { toPng } from "html-to-image";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStore as useStoreFlow } from "reactflow";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import Keyboard from "../ui/keyboard";
import { useToast } from "../ui/use-toast";

function downloadImage(dataUrl: string) {
	const a = document.createElement("a");

	a.setAttribute("download", `flow-export-${new Date().toISOString()}.png`);
	a.setAttribute("href", dataUrl);
	a.click();
}

const imageWidth = 1024;
const imageHeight = 768;

const elk = new ELK();

const useLayoutedElements = ({
	onLayouted,
}: {
	onLayouted?: (nodes: Node[]) => void;
}) => {
	const { getNodes, getEdges, fitView } = useReactFlow();
	const defaultOptions: LayoutOptions = {
		"elk.algorithm": "layered",
		"elk.layered.spacing.nodeNodeBetweenLayers": "100",
	};

	const getLayoutedElements = useCallback((options: LayoutOptions) => {
		const layoutOptions: LayoutOptions = { ...defaultOptions, ...options };
		const nodes = getNodes();
		const groups = nodes.filter((node) => node.type === "customGroup");
		const groupNodes = nodes.filter((node) => node.type !== "customGroup");

		const rootNodes = groupNodes.filter((node) => !node.parentNode);
		// console.log("rootNodes", rootNodes);
		const rect = getRectOfNodes(rootNodes);
		// console.log("rect", rect);
		groups.push({
			id: "rootGroup",
			width: rect.width,
			height: rect.height,
			position: { x: rect.x, y: rect.y },
			data: {},
		});

		// console.log("groups", groups);
		// console.log("groupNodes", groupNodes);
		const graph: ElkNode = {
			id: "root",
			layoutOptions: layoutOptions,
			children: groups.map((group) => ({
				id: group.id,
				width: group.width || +(group.style?.width || 0),
				height: group.height || +(group.style?.height || 0),
				layoutOptions: layoutOptions,
				children: groupNodes
					.filter((node) => (node.parentNode || "rootGroup") === group.id)
					.map((node) => ({
						id: node.id,
						width: node.width || +(node.style?.width || 0),
						height: node.height || +(node.style?.height || 0),
						layoutOptions: layoutOptions,
					})),
			})),
			edges: getEdges().map((edge) => ({
				id: edge.id,
				sources: [edge.source],
				targets: [edge.target],
			})),
		};

		elk.layout(graph).then(({ children }) => {
			const nodes = children?.reduce((result, current) => {
				if (current.id !== "rootGroup") {
					result.push({
						id: current.id,
						position: { x: current.x, y: current.y },
						data: { label: current.id },
						style: { width: current.width, height: current.height },
					});
				}

				current.children?.forEach((child) =>
					result.push({
						id: child.id,
						position: { x: child.x, y: child.y },
						data: { label: child.id },
						style: { width: child.width, height: child.height },
						parentNode: current.id === "rootGroup" ? undefined : current.id,
					}),
				);

				return result;
			}, [] as any[]);
			// console.log("nodes", nodes);
			onLayouted?.(nodes as any[]);
			window.requestAnimationFrame(() => {
				setTimeout(() => {
					fitView();
				}, 100);
			});
		});
	}, []);

	return { getLayoutedElements };
};

export default function ActionsPanel() {
	const clipboard = useStore((state) => state.clipboard);
	const setClipboard = useStore((state) => state.setClipboard);
	const clearClipboard = useStore((state) => state.clearClipboard);
	const selected = useStore((state) => state.selected);
	const { setNodes, findAndUpdateNode } = useStore(flowSelector);
	const addSelectedNodes = useStoreFlow((state) => state.addSelectedNodes);
	const addSelectedEdges = useStoreFlow((state) => state.addSelectedEdges);
	const resetSelectedElements = useStoreFlow(
		(state) => state.resetSelectedElements,
	);
	const updateManyNodes = trpc.nodes.updateMany.useMutation();
	// const updateManyEdges = trpc.edges.updateMany.useMutation();
	const { theme } = useTheme();
	const { toast } = useToast();
	const { getLayoutedElements } = useLayoutedElements({
		onLayouted: (nodes) => {
			updateManyNodes.mutate({
				nodes: nodes.map((node) => ({
					id: node.id,
					x: node.position.x,
					y: node.position.y,
				})),
			});
		},
	});

	const copy = useCallback(() => {
		// console.log("copy", selected.nodes, selected.edges);
		if (selected.nodes.length === 0 && selected.edges.length === 0) return;
		setClipboard(selected.nodes, selected.edges);
	}, [selected]);

	const duplicateManyNodes = trpc.nodes.duplicateMany.useMutation({
		onSuccess: (data) => {
			clearClipboard();
			// Select the duplicated nodes
			resetSelectedElements();
			addSelectedNodes(data.map((node) => node.id));
		},
	});

	const paste = useCallback(() => {
		// console.log("paste", clipboard.nodes, clipboard.edges);
		if (clipboard.nodes.length === 0) return;
		const { nodes } = clipboard;

		duplicateManyNodes.mutate({
			ids: nodes.map((node) => node.id),
			offsetX: 2,
			offsetY: 2,
		});
	}, [clipboard]);

	const selectAll = useCallback((e: KeyboardEvent) => {
		e.preventDefault();
		const nodes = useStore.getState().nodes;
		const edges = useStore.getState().edges;
		addSelectedNodes(nodes.map((node) => node.id));
		addSelectedEdges(edges.map((edge) => edge.id));
	}, []);

	useHotkeys(["ctrl+a", "meta+a"], selectAll);
	useHotkeys(["ctrl+shift+a", "meta+shift+a"], (e) => {
		e.preventDefault();
		resetSelectedElements();
	});

	const download = useCallback(() => {
		const nodesBounds = getRectOfNodes(getNodes());
		const transform = getTransformForBounds(
			nodesBounds,
			imageWidth,
			imageHeight,
			0.5,
			2,
		);
		let realTheme = theme;
		if (theme === "system") {
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				realTheme = "dark";
			} else {
				realTheme = "light";
			}
		}

		toPng(document.querySelector(".react-flow__viewport") as HTMLElement, {
			backgroundColor: realTheme === "dark" ? "#020817" : "#fff",
			width: imageWidth,
			height: imageHeight,
			style: {
				width: `${imageWidth}px`,
				height: `${imageHeight}px`,
				transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
			},
		}).then(downloadImage);
	}, []);
	const canvasId = useStore((state) => state.currentCanvasId);
	const canvas = trpc.canvas.get.useQuery({
		id: canvasId,
	});
	const exportJson = useCallback(() => {
		const instance = useStore.getState().instance;
		if (!instance)
			return toast({
				title: "No instance found",
				duration: 2000,
				variant: "destructive",
			});
		if (!canvas.data)
			return toast({
				title: "No canvas found",
				duration: 2000,
				variant: "destructive",
			});
		const json = JSON.stringify({
			...instance.toObject(),
			canvas: canvas.data.name,
		});
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.setAttribute(
			"download",
			`flow-json-export-${new Date().toISOString()}.json`,
		);
		a.setAttribute("href", url);
		a.click();
	}, [canvas]);

	useHotkeys(["ctrl+c", "meta+c"], copy);
	useHotkeys(["ctrl+v", "meta+v"], paste);
	const setSelected = useStore((state) => state.setSelected);

	const deleteManyNodes = trpc.nodes.deleteMany.useMutation({
		onSuccess: () => {
			setSelected([], selected.edges);
		},
	});
	const deleteManyEdges = trpc.edges.deleteMany.useMutation({
		onSuccess: () => {
			setSelected(selected.nodes, []);
		},
	});
	useOnSelectionChange({
		onChange: ({ nodes: selectedNodes, edges: selectedEdges }) => {
			for (const node of selectedNodes) {
				if (node.type === NODES_TYPES.GROUP) {
					const nodes = useStore.getState().nodes;
					setNodes(orderNodes(nodes));
				}
			}
			// console.log("selection change", nodes, edges);

			setSelected(selectedNodes, selectedEdges);
		},
	});
	const settingsOpen = useStore((state) => state.settingsOpen);
	const setSettingsOpen = useStore((state) => state.setSettingsOpen);

	useHotkeys(["ctrl+s", "meta+s"], (e) => {
		e.preventDefault();
		setSettingsOpen(!settingsOpen);
	});
	useHotkeys(["ctrl+e", "meta+e"], (e) => {
		e.preventDefault();
		download();
	});
	useHotkeys(["ctrl+f", "meta+f"], (e) => {
		e.preventDefault();
		fitView();
	});
	const { undo, redo } = useTemporalStore((s) => s);
	useHotkeys(["ctrl+z", "meta+z"], (e) => {
		e.preventDefault();
		const oldNodes = useStore.getState().nodes;
		undo();
		const newNodes = useStore.getState().nodes;
		// const newEdges = useStore.getState().edges;
		if (nodesEqual(oldNodes, newNodes)) return;
		updateManyNodes.mutate({
			nodes: newNodes.map((node) => ({
				id: node.id,
				x: node.position.x,
				y: node.position.y,
				color: node.data.color || undefined,
				width: +(node.style?.width || 0) || +(node.width || 0) || undefined,
				height: +(node.style?.height || 0) || +(node.height || 0) || undefined,
				name: node.data.label,
				parentId: node.parentNode,
			})),
		});
	});
	useHotkeys(["ctrl+shift+z", "meta+shift+z"], (e) => {
		e.preventDefault();
		const oldNodes = useStore.getState().nodes;
		redo();
		const newNodes = useStore.getState().nodes;
		// const newEdges = useStore.getState().edges;
		if (nodesEqual(oldNodes, newNodes)) return;
		updateManyNodes.mutate({
			nodes: newNodes.map((node) => ({
				id: node.id,
				x: node.position.x,
				y: node.position.y,
				color: node.data.color || undefined,
				width: +(node.style?.width || 0) || +(node.width || 0) || undefined,
				height: +(node.style?.height || 0) || +(node.height || 0) || undefined,
				name: node.data.label,
				parentId: node.parentNode,
			})),
		});
	});

	const togglePresetsHidden = useStore((state) => state.toggleDragPanel);
	useHotkeys(["ctrl+p", "meta+p"], (e) => {
		e.preventDefault();
		togglePresetsHidden();
	});

	const { fitView, getNodes } = useReactFlow();
	const isMobile = useStore((state) => state.isMobile);

	return (
		<div className="flex flex-col space-y-2">
			<DropdownMenu open={settingsOpen} onOpenChange={setSettingsOpen}>
				<DropdownMenuTrigger>
					<Tooltip>
						<TooltipTrigger>
							<Button size="icon" onClick={() => setSettingsOpen(true)}>
								<Settings2 className="w-4 h-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right" className="ml-2">
							<>
								Settings <Keyboard keys={["S"]} modifiers={["⌘"]} />
							</>
						</TooltipContent>
					</Tooltip>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					side={isMobile ? "bottom" : "right"}
					className={cn({ "ml-2": !isMobile, "mt-2 min-w-0": isMobile })}
				>
					<div
						className={cn("flex p-2 items-center justify-center", {
							"flex-row space-x-2 w-full": !isMobile,
							"flex-col space-y-2 h-full": isMobile,
						})}
					>
						<ModeToggle />
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									onClick={copy}
									disabled={
										selected.nodes.length === 0 && selected.edges.length === 0
									}
								>
									<ClipboardCopy />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Copy selected <Keyboard keys={["C"]} modifiers={["⌘"]} />
								</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									onClick={paste}
									disabled={
										clipboard.nodes.length === 0 && clipboard.edges.length === 0
									}
								>
									<ClipboardPaste />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Paste selected <Keyboard keys={["V"]} modifiers={["⌘"]} />
								</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									onClick={() => {
										setSettingsOpen(false);
										getLayoutedElements({
											"elk.direction": "DOWN",
										});
									}}
								>
									<MoveVertical />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Auto layout vertical</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									onClick={() => {
										setSettingsOpen(false);
										getLayoutedElements({
											"elk.direction": "RIGHT",
										});
									}}
								>
									<MoveHorizontal />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Auto layout vertical</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									onClick={() => {
										fitView();
										setSettingsOpen(false);
									}}
								>
									<Maximize />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>
									Fit view <Keyboard keys={["F"]} modifiers={["⌘"]} />
								</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button size="icon" onClick={download}>
									<Image />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<>
									Export to image <Keyboard keys={["E"]} modifiers={["⌘"]} />
								</>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button size="icon" onClick={exportJson}>
									<FileJson2 />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Export to JSON</TooltipContent>
						</Tooltip>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
