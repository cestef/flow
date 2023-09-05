import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const usersRouter = router({
	get: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const user = await prisma.user.findUnique({
				where: {
					id: input.id,
				},
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
				},
			});

			if (!user) {
				throw new Error("User not found");
			}

			return user;
		}),
	find: protectedProcedure
		.input(
			z.object({
				emailOrName: z.string().nullish(),
				id: z.string().nullish(),
			}),
		)
		.query(async ({ ctx, input }) => {
			if (!input.emailOrName && !input.id) {
				throw new Error("Must provide emailOrName or id");
			}
			const users = await prisma.user.findMany({
				where: {
					OR: [
						{ email: input.emailOrName },
						{ name: { search: input.emailOrName ?? undefined } },
						{ login: input.emailOrName ?? undefined },
						{ id: input.id ?? undefined },
					],
				},
				select: {
					id: true,
					email: true,
					name: true,
					image: true,
					login: true,
				},
			});

			if (!users) {
				throw new Error("Users not found");
			}

			return users.filter((user) => user.id !== ctx.user?.id);
		}),

	me: protectedProcedure.query(async ({ ctx }) => {
		const user = await prisma.user.findUnique({
			where: {
				id: ctx.user?.id,
			},
			include: {
				canvases: true,
				comments: true,
				invitedTo: true,
				invites: true,
				settings: true,
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		return user;
	}),
});
