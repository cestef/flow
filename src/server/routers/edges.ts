import { protectedProcedure, router } from "@/server/trpc";

import { Edge } from "@prisma/client";
import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { prisma } from "@/lib//prisma";
import { z } from "zod";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const edgesRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.edge.findMany({
				where: {
					canvasId: input.canvasId,
					OR: [
						{
							canvas: {
								owner: {
									id: ctx.user.id,
								},
							},
						},
						{
							canvas: {
								members: {
									some: {
										id: ctx.user.id,
									},
								},
							},
						},
					],
				},
			});
		}),

	add: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				id: z.string(),
				from: z.string(),
				to: z.string(),
				type: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user is allowed to add edge
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
				throw new Error("User is not allowed to add edge");
			}

			const res = await prisma.edge.create({
				data: {
					from: {
						connect: {
							id: input.from,
						},
					},
					to: {
						connect: {
							id: input.to,
						},
					},
					canvas: {
						connect: {
							id: input.canvasId,
						},
					},
					id: input.id,
					type: input.type,
				},
			});

			emitter(input.canvasId).emit("add", {
				edge: res,
				userId: ctx.user.id,
			});

			return res;
		}),

	onAdd: protectedProcedure
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

			return observable<{
				edge: Edge;
				userId: string;
			}>((observer) => {
				const onAdd = (event: {
					edge: Edge;
					userId: string;
				}) => {
					observer.next(event);
				};

				emitter(input.canvasId).on("add", onAdd);
				return () => {
					emitter(input.canvasId).off("add", onAdd);
				};
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				from: z.string().optional(),
				to: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const edge = await prisma.edge.findUnique({
				where: {
					id: input.id,
				},
				include: {
					canvas: {
						include: {
							owner: true,
							members: true,
						},
					},
				},
			});

			if (!edge) {
				throw new Error("Edge not found");
			}

			if (
				edge.canvas.owner.id !== ctx.user.id &&
				!edge.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update edge");
			}

			return prisma.edge.update({
				where: {
					id: input.id,
				},
				data: {
					from: {
						connect: {
							id: input.from,
						},
					},
					to: {
						connect: {
							id: input.to,
						},
					},
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
			const edge = await prisma.edge.findUnique({
				where: {
					id: input.id,
				},
				include: {
					canvas: {
						include: {
							owner: true,
							members: true,
						},
					},
				},
			});

			if (!edge) {
				throw new Error("Edge not found");
			}

			if (
				edge.canvas.owner.id !== ctx.user.id &&
				!edge.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to delete edge");
			}

			const res = await prisma.edge.delete({
				where: {
					id: input.id,
				},
			});

			emitter(edge.canvas.id).emit("delete", {
				edge: res,
				userId: ctx.user.id,
			});

			return res;
		}),

	onDelete: protectedProcedure
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

			return observable<{
				edge: Edge;
				userId: string;
			}>((observer) => {
				const onDelete = (event: {
					edge: Edge;
					userId: string;
				}) => {
					observer.next(event);
				};

				emitter(input.canvasId).on("delete", onDelete);
				return () => {
					emitter(input.canvasId).off("delete", onDelete);
				};
			});
		}),
});
