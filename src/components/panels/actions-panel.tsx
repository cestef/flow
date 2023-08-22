import ELK, {
	ElkExtendedEdge,
	ElkNode,
	LayoutOptions,
} from "elkjs/lib/elk.bundled.js";
import {
	ClipboardCopy,
	ClipboardPaste,
	Maximize,
	MoveHorizontal,
	MoveVertical,
	Settings2,
} from "lucide-react";
import { Node, useOnSelectionChange, useReactFlow } from "reactflow";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

import { useStore } from "@/lib/store";
import { trpc } from "@/lib/utils";
import { useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStore as useStoreFlow } from "reactflow";
import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import Keyboard from "../ui/keyboard";

const elk = new ELK();

const useLayoutedElements = ({
	onLayouted,
}: {
	onLayouted?: (nodes: Node[]) => void;
}) => {
	const { getNodes, setNodes, getEdges, fitView } = useReactFlow();
	const defaultOptions: LayoutOptions = {
		"elk.algorithm": "layered",
		"elk.layered.spacing.nodeNodeBetweenLayers": "100",
		"elk.spacing.nodeNode": "80",
	};

	const getLayoutedElements = useCallback((options: LayoutOptions) => {
		const layoutOptions: LayoutOptions = { ...defaultOptions, ...options };
		const graph: ElkNode = {
			id: "root",
			layoutOptions: layoutOptions,
			children: getNodes() as ElkNode[],
			edges: getEdges().map((edge) => {
				const { source, target, ...rest } = edge;
				return {
					...rest,
					id: edge.id,
					sources: [source],
					targets: [target],
				} as ElkExtendedEdge;
			}),
		};

		elk.layout(graph).then(({ children }) => {
			// By mutating the children in-place we saves ourselves from creating a
			// needless copy of the nodes array.
			children?.forEach((node) => {
				node.x = node.x;
				node.y = node.y;
			});

			setNodes(
				(children || []).map(
					(node) =>
						({
							...node,
							position: {
								x: node.x,
								y: node.y,
							},
						}) as Node,
				),
			);
			onLayouted?.(
				(children || []).map(
					(node) =>
						({
							...node,
							position: {
								x: node.x,
								y: node.y,
							},
						}) as Node,
				),
			);
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
	const addSelectedNodes = useStoreFlow((state) => state.addSelectedNodes);
	const resetSelectedElements = useStoreFlow(
		(state) => state.resetSelectedElements,
	);
	const updateManyNodes = trpc.nodes.updateMany.useMutation();
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
		if (clipboard.nodes.length === 0 && clipboard.edges.length === 0) return;
		const { nodes, edges } = clipboard;
		duplicateManyNodes.mutate({
			ids: nodes.map((node) => node.id),
			offsetX: 2,
			offsetY: 2,
		});
	}, [clipboard]);

	useHotkeys(["ctrl+c", "meta+c"], copy);
	useHotkeys(["ctrl+v", "meta+v"], paste);
	const setSelected = useStore((state) => state.setSelected);
	useOnSelectionChange({
		onChange: ({ nodes, edges }) => {
			// console.log("selection change", nodes, edges);
			setSelected(nodes, edges);
		},
	});
	const settingsOpen = useStore((state) => state.settingsOpen);
	const setSettingsOpen = useStore((state) => state.setSettingsOpen);
	useHotkeys(["ctrl+s", "meta+s"], (e) => {
		e.preventDefault();
		setSettingsOpen(!settingsOpen);
	});
	const { fitView } = useReactFlow();
	return (
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
							<p>Fit view</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
