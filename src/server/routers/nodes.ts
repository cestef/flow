import { protectedProcedure, router } from "@/server/trpc";

import EventEmitter from "events";
import { Node } from "@prisma/client";
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

export const nodesRouter = router({
	list: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.query(({ ctx, input }) => {
			return prisma.node.findMany({
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
				x: z.number(),
				y: z.number(),
				type: z.string(),
				name: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if user is allowed to add node
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

			const node = await prisma.node.create({
				data: {
					x: input.x,
					y: input.y,
					type: input.type,
					name: input.name,
					canvas: {
						connect: {
							id: input.canvasId,
						},
					},
				},
			});

			emitter(input.canvasId).emit("add", node);
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

			return observable<Node>((observer) => {
				const onAdd = (node: Node) => {
					observer.next(node);
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
				x: z.number().optional(),
				y: z.number().optional(),
				name: z.string().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findUnique({
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

			if (!node) {
				throw new Error("Node not found");
			}

			if (
				node.canvas.owner.id !== ctx.user.id &&
				!node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update node");
			}

			const res = prisma.node.update({
				where: {
					id: input.id,
				},
				data: {
					x: input.x,
					y: input.y,
					name: input.name,
				},
			});

			emitter(node.canvas.id).emit("update", res);
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

			return observable<Node>((observer) => {
				const onUpdate = (node: Node) => {
					observer.next(node);
				};

				emitter(input.canvasId).on("update", onUpdate);
				return () => {
					emitter(input.canvasId).off("update", onUpdate);
				};
			});
		}),

	delete: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findUnique({
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

			if (!node) {
				throw new Error("Node not found");
			}

			if (
				node.canvas.owner.id !== ctx.user.id &&
				!node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to delete node");
			}

			emitter(node.canvas.id).emit("delete", node);

			return prisma.node.delete({
				where: {
					id: input.id,
				},
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

			return observable<Node>((observer) => {
				const onDelete = (node: Node) => {
					observer.next(node);
				};

				emitter(input.canvasId).on("delete", onDelete);
				return () => {
					emitter(input.canvasId).off("delete", onDelete);
				};
			});
		}),

	dragStart: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findUnique({
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

			if (!node) {
				throw new Error("Node not found");
			}

			if (
				node.canvas.owner.id !== ctx.user.id &&
				!node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to drag node");
			}

			emitter(node.canvas.id).emit("dragStart", node);

			return node;
		}),
	onDragStart: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.subscription(({ ctx, input }) => {
			return observable<Node>((observer) => {
				const onDragStart = (node: Node) => {
					observer.next(node);
				};

				emitter(input.canvasId).on("dragStart", onDragStart);
				return () => {
					emitter(input.canvasId).off("dragStart", onDragStart);
				};
			});
		}),
	dragEnd: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				x: z.number(),
				y: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findUnique({
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

			if (!node) {
				throw new Error("Node not found");
			}

			if (
				node.canvas.owner.id !== ctx.user.id &&
				!node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to drag node");
			}

			const res = await prisma.node.update({
				where: {
					id: input.id,
				},
				data: {
					x: input.x,
					y: input.y,
				},
			});

			emitter(node.canvas.id).emit("dragEnd", {
				node: res,
				userId: ctx.user.id,
			});

			return res;
		}),
	onDragEnd: protectedProcedure
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

			return observable<{ node: Node; userId: string }>((observer) => {
				const onDragEnd = (event: {
					node: Node;
					userId: string;
				}) => {
					observer.next(event);
				};

				emitter(input.canvasId).on("dragEnd", onDragEnd);
				return () => {
					emitter(input.canvasId).off("dragEnd", onDragEnd);
				};
			});
		}),

	dragUpdate: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				x: z.number(),
				y: z.number(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findUnique({
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

			if (!node) {
				throw new Error("Node not found");
			}

			if (
				node.canvas.owner.id !== ctx.user.id &&
				!node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to drag node");
			}

			emitter(node.canvas.id).emit("dragUpdate", {
				node: {
					...node,
					x: input.x,
					y: input.y,
				},
				userId: ctx.user.id,
			});

			return node;
		}),

	onDragUpdate: protectedProcedure
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
				node: Node;
				userId: string;
			}>((observer) => {
				const onDragUpdate = (event: { node: Node; userId: string }) => {
					observer.next(event);
				};

				emitter(input.canvasId).on("dragUpdate", onDragUpdate);
				return () => {
					emitter(input.canvasId).off("dragUpdate", onDragUpdate);
				};
			});
		}),
});
