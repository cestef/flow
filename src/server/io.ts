import { createIO } from "@pluv/io";

import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const io = createIO({
	authorize: {
		required: true,
		secret: process.env.PLUV_SECRET!,
		user: z.object({
			id: z.string(),
			login: z.string(),
			name: z.string(),
			email: z.string(),
			image: z.string().optional(),
		}),
	},
	debug: true,
	platform: platformNode(),
	getInitialStorage: async ({ room, req }) => {
		console.log("[getInitialStorage] room", room);
		const canvas = await prisma.canvas.findUnique({
			where: {
				id: room,
			},
			include: {
				members: true,
			},
		});
		// console.log("[getInitialStorage] canvas", canvas);
		if (!canvas) {
			throw new Error("Canvas not found");
		}
		return canvas.state;
	},
	onRoomDeleted: async ({ encodedState, room }) => {
		console.log("[onRoomDeleted] room", room);
		await prisma.canvas.update({
			where: {
				id: room,
			},
			data: {
				state: encodedState,
			},
		});
	},
});

// Export the websocket client io type, instead of the client itself

export type AppPluvIO = typeof io;
