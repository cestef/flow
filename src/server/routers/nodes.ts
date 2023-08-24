import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { Node } from "@prisma/client";
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
				parentId: z.string().optional(),
				height: z.number().optional(),
				width: z.number().optional(),
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
					height: input.height,
					width: input.width,
					canvas: {
						connect: {
							id: input.canvasId,
						},
					},
					parent: {
						...(input.parentId === undefined
							? {}
							: { connect: { id: input.parentId } }),
					},
				},
			});

			emitter(input.canvasId).emit("add", node);

			return node;
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
				width: z.number().optional(),
				height: z.number().optional(),
				name: z.string().optional(),
				parentId: z.string().optional().nullable(),
				color: z.string().optional(),
				fontColor: z.string().optional(),
				fontSize: z.number().optional(),
				fontWeight: z.string().optional(),
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

			const res = await prisma.node.update({
				where: {
					id: input.id,
				},
				data: {
					x: input.x,
					y: input.y,
					width: input.width,
					height: input.height,
					name: input.name,
					parent: {
						...(input.parentId === null
							? { disconnect: true }
							: input.parentId === undefined
							? {}
							: { connect: { id: input.parentId } }),
					},
					color: input.color,
					fontColor: input.fontColor,
					fontSize: input.fontSize,
					fontWeight: input.fontWeight,
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
					if (event.userId === ctx.user.id) {
						return;
					}
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
				changes: z.array(
					z.object({
						id: z.string(),
						x: z.number(),
						y: z.number(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const nodes = await prisma.node.findMany({
				where: {
					id: {
						in: input.changes.map((change) => change.id),
					},
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

			if (!nodes) {
				throw new Error("Nodes not found");
			}

			if (nodes.length === 0) {
				return [];
			}

			const canvas = nodes[0].canvas;

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update nodes in this canvas");
			}

			const updateNodes = input.changes.map((change) =>
				prisma.node.update({
					where: {
						id: change.id,
					},
					data: {
						x: change.x,
						y: change.y,
					},
				}),
			);

			const res = await prisma.$transaction(updateNodes);

			res.forEach((node) => {
				emitter(node.canvasId).emit("dragUpdate", {
					node,
					userId: ctx.user.id,
				});
			});

			return res;
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
					if (event.userId === ctx.user.id) {
						return;
					}
					observer.next(event);
				};

				emitter(input.canvasId).on("dragUpdate", onDragUpdate);
				return () => {
					emitter(input.canvasId).off("dragUpdate", onDragUpdate);
				};
			});
		}),
	duplicate: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				offsetX: z.number().optional(),
				offsetY: z.number().optional(),
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
				throw new Error("User is not allowed to duplicate node");
			}

			const res = await prisma.node.create({
				data: {
					x: node.x + (input.offsetX ?? 0),
					y: node.y + (input.offsetY ?? 0),
					type: node.type,
					name: node.name,
					canvas: {
						connect: {
							id: node.canvas.id,
						},
					},
					parent: {
						connect: {
							id: node.parentId ?? undefined,
						},
					},
				},
			});

			emitter(node.canvas.id).emit("add", res);

			return res;
		}),
	duplicateMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
				offsetX: z.number().optional(),
				offsetY: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const nodes = await prisma.node.findMany({
				where: {
					id: {
						in: input.ids,
					},
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

			if (!nodes) {
				throw new Error("Nodes not found");
			}

			const canvas = nodes[0].canvas;

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to duplicate nodes");
			}
			const insertNodes = nodes.map((node) =>
				prisma.node.create({
					data: {
						canvasId: node.canvas.id,
						parentId: node.parentId ?? undefined,
						x: node.x + (input.offsetX ?? 0),
						y: node.y + (input.offsetY ?? 0),
						type: node.type,
						name: node.name,
					},
				}),
			);

			const res = await prisma.$transaction(insertNodes);

			res.forEach((node) => {
				emitter(node.canvasId).emit("add", node);
			});

			return res;
		}),
	updateMany: protectedProcedure
		.input(
			z.object({
				nodes: z.array(
					z.object({
						id: z.string(),
						x: z.number().optional(),
						y: z.number().optional(),
						height: z.number().optional(),
						width: z.number().optional(),
						color: z.string().optional(),
						name: z.string().optional(),
						parentId: z.string().optional().nullable(),
					}),
				),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const nodes = await prisma.node.findMany({
				where: {
					id: {
						in: input.nodes.map((node) => node.id),
					},
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

			if (!nodes) {
				throw new Error("Nodes not found");
			}
			if (nodes.length === 0) {
				return [];
			}
			const canvas = nodes[0].canvas;

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update nodes");
			}

			const updateNodes = input.nodes.map((node) =>
				prisma.node.update({
					where: {
						id: node.id,
					},
					data: {
						x: node.x,
						y: node.y,
						height: node.height,
						width: node.width,
						color: node.color,
						name: node.name,
						parent: {
							...(node.parentId === null
								? { disconnect: true }
								: node.parentId === undefined
								? {}
								: { connect: { id: node.parentId } }),
						},
					},
				}),
			);

			const res = await prisma.$transaction(updateNodes);

			res.forEach((node) => {
				emitter(node.canvasId).emit("update", node);
			});

			return res;
		}),
	shouldEmit: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			// Check if there are any listeners for this canvas
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

			return emitter(input.canvasId).listenerCount("dragUpdate") > 0;
		}),
});
