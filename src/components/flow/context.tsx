import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DEEFAULT_NODE_DIMENSIONS, NODE_NAMES } from "@/lib/constants";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Bomb, BoxSelect, Workflow } from "lucide-react";
import { useCallback, useState } from "react";
import { useReactFlow, useStore as useStoreFlow } from "reactflow";

export default function FlowContext({ children }: { children: React.ReactNode }) {
	const [nodes, edges] = useStore((e) => [e.nodes, e.edges] as const);
	const triggerNodeChanges = useStoreFlow((e) => e.triggerNodeChanges);
	const { project } = useReactFlow();
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const onAddNode = useCallback(
		(type: string) => {
			triggerNodeChanges([
				{
					type: "add",
					item: {
						id: generateId(),
						type,
						position,
						data: {
							label: "New node",
							editing: "label",
						},
						...DEEFAULT_NODE_DIMENSIONS,
					},
				},
			]);
		},
		[triggerNodeChanges, position],
	);
	const onClear = useCallback(() => {
		triggerNodeChanges([
			...nodes.map((node) => ({ type: "remove", id: node.id })),
			...edges.map((edge) => ({ type: "remove", id: edge.id })),
		] as any);
	}, [triggerNodeChanges, nodes, edges]);
	return (
		<ContextMenu>
			<ContextMenuTrigger
				onContextMenu={(e) => {
					const position = { x: e.clientX, y: e.clientY };
					const projected = project(position);
					setPosition(projected);
				}}
			>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuLabel>Add</ContextMenuLabel>
				<ContextMenuItem onClick={() => onAddNode(NODE_NAMES.DEFAULT)}>
					<Workflow className="w-4 h-4 mr-2" />
					Node
				</ContextMenuItem>
				<ContextMenuItem onClick={() => onAddNode(NODE_NAMES.GROUP)}>
					<BoxSelect className="w-4 h-4 mr-2" />
					Group
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem className="text-destructive" onClick={onClear}>
					<Bomb className="w-4 h-4 mr-2" />
					Clear
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
