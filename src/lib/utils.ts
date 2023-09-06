import type { AppRouter } from "@/server/routers/_app";
import {
	Edge as PrismaEdge,
	Node as PrismaNode,
	NodeHandle,
} from "@prisma/client";
import { createTRPCProxyClient } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { createWSClient, wsLink } from "@trpc/client/links/wsLink";
import { createTRPCNext } from "@trpc/next";
import type { inferProcedureOutput } from "@trpc/server";
import { type ClassValue, clsx } from "clsx";
import { NextPageContext } from "next";
import getConfig from "next/config";
import { Edge, Node, NodePositionChange, XYPosition } from "reactflow";
import superjson from "superjson";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const { publicRuntimeConfig } = getConfig();

const { APP_URL, WS_URL } = publicRuntimeConfig;

function getEndingLink(ctx: NextPageContext | undefined) {
	if (typeof window === "undefined") {
		return httpBatchLink({
			url: `${APP_URL}/api/trpc`,
			headers() {
				if (!ctx?.req?.headers) {
					return {};
				}
				// on ssr, forward client's headers to the server
				return {
					...ctx.req.headers,
					"x-ssr": "1",
				};
			},
		});
	}
	// console.log(WS_URL);
	const client = createWSClient({
		url: WS_URL,
	});
	return wsLink<AppRouter>({
		client,
	});
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<AppRouter>({
	config({ ctx }) {
		/**
		 * If you want to use SSR, you need to use the server's full URL
		 * @link https://trpc.io/docs/ssr
		 */

		return {
			/**
			 * @link https://trpc.io/docs/client/links
			 */
			links: [
				// adds pretty logs to your console in development and logs errors in production
				loggerLink({
					enabled: (opts) =>
						(process.env.NODE_ENV === "development" &&
							typeof window !== "undefined") ||
						(opts.direction === "down" && opts.result instanceof Error),
				}),
				getEndingLink(ctx),
			],
			/**
			 * @link https://trpc.io/docs/data-transformers
			 */
			transformer: superjson,
			/**
			 * @link https://tanstack.com/query/v4/docs/react/reference/QueryClient
			 */
			queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
		};
	},
	/**
	 * @link https://trpc.io/docs/ssr
	 */
	ssr: true,
});

export const trcpProxyClient = createTRPCProxyClient<AppRouter>({
	links: [getEndingLink(undefined)],
	transformer: superjson,
});

// export const transformer = superjson;
/**
 * This is a helper method to infer the output of a query resolver
 * @example type HelloOutput = inferQueryOutput<'hello'>
 */
export type inferQueryOutput<
	TRouteKey extends keyof AppRouter["_def"]["queries"],
> = inferProcedureOutput<AppRouter["_def"]["queries"][TRouteKey]>;

type GetHelperLinesResult = {
	horizontal?: number;
	vertical?: number;
	snapPosition: Partial<XYPosition>;
};

// this utility function can be called with a position change (inside onNodesChange)
// it checks all other nodes and calculated the helper line positions and the position where the current node should snap to
export function getHelperLines(
	change: NodePositionChange,
	nodes: Node[],
	distance = 5,
): GetHelperLinesResult {
	const defaultResult = {
		horizontal: undefined,
		vertical: undefined,
		snapPosition: { x: undefined, y: undefined },
	};
	const nodeA = nodes.find((node) => node.id === change.id);

	if (!nodeA || !change.position) {
		return defaultResult;
	}

	const nodeABounds = {
		left: change.position.x,
		right: change.position.x + (nodeA.width ?? 0),
		top: change.position.y,
		bottom: change.position.y + (nodeA.height ?? 0),
		width: nodeA.width ?? 0,
		height: nodeA.height ?? 0,
	};

	let horizontalDistance = distance;
	let verticalDistance = distance;

	return nodes
		.filter((node) => node.id !== nodeA.id)
		.filter((node) => node.parentNode === nodeA.parentNode)
		.reduce<GetHelperLinesResult>((result, nodeB) => {
			const parentNodeB = nodes.find((node) => node.id === nodeB.parentNode);

			const nodeBBounds = {
				left: nodeB.position.x + (parentNodeB?.position.x ?? 0),
				right: nodeB.position.x + (nodeB.width ?? 0),
				top: nodeB.position.y + (parentNodeB?.position.y ?? 0),
				bottom: nodeB.position.y + (nodeB.height ?? 0),
				width: nodeB.width ?? 0,
				height: nodeB.height ?? 0,
			};

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//  |
			//  |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left);

			if (distanceLeftLeft < verticalDistance) {
				result.snapPosition.x = nodeBBounds.left;
				result.vertical = nodeBBounds.left;
				verticalDistance = distanceLeftLeft;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//              |
			//              |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceRightRight = Math.abs(
				nodeABounds.right - nodeBBounds.right,
			);

			if (distanceRightRight < verticalDistance) {
				result.snapPosition.x = nodeBBounds.right - nodeABounds.width;
				result.vertical = nodeBBounds.right;
				verticalDistance = distanceRightRight;
			}

			//              |‾‾‾‾‾‾‾‾‾‾‾|
			//              |     A     |
			//              |___________|
			//              |
			//              |
			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     B     |
			//  |___________|
			const distanceLeftRight = Math.abs(nodeABounds.left - nodeBBounds.right);

			if (distanceLeftRight < verticalDistance) {
				result.snapPosition.x = nodeBBounds.right;
				result.vertical = nodeBBounds.right;
				verticalDistance = distanceLeftRight;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|
			//              |
			//              |
			//              |‾‾‾‾‾‾‾‾‾‾‾|
			//              |     B     |
			//              |___________|
			const distanceRightLeft = Math.abs(nodeABounds.right - nodeBBounds.left);

			if (distanceRightLeft < verticalDistance) {
				result.snapPosition.x = nodeBBounds.left - nodeABounds.width;
				result.vertical = nodeBBounds.left;
				verticalDistance = distanceRightLeft;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |     |     B     |
			//  |___________|     |___________|
			const distanceTopTop = Math.abs(nodeABounds.top - nodeBBounds.top);

			if (distanceTopTop < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.top;
				result.horizontal = nodeBBounds.top;
				horizontalDistance = distanceTopTop;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |
			//  |___________|_________________
			//                    |           |
			//                    |     B     |
			//                    |___________|
			const distanceBottomTop = Math.abs(nodeABounds.bottom - nodeBBounds.top);

			if (distanceBottomTop < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.top - nodeABounds.height;
				result.horizontal = nodeBBounds.top;
				horizontalDistance = distanceBottomTop;
			}

			//  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
			//  |     A     |     |     B     |
			//  |___________|_____|___________|
			const distanceBottomBottom = Math.abs(
				nodeABounds.bottom - nodeBBounds.bottom,
			);

			if (distanceBottomBottom < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height;
				result.horizontal = nodeBBounds.bottom;
				horizontalDistance = distanceBottomBottom;
			}

			//                    |‾‾‾‾‾‾‾‾‾‾‾|
			//                    |     B     |
			//                    |           |
			//  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
			//  |     A     |
			//  |___________|
			const distanceTopBottom = Math.abs(nodeABounds.top - nodeBBounds.bottom);

			if (distanceTopBottom < horizontalDistance) {
				result.snapPosition.y = nodeBBounds.bottom;
				result.horizontal = nodeBBounds.bottom;
				horizontalDistance = distanceTopBottom;
			}

			return result;
		}, defaultResult);
}

export const shallowMerge = <T extends Record<string, unknown>>(
	a: T,
	b: Partial<T>,
): T => {
	return Object.entries(b).reduce((acc, [key, value]) => {
		if (typeof value === "object" && value !== null) {
			return {
				...acc,
				[key]: {
					...(acc[key] ?? {}),
					...value,
				},
			};
		}

		return {
			...acc,
			[key]: value,
		};
	}, a);
};

export const shallowDiff = <T extends Record<string, unknown>>(
	a: T,
	b: Partial<T>,
): Partial<T> => {
	return Object.entries(b).reduce((acc, [key, value]) => {
		if (typeof value === "object" && value !== null) {
			return {
				...acc,
				[key]: {
					...(acc[key] ?? {}),
					...value,
				},
			};
		}

		return {
			...acc,
			[key]: value,
		};
	}, a);
};

export const nodesEqual = (a: Node[], b: Node[]) => {
	const diffs = a.map((node) => {
		const currentNode = b.find((n) => n.id === node.id);
		if (!currentNode) return false;
		const diff = {
			name:
				node.data?.label !== currentNode.data?.label
					? currentNode.data?.label
					: undefined,
			color:
				node.data?.color !== currentNode.data?.color
					? currentNode.data?.color
					: undefined,
			x:
				node.position.x !== currentNode.position.x
					? currentNode.position.x
					: undefined,
			y:
				node.position.y !== currentNode.position.y
					? currentNode.position.y
					: undefined,
			width:
				+(node.style?.width || 0) !== +(currentNode.style?.width || 0)
					? +(currentNode.style?.width || 0)
					: undefined,
			height:
				+(node.style?.height || 0) !== +(currentNode.style?.height || 0)
					? +(currentNode.style?.height || 0)
					: undefined,
			parentId:
				node.parentNode !== currentNode.parentNode
					? currentNode.parentNode
					: undefined,
		};
		return diff;
	});
	const hasChanges = diffs.map((diff) =>
		Object.values(diff).some((v) => v !== undefined),
	);
	return !hasChanges.some((v) => v);
};

export const isNodeInGroupBounds = (node: Node, nodes: Node[]): Node | null => {
	if (node.parentNode) return null;
	// if (node.type === "customGroup") return null;
	return (
		nodes
			.filter((e) => e.type === "customGroup")
			.find((group) => {
				const nodePos = node.position;
				const groupPos = group.position;
				const groupWidth = group.style?.width || group.width || 0;
				const groupHeight = group.style?.height || group.height || 0;
				const nodeWidth = node.style?.width || node.width || 0;
				const nodeHeight = node.style?.height || node.height || 0;

				return (
					nodePos.x > groupPos.x &&
					nodePos.x + +nodeWidth < groupPos.x + +groupWidth &&
					nodePos.y > groupPos.y &&
					nodePos.y + +nodeHeight < groupPos.y + +groupHeight
				);
			}) || null
	);
};

export const formatRemoteNodes = (
	data: (PrismaNode & { handles?: NodeHandle[] })[],
	order = false,
): Node[] => {
	const formatted = data
		// .filter((e) => !e.preset)
		.map((node) => ({
			id: node.id,
			type: node.type,
			data: {
				label: node.name,
				color: node.color,
				debouncedPosition: {
					x: node.x,
					y: node.y,
				},
				draggedBy: undefined,
				fontColor: node.fontColor,
				fontSize: node.fontSize,
				fontSizeAuto: node.fontSizeAuto,
				fontWeight: node.fontWeight,
				fontFamily: node.fontFamily,
				borderRadius: node.borderRadius,
				borderColor: node.borderColor,
				borderWidth: node.borderWidth,
				borderStyle: node.borderStyle,
				verticalAlign: node.verticalAlign,
				horizontalAlign: node.horizontalAlign,
				handles: node.handles || [],
				preset: node.preset,
			},
			position: { x: node.x, y: node.y },
			...((node.width || node.height) && {
				style: {
					width: node.width!,
					height: node.height!,
				},
			}),
			parentNode: node.parentId || undefined,
			extent: node.parentId ? "parent" : undefined,
		})) as Node[];

	// children nodes need to be added before parent nodes
	if (order) {
		return orderNodes(formatted);
	}

	return formatted;
};

export const formatRemoteEdges = (data: PrismaEdge[]): Edge[] => {
	return data.map((edge) => ({
		id: edge.id,
		source: edge.fromId,
		target: edge.toId,
		type: edge.type,
		animated: edge.animated,
		sourceHandle: edge.fromHandleId,
		targetHandle: edge.toHandleId,
		data: {
			color: edge.color,
			linkColor: edge.linkColor,
		},
	}));
};

export const formatLocalNodes = (data: Node[]) => {
	return data.map((node) => ({
		id: node.id,
		type: node.type!,
		name: node.data?.label || "",
		color: node.data?.color || "",
		x: node.position.x,
		y: node.position.y,
		width: +(node.style?.width || 0),
		height: +(node.style?.height || 0),
		parentId: node.parentNode,
		fontColor: node.data?.fontColor,
		fontSize: node.data?.fontSize,
		fontWeight: node.data?.fontWeight,
		fontFamily: node.data?.fontFamily,
		borderRadius: node.data?.borderRadius,
		borderColor: node.data?.borderColor,
		borderWidth: node.data?.borderWidth,
		borderStyle: node.data?.borderStyle,
		verticalAlign: node.data?.verticalAlign,
		horizontalAlign: node.data?.horizontalAlign,
		preset: node.data?.preset,
		handles: node.data?.handles,
	}));
};

export const formatLocalEdges = (data: Edge[]) => {
	return data.map((edge) => ({
		id: edge.id,
		type: edge.type!,
		animated: edge.animated || false,
		from: edge.source,
		to: edge.target,
		fromHandle: edge.sourceHandle ?? undefined,
		toHandle: edge.targetHandle ?? undefined,
	}));
};

export const orderNodes = (nodes: Node[]) => {
	interface TreeNode {
		node: Node;
		children: TreeNode[];
	}
	const traverse = (node: Node): TreeNode => {
		const children = nodes.filter((n) => n.parentNode === node.id);
		return {
			node,
			children: children.map(traverse),
		};
	};
	const trees = nodes.filter((n) => !n.parentNode).map(traverse);

	const flatten = (tree: TreeNode): Node[] => {
		return [tree.node, ...tree.children.flatMap(flatten)];
	};

	return trees.flatMap(flatten);
};

export const sanitizeColor = (color: string) => {
	// Prevents from inputing images
	if (color.includes("url")) {
		return "";
	}
	return color;
};
