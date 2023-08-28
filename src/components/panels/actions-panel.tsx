import {
	BoxSelect,
	Brush,
	ClipboardCopy,
	ClipboardPaste,
	Download,
	Maximize,
	MoveHorizontal,
	MoveVertical,
	Pointer,
	Settings2,
	Trash2,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ELK, { ElkNode, LayoutOptions } from "elkjs/lib/elk.bundled.js";
import { NODES_TYPES, flowSelector } from "@/lib/constants";
import {
	Node,
	getConnectedEdges,
	getOutgoers,
	getRectOfNodes,
	getTransformForBounds,
	useOnSelectionChange,
	useReactFlow,
} from "reactflow";
import { ReactNode, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { nodesEqual, orderNodes, trpc } from "@/lib/utils";
import { useStore, useTemporalStore } from "@/lib/store";

import { Button } from "../ui/button";
import Keyboard from "../ui/keyboard";
import { ModeToggle } from "../mode-toggle";
import { toPng } from "html-to-image";
import { useHotkeys } from "react-hotkeys-hook";
import { useStore as useStoreFlow } from "reactflow";
import { useTheme } from "next-themes";
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
		console.log("rootNodes", rootNodes);
		const rect = getRectOfNodes(rootNodes);
		console.log("rect", rect);
		groups.push({
			id: "rootGroup",
			width: rect.width,
			height: rect.height,
			position: { x: rect.x, y: rect.y },
			data: {},
		});

		console.log("groups", groups);
		console.log("groupNodes", groupNodes);
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
			console.log("nodes", nodes);
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
		console.log("copy", selected.nodes, selected.edges);
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
		console.log("paste", clipboard.nodes, clipboard.edges);
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
	useHotkeys(["ctrl+b", "meta+b"], (e) => {
		e.preventDefault();
		setBrushesOpen(!brushesOpen);
	});
	useHotkeys(["ctrl+e", "meta+e"], (e) => {
		e.preventDefault();
		download();
	});
	useHotkeys(["ctrl+f", "meta+f"], (e) => {
		e.preventDefault();
		fitView();
	});
	useHotkeys(["p"], (e) => {
		e.preventDefault();
		setSelectedBrush("pointer");
	});
	useHotkeys(["s"], (e) => {
		e.preventDefault();
		setSelectedBrush("select");
	});
	useHotkeys(["d"], (e) => {
		e.preventDefault();
		toast({
			title: (
				<h1 className="text-red-500 font-bold text-2xl">Delete tool</h1>
			) as any,
			duration: 2000,
		});
		setSelectedBrush("delete");
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
	const { fitView, getNodes } = useReactFlow();
	const [brushesOpen, setBrushesOpen] = useStore((state) => [
		state.brushesOpen,
		state.setBrushesOpen,
	]);
	const [selectedBrush, setSelectedBrush] = useStore((state) => [
		state.selectedBrush,
		state.setSelectedBrush,
	]);
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
				<DropdownMenuContent side="right" className="ml-2">
					<div className="flex flex-row space-x-2 p-2 items-center justify-center w-full">
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
									<Download />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<>
									Export to image <Keyboard keys={["E"]} modifiers={["⌘"]} />
								</>
							</TooltipContent>
						</Tooltip>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu open={brushesOpen} onOpenChange={setBrushesOpen}>
				<DropdownMenuTrigger>
					<Tooltip>
						<TooltipTrigger>
							<Button
								size="icon"
								variant="outline"
								onClick={() => setBrushesOpen(true)}
							>
								{selectedBrush === "select" ? (
									<BoxSelect className="w-4 h-4" />
								) : selectedBrush === "pointer" ? (
									<Pointer className="w-4 h-4" />
								) : selectedBrush === "delete" ? (
									<Trash2 className="w-4 h-4 text-red-500 dark:text-red-700" />
								) : (
									<Brush className="w-4 h-4" />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right" className="ml-2">
							<>
								Brushes <Keyboard keys={["B"]} modifiers={["⌘"]} />
							</>
						</TooltipContent>
					</Tooltip>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="bottom" className="mt-2 min-w-0">
					<div className="flex flex-col space-y-2 p-2 items-center justify-center h-full">
						<Tooltip>
							<TooltipTrigger>
								<Button
									variant={selectedBrush === "select" ? "default" : "outline"}
									size="icon"
									onClick={() => {
										setSelectedBrush("select");
									}}
								>
									<BoxSelect className="w-6 h-6" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right" className="mb-4 ml-2">
								<p className="flex flex-row items-center gap-2">
									Selection <Keyboard keys={["S"]} modifiers={[]} />
								</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									variant={selectedBrush === "pointer" ? "default" : "outline"}
									onClick={() => {
										setSelectedBrush("pointer");
									}}
								>
									<Pointer className="w-5 h-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right" className="mb-4 ml-2">
								<p className="flex flex-row items-center gap-2">
									Pointer <Keyboard keys={["P"]} modifiers={[]} />
								</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger>
								<Button
									size="icon"
									variant={selectedBrush === "delete" ? "default" : "outline"}
									onClick={() => {
										setSelectedBrush("delete");
									}}
								>
									<Trash2 className="w-5 h-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="right" className="mb-4 ml-2">
								<p className="flex flex-row items-center gap-2">
									Delete tool <Keyboard keys={["D"]} modifiers={[]} />
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
