import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { Edge } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { canAccessCanvas } from "../utils";
import { emitter as nodeEmitter } from "./nodes";

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
										userId: ctx.user.id,
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
				id: z.string().nullish(),
				from: z.string(),
				to: z.string(),
				type: z.string(),
				fromHandle: z.string().nullish(),
				toHandle: z.string().nullish(),
				name: z.string().nullish(),
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

			if (!canAccessCanvas(canvas, ctx, "edit")) {
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
					id: input.id ?? undefined,
					type: input.type,
					name: input.name ?? undefined,
					// fromHandle: {
					// 	connect: {
					// 		id: input.fromHandle,
					// 	},
					// },
					// toHandle: {
					// 	connect: {
					// 		id: input.toHandle,
					// 	},
					// },
					...(input.fromHandle && {
						fromHandle: {
							connect: {
								id: input.fromHandle,
							},
						},
					}),
					...(input.toHandle && {
						toHandle: {
							connect: {
								id: input.toHandle,
							},
						},
					}),
				},
			});

			emitter(input.canvasId).emit("add", {
				edge: res,
				userId: ctx.user.id,
			});

			return res;
		}),
	addMany: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				edges: z.array(
					z.object({
						from: z.string(),
						to: z.string(),
						type: z.string().default("default"),
						animated: z.boolean().default(false),
						fromHandle: z.string().nullish(),
						toHandle: z.string().nullish(),
						name: z.string().nullish(),
					}),
				),
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

			if (!canAccessCanvas(canvas, ctx, "edit")) {
				throw new Error("User is not allowed to add edge");
			}

			const edges = input.edges.map((edge) =>
				prisma.edge.create({
					data: {
						from: {
							connect: {
								id: edge.from,
							},
						},
						to: {
							connect: {
								id: edge.to,
							},
						},
						canvas: {
							connect: {
								id: input.canvasId,
							},
						},
						name: edge.name ?? undefined,
						type: edge.type,
						animated: edge.animated,
						...(edge.fromHandle && {
							fromHandle: {
								connect: {
									id: edge.fromHandle,
								},
							},
						}),
						...(edge.toHandle && {
							toHandle: {
								connect: {
									id: edge.toHandle,
								},
							},
						}),
					},
				}),
			);

			const res = await prisma.$transaction(edges);

			res.forEach((edge) => {
				emitter(edge.canvasId).emit("add", {
					edge,
					userId: ctx.user.id,
				});
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

			if (!canAccessCanvas(canvas, ctx)) {
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
				from: z.string().nullish(),
				to: z.string().nullish(),
				animated: z.boolean().nullish(),
				color: z.string().nullish(),
				linkColor: z.boolean().nullish(),
				name: z.string().nullish(),
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

			if (!canAccessCanvas(edge.canvas, ctx, "edit")) {
				throw new Error("User is not allowed to update edge");
			}

			const res = await prisma.edge.update({
				where: {
					id: input.id,
				},
				data: {
					...(input.from && {
						from: {
							connect: {
								id: input.from,
							},
						},
					}),
					...(input.to && {
						to: {
							connect: {
								id: input.to,
							},
						},
					}),
					name: input.name ?? undefined,
					animated: input.animated ?? undefined,
					color: input.color ?? undefined,
					linkColor: input.linkColor ?? undefined,
				},
			});

			emitter(edge.canvas.id).emit("update", {
				edge: res,
				userId: ctx.user.id,
			});

			return res;
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

			if (!canAccessCanvas(canvas, ctx)) {
				throw new Error("User is not allowed to subscribe to this canvas");
			}

			return observable<{
				edge: Edge;
				userId: string;
			}>((observer) => {
				const onUpdate = (event: {
					edge: Edge;
					userId: string;
				}) => {
					observer.next(event);
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

			if (!canAccessCanvas(edge.canvas, ctx, "edit")) {
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

			if (!canAccessCanvas(canvas, ctx)) {
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
	createMany: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				edges: z.array(
					z.object({
						from: z.string(),
						to: z.string(),
						type: z.string().default("default"),
					}),
				),
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

			if (!canAccessCanvas(canvas, ctx, "edit")) {
				throw new Error("User is not allowed to add edges");
			}

			const edges = input.edges.map((edge) =>
				prisma.edge.create({
					data: {
						from: {
							connect: {
								id: edge.from,
							},
						},
						to: {
							connect: {
								id: edge.to,
							},
						},
						canvas: {
							connect: {
								id: input.canvasId,
							},
						},
						type: edge.type,
					},
				}),
			);

			const res = await prisma.$transaction(edges);

			res.forEach((edge) => {
				emitter(edge.canvasId).emit("add", {
					edge,
					userId: ctx.user.id,
				});
			});

			return res;
		}),
	deleteMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const edges = await prisma.edge.findMany({
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

			const allowedEdges = edges.filter((edge) => {
				return canAccessCanvas(edge.canvas, ctx, "edit");
			});

			const res = await prisma.edge.deleteMany({
				where: {
					id: {
						in: allowedEdges.map((edge) => edge.id),
					},
				},
			});

			allowedEdges.forEach((edge) => {
				emitter(edge.canvas.id).emit("delete", {
					edge,
					userId: ctx.user.id,
				});
			});

			return res;
		}),
	invert: protectedProcedure
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
					fromHandle: true,
					toHandle: true,
				},
			});

			if (!edge) {
				throw new Error("Edge not found");
			}

			if (!canAccessCanvas(edge.canvas, ctx, "edit")) {
				throw new Error("User is not allowed to invert edge");
			}

			// Invert the handles and from/to
			const res = await prisma.edge.update({
				where: {
					id: input.id,
				},
				data: {
					from: {
						connect: {
							id: edge.toId,
						},
					},
					to: {
						connect: {
							id: edge.fromId,
						},
					},
					fromHandle: {
						...(edge.toHandleId && {
							connect: {
								id: edge.toHandleId,
							},
						}),
					},
					toHandle: {
						...(edge.fromHandleId && {
							connect: {
								id: edge.fromHandleId,
							},
						}),
					},
				},
			});
			if (edge.fromHandleId && edge.toHandleId) {
				// Update the handles types
				const node2 = await prisma.node.update({
					where: {
						id: edge.fromId,
					},
					data: {
						handles: {
							update: {
								where: {
									id: edge.fromHandleId,
								},
								data: {
									type: edge.toHandle?.type ?? "default",
								},
							},
						},
					},
					include: {
						handles: true,
					},
				});

				const node1 = await prisma.node.update({
					where: {
						id: edge.toId,
					},
					data: {
						handles: {
							update: {
								where: {
									id: edge.toHandleId,
								},
								data: {
									type: edge.fromHandle?.type ?? "default",
								},
							},
						},
					},
					include: {
						handles: true,
					},
				});

				nodeEmitter(edge.canvas.id).emit("update", node1);
				nodeEmitter(edge.canvas.id).emit("update", node2);
			}

			emitter(edge.canvas.id).emit("update", {
				edge: res,
				userId: ctx.user.id,
			});
		}),
});
