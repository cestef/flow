import { protectedProcedure, router } from "../trpc";

import { Canvas } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { prisma } from "../../lib/prisma";
import { z } from "zod";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const canvasRouter = router({
	onAdd: protectedProcedure.subscription(async ({ ctx }) => {
		const memberCanvases = await prisma.canvas.findMany({
			where: {
				members: {
					some: {
						id: ctx.user.id,
					},
				},
			},
		});
		const ownerIds = memberCanvases.map((c) => c.ownerId);
		return observable<Canvas>((emit) => {
			const onAdd = (canvas: Canvas) => {
				emit.next(canvas);
			};
			emitter(ctx.user.id).on("add", onAdd);
			for (const ownerId of ownerIds) emitter(ownerId).on("add", onAdd);

			return () => {
				emitter(ctx.user.id).off("add", onAdd);
				for (const ownerId of ownerIds) emitter(ownerId).off("add", onAdd);
			};
		});
	}),
	add: protectedProcedure
		.input(
			z.object({
				name: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const canvas = await prisma.canvas.create({
				data: {
					name: input.name,
					owner: {
						connect: {
							id: ctx.user.id,
						},
					},
				},
			});

			emitter(ctx.user.id).emit("add", canvas);
		}),

	get: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.id,
							owner: {
								id: ctx.user.id,
							},
						},
						{
							id: input.id,
							members: {
								some: {
									id: ctx.user.id,
								},
							},
						},
					],
				},
				select: {
					id: true,
					name: true,
					nodes: true,
					edges: true,
					members: {
						select: {
							id: true,
							name: true,
							image: true,
						},
					},
					owner: true,
				},
			});
		}),

	find: protectedProcedure
		.input(
			z.object({
				name: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.canvas.findFirst({
				where: {
					OR: [
						{
							name: input.name,
							owner: {
								id: ctx.user.id,
							},
						},
						{
							name: input.name,
							members: {
								some: {
									id: ctx.user.id,
								},
							},
						},
					],
				},
			});
		}),

	list: protectedProcedure.input(z.object({})).query(({ ctx, input }) => {
		return prisma.canvas.findMany({
			where: {
				OR: [
					{
						owner: {
							id: ctx.user.id,
						},
					},
					{
						members: {
							some: {
								id: ctx.user.id,
							},
						},
					},
				],
			},
		});
	}),
	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await prisma.canvas.deleteMany({
				where: {
					id: input.id,
					owner: {
						id: ctx.user.id,
					},
				},
			});
		}),

	clear: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Get the canvas
			const canvas = await prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.id,
							owner: {
								id: ctx.user.id,
							},
						},
						{
							id: input.id,
							members: {
								some: {
									id: ctx.user.id,
								},
							},
						},
					],
				},
				include: {
					owner: true,
				},
			});
			// Check if the canvas is owned by the user
			if (!canvas) {
				throw new Error("Canvas not found");
			}

			await prisma.node.deleteMany({
				where: {
					canvasId: input.id,
				},
			});

			await prisma.edge.deleteMany({
				where: {
					canvasId: input.id,
				},
			});

			emitter(ctx.user.id).emit("clear", input.id);
		}),
	onClear: protectedProcedure.subscription(async ({ ctx }) => {
		const memberCanvases = await prisma.canvas.findMany({
			where: {
				members: {
					some: {
						id: ctx.user.id,
					},
				},
			},
		});
		const ownerIds = memberCanvases.map((c) => c.ownerId);
		return observable<string>((emit) => {
			const onClear = (canvasId: string) => {
				emit.next(canvasId);
			};
			emitter(ctx.user.id).on("clear", onClear);
			for (const ownerId of ownerIds) emitter(ownerId).on("clear", onClear);
			return () => {
				emitter(ctx.user.id).off("clear", onClear);
				for (const ownerId of ownerIds) emitter(ownerId).off("clear", onClear);
			};
		});
	}),
});
