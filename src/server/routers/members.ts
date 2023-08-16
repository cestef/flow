import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { prisma } from "@/lib/prisma";
import { observable } from "@trpc/server/observable";
import { z } from "zod";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const membersRouter = router({
	add: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const canvas = await prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.canvasId,
							ownerId: ctx.user.id,
						},
						{
							id: input.canvasId,
							members: {
								some: {
									id: ctx.user.id,
								},
							},
						},
					],
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			await prisma.canvas.update({
				where: {
					id: input.canvasId,
				},
				data: {
					members: {
						connect: {
							id: input.id,
						},
					},
				},
			});

			emitter(canvas.id).emit("addMember", input.id);
		}),
	delete: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				userId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const canvas = await prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.canvasId,
							ownerId: ctx.user.id,
						},
						{
							id: input.canvasId,
							members: {
								some: {
									id: ctx.user.id,
								},
							},
						},
					],
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			await prisma.canvas.update({
				where: {
					id: input.canvasId,
				},
				data: {
					members: {
						disconnect: {
							id: input.userId,
						},
					},
				},
			});

			emitter(canvas.id).emit("removeMember", input.userId);
		}),
	onAddMember: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.subscription(async ({ ctx, input }) => {
			// Check if the user is allowed to subscribe to this canvas
			const canvas = await prisma.canvas.findUnique({
				where: {
					id: input.canvasId,
				},
				include: {
					owner: true,
					members: true,
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to subscribe to this canvas");
			}

			return observable<Node>((observer) => {
				const onAddMember = (node: Node) => {
					observer.next(node);
				};

				emitter(input.canvasId).on("addMember", onAddMember);
				return () => {
					emitter(input.canvasId).off("addMember", onAddMember);
				};
			});
		}),
	onRemoveMember: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.subscription(async ({ ctx, input }) => {
			// Check if the user is allowed to subscribe to this canvas
			const canvas = await prisma.canvas.findUnique({
				where: {
					id: input.canvasId,
				},
				include: {
					owner: true,
					members: true,
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to subscribe to this canvas");
			}

			return observable<Node>((observer) => {
				const onRemoveMember = (node: Node) => {
					observer.next(node);
				};

				emitter(input.canvasId).on("removeMember", onRemoveMember);
				return () => {
					emitter(input.canvasId).off("removeMember", onRemoveMember);
				};
			});
		}),
});
