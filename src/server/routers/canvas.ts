import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { Canvas } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

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

			return canvas;
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
									userId: ctx.user.id,
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
							user: { select: { id: true, name: true, image: true } },
							permission: true,
							id: true,
						},
					},
					owner: true,
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
								userId: ctx.user.id,
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
									userId: ctx.user.id,
									permission: "edit",
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
						userId: ctx.user.id,
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
	createPreset: protectedProcedure
		.input(
			z.object({
				nodeId: z.string(),
				name: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const node = await prisma.node.findFirst({
				where: {
					id: input.nodeId,
					canvas: {
						OR: [
							{
								owner: {
									id: ctx.user.id,
								},
							},
							{
								members: {
									some: {
										userId: ctx.user.id,
										permission: "edit",
									},
								},
							},
						],
					},
				},
			});

			if (!node) {
				throw new Error("Node not found");
			}

			// Duplicate the node and set the preset name
			node.preset = true;
			node.name = input.name;
			node.id = undefined as any;

			const res = await prisma.node.create({
				data: node,
			});

			return res;
		}),
	import: protectedProcedure
		.input(
			z.object({
				name: z.string(),
				nodes: z.array(
					z.object({
						x: z.number(),
						y: z.number(),
						type: z.string(),
						name: z.string(),
						parentId: z.string().nullish(),
						height: z.number().nullish(),
						width: z.number().nullish(),
						color: z.string().nullish(),
						fontSize: z.number().nullish(),
						fontWeight: z.string().nullish(),
						fontColor: z.string().nullish(),
						fontFamily: z.string().nullish(),
						horizontalAlign: z.string().nullish(),
						verticalAlign: z.string().nullish(),
						borderRadius: z.number().nullish(),
						borderColor: z.string().nullish(),
						borderWidth: z.number().nullish(),
						borderStyle: z.string().nullish(),
						preset: z.boolean().nullish(),
						handles: z
							.array(
								z.object({
									position: z.string(),
									type: z.string(),
									id: z.string().nullish(),
								}),
							)
							.nullish(),
						id: z.string().nullish(),
					}),
				),
				edges: z.array(
					z.object({
						from: z.string(),
						to: z.string(),
						type: z.string().default("default"),
						animated: z.boolean().default(false),
						fromHandle: z.string().nullish(),
						toHandle: z.string().nullish(),
						color: z.string().nullish(),
						name: z.string().nullish(),
						linkColor: z.boolean().default(false),
					}),
				),
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

			const inserts = input.nodes.map((node) =>
				prisma.node.create({
					data: {
						x: node.x,
						y: node.y,
						type: node.type,
						name: node.name,
						height: node.height,
						width: node.width,
						color: node.color,
						fontSize: node.fontSize,
						fontWeight: node.fontWeight,
						fontColor: node.fontColor,
						fontFamily: node.fontFamily,
						borderRadius: node.borderRadius,
						borderColor: node.borderColor,
						borderWidth: node.borderWidth,
						borderStyle: node.borderStyle,
						horizontalAlign: node.horizontalAlign,
						verticalAlign: node.verticalAlign,
						handles: {
							create:
								node.handles?.map((handle) => ({
									type: handle.type,
									position: handle.position,
									tempId: handle.id,
								})) ?? [],
						},
						canvas: {
							connect: {
								id: canvas.id,
							},
						},
						tempId: node.id,
						preset: node.preset ?? false,
					},
					include: {
						handles: true,
					},
				}),
			);
			const res = await prisma.$transaction(inserts);

			console.log(res);

			// Connect children to parents
			const updateNodes = res
				.filter((node) => node.tempId)
				.map((node) => {
					const inputNode = input.nodes.find((n) => n.id === node.tempId);
					return prisma.node.update({
						where: {
							id: node.id,
						},
						data: {
							parent: {
								...(!inputNode?.parentId
									? {}
									: {
											connect: {
												id: res.find((n) => n.tempId === inputNode.parentId)
													?.id,
											},
									  }),
							},
						},
					});
				});
			const updateRes = await prisma.$transaction(updateNodes);

			console.log(updateRes);

			const insertEdges = input.edges.map((edge) =>
				prisma.edge.create({
					data: {
						from: {
							...(!edge.from
								? {}
								: {
										connect: {
											id: res.find((node) => node.tempId === edge.from)?.id,
										},
								  }),
						},
						to: {
							...(!edge.to
								? {}
								: {
										connect: {
											id: res.find((node) => node.tempId === edge.to)?.id,
										},
								  }),
						},
						type: edge.type,
						animated: edge.animated,
						fromHandle: {
							...(!edge.fromHandle
								? {}
								: {
										connect: {
											id: res
												.find((node) =>
													node.handles.find(
														(handle) => handle.tempId === edge.fromHandle,
													),
												)
												?.handles.find(
													(handle) => handle.tempId === edge.fromHandle,
												)?.id,
										},
								  }),
						},
						toHandle: {
							...(!edge.toHandle
								? {}
								: {
										connect: {
											id: res
												.find((node) =>
													node.handles.find(
														(handle) => handle.tempId === edge.toHandle,
													),
												)
												?.handles.find(
													(handle) => handle.tempId === edge.toHandle,
												)?.id,
										},
								  }),
						},
						canvas: {
							connect: {
								id: canvas.id,
							},
						},
						linkColor: edge.linkColor,
						color: edge.color,
						name: edge.name,
					},
				}),
			);
			await prisma.$transaction(insertEdges);

			return canvas;
		}),
});
