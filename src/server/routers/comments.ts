import { Comment, Node } from "@prisma/client";
import { protectedProcedure, router } from "../trpc";

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

export const commentsRouter = router({
	get: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.comment.findMany({
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
				text: z.string(),
				x: z.number().optional(),
				y: z.number().optional(),
				nodeId: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
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
				throw new Error("User is not allowed to add node");
			}

			let node: Node | null = null;

			if (input.nodeId) {
				node = await prisma.node.findUnique({
					where: {
						id: input.nodeId,
					},
				});

				if (!node) {
					throw new Error("Node not found");
				}

				if (node.canvasId !== input.canvasId) {
					throw new Error("Node does not belong to canvas");
				}
			} else if (!input.x || !input.y) {
				throw new Error("x and y are required if nodeId is not provided");
			}

			const comment = await prisma.comment.create({
				data: {
					canvasId: input.canvasId,
					text: input.text,
					x: (input.x || node?.x) as number,
					y: (input.y || node?.y) as number,
					nodeId: input.nodeId,
					userId: ctx.user.id,
				},
			});

			emitter(input.canvasId).emit("add", comment);

			return comment;
		}),
	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				text: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const comment = await prisma.comment.findUnique({
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

			if (!comment) {
				throw new Error("Comment not found");
			}

			if (
				comment.canvas.owner.id !== ctx.user.id &&
				!comment.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update comment");
			}

			return prisma.comment.update({
				where: {
					id: input.id,
				},
				data: {
					text: input.text,
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
			const comment = await prisma.comment.findUnique({
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

			if (!comment) {
				throw new Error("Comment not found");
			}

			if (
				comment.canvas.owner.id !== ctx.user.id &&
				!comment.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to delete comment");
			}

			await prisma.comment.delete({
				where: {
					id: input.id,
				},
			});

			emitter(comment.canvasId).emit("delete", comment);

			return true;
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

			return observable<Comment>((observer) => {
				const onAdd = (comment: Comment) => {
					observer.next(comment);
				};

				emitter(input.canvasId).on("add", onAdd);
				return () => {
					emitter(input.canvasId).off("add", onAdd);
				};
			});
		}),
	onUpdate: protectedProcedure
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

			return observable<Comment>((observer) => {
				const onUpdate = (comment: Comment) => {
					observer.next(comment);
				};

				emitter(input.canvasId).on("update", onUpdate);
				return () => {
					emitter(input.canvasId).off("update", onUpdate);
				};
			});
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

			return observable<Comment>((observer) => {
				const onDelete = (comment: Comment) => {
					observer.next(comment);
				};

				emitter(input.canvasId).on("delete", onDelete);
				return () => {
					emitter(input.canvasId).off("delete", onDelete);
				};
			});
		}),
});
