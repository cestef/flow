"use-client";
import { createBundle, createClient, y } from "@pluv/react";

// import your PluvIO instance from your backend codebase
import { type AppPluvIO } from "@/server/io";
import getConfig from "next/config";
import { InferIORoom } from "@pluv/io";
import { z } from "zod";
import { Edge, Node } from "reactflow";
import { shallowMerge } from "../utils";

export type Room = InferIORoom<AppPluvIO>;

const { publicRuntimeConfig } = getConfig();

const { PLUV_WS_URL, PLUV_AUTH_URL } = publicRuntimeConfig;

console.log("[PLUV_WS_URL]", PLUV_WS_URL);
console.log("[PLUV_AUTH_URL]", PLUV_AUTH_URL);

const client = createClient<AppPluvIO>({
	authEndpoint: (room) => ({
		url: `${PLUV_AUTH_URL}?room=${room}`,
		options: {
			credentials: "include",
		},
	}),
	wsEndpoint: (room) => `${PLUV_WS_URL}/room/${room}`,
	// debug: true,
});

export const {
	// factories
	createRoomBundle,

	// components
	PluvProvider,
	// hooks
	usePluvClient,
} = createBundle(client);

export const PresenceState = z.enum(["grab", "select", "default", "text", "color"]);

export const {
	// components
	PluvRoomProvider,

	// hooks
	usePluvBroadcast,
	usePluvConnection,
	usePluvEvent,
	usePluvMyPresence,
	usePluvMyself,
	usePluvOther,
	usePluvOthers,
	usePluvRoom,
	usePluvStorage,
} = createRoomBundle({
	presence: z.object({
		color: z.string().refine((value) => /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value)),
		x: z.number(),
		y: z.number(),
		state: PresenceState,
		rect: z
			.object({
				x: z.number(),
				y: z.number(),
			})
			.optional(),
		currentSelected: z.array(z.string()),
	}),
	initialStorage: () => ({
		nodes: y.map<Node>([]),
		edges: y.map<Edge>([]),
	}),
});

export const usePluvNode = (id: string) => {
	const [_, remoteNodes] = usePluvStorage("nodes");
	const node = remoteNodes?.get(id);
	const update = (node: Partial<Node>) => {
		const current = remoteNodes?.get(id);
		if (!current) return;
		remoteNodes?.set(id, shallowMerge(current, node));
	};

	return [node, update] as const;
};
