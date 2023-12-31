import { useCallback, useEffect } from "react";
import { usePluvMyPresence, usePluvStorage } from "../pluv/bundle";
import { useStore } from "../store";
import { Node } from "reactflow";

export const useNodes = () => {
	const [nodes, setNodes] = useStore((e) => [e.nodes, e.setNodes] as const);
	const [remoteNodes, nodesShared] = usePluvStorage("nodes");
	const [currentSelected] = usePluvMyPresence((e) => e.currentSelected);
	useEffect(() => {
		if (!nodesShared) return;
		const nodes = Object.values(remoteNodes ?? {});
		setNodes(
			nodes.map((e) => ({
				...e,
				selected: currentSelected.includes(e.id),
			})),
		);
	}, [remoteNodes, setNodes, nodesShared, currentSelected]);

	const addNode = useCallback(
		(node: Node) => {
			setNodes([...nodes, node]);
		},
		[setNodes, nodes],
	);

	return { nodes, remoteNodes, nodesShared, addNode };
};

export const useEdges = () => {
	const [edges, setEdges] = useStore((e) => [e.edges, e.setEdges] as const);
	const [remoteEdges, edgesShared] = usePluvStorage("edges");
	useEffect(() => {
		if (!edgesShared) return;
		const edges = Object.values(remoteEdges ?? {});
		setEdges(edges);
	}, [remoteEdges, setEdges, edgesShared]);

	return { edges, remoteEdges, edgesShared };
};
