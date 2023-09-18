import { useEffect } from "react";
import { usePluvStorage } from "../pluv/bundle";
import { useStore } from "../store";

export const useNodes = () => {
	const [nodes, setNodes] = useStore((e) => [e.nodes, e.setNodes] as const);
	const [remoteNodes, nodesShared] = usePluvStorage("nodes");
	useEffect(() => {
		if (!nodesShared) return;
		const nodes = Object.values(remoteNodes ?? {});
		setNodes(nodes);
	}, [remoteNodes, setNodes, nodesShared]);

	return { nodes, remoteNodes, nodesShared };
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
