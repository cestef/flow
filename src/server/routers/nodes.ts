import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { Node } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
const emitters = new Map<string, EventEmitter>();
import { emitter as edgesEmitter } from "./edges";

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const nodesRouter = router({
	updateHandle: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				type: z.string().nullish(),
				position: z.string().nullish(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const handle = await prisma.nodeHandle.findUnique({
				where: {
					id: input.id,
				},
				include: {
					node: {
						include: {
							canvas: {
								include: {
									owner: true,
									members: true,
								},
							},
						},
					},
				},
			});

			if (!handle) {
				throw new Error("Handle not found");
			}

			if (
				handle.node.canvas.owner.id !== ctx.user.id &&
				!handle.node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to update handle");
			}

			// Switch if the handle position is already taken
			if (input.position) {
				const otherHandle = await prisma.nodeHandle.findFirst({
					where: {
						position: input.position ?? undefined,
						nodeId: handle.node.id,
					},
				});

				if (otherHandle) {
					await prisma.nodeHandle.update({
						where: {
							id: otherHandle.id,
						},

						data: {
							position: handle.position,
						},
					});
				}
			}

			const res = await prisma.nodeHandle.update({
				where: {
					id: input.id,
				},
				data: {
					type: input.type ?? undefined,
					position: input.position ?? undefined,
				},
				include: {
					node: {
						include: {
							handles: true,
						},
					},
				},
			});

			emitter(handle.node.canvas.id).emit("update", res.node);

			return res;
		}),
	deleteHandle: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const handle = await prisma.nodeHandle.findUnique({
				where: {
					id: input.id,
				},
				include: {
					node: {
						include: {
							canvas: {
								include: {
									owner: true,
									members: true,
								},
							},
						},
					},
				},
			});

			if (!handle) {
				throw new Error("Handle not found");
			}

			if (
				handle.node.canvas.owner.id !== ctx.user.id &&
				!handle.node.canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to delete handle");
			}

			const res = await prisma.nodeHandle.delete({
				where: {
					id: input.id,
				},
			});
			const ids = await prisma.edge.findMany({
				where: {
					OR: [
						{
							fromHandleId: res.id,
						},
						{
							toHandleId: res.id,
						},
					],
				},
				select: {
					id: true,
				},
			});
			await prisma.edge.deleteMany({
				where: {
					id: {
						in: ids.map((edge) => edge.id),
					},
				},
			});

			for (const edge of ids) {
				edgesEmitter(handle.node.canvas.id).emit("delete", {
					edge,
					userId: ctx.user.id,
				});
			}
			const newNode = await prisma.node.findUnique({
				where: {
					id: handle.node.id,
				},
				include: {
					handles: true,
				},
			});
			emitter(handle.node.canvas.id).emit("update", newNode);

			return res;
		}),

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
				include: {
					handles: true,
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
						}),
					)
					.nullish(),
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
					color: input.color,
					fontSize: input.fontSize,
					fontWeight: input.fontWeight,
					fontColor: input.fontColor,
					fontFamily: input.fontFamily,
					borderRadius: input.borderRadius,
					borderColor: input.borderColor,
					borderWidth: input.borderWidth,
					borderStyle: input.borderStyle,
					horizontalAlign: input.horizontalAlign,
					verticalAlign: input.verticalAlign,
					handles: {
						create:
							input.handles?.map((handle) => ({
								type: handle.type,
								position: handle.position,
							})) ?? [],
					},
					canvas: {
						connect: {
							id: input.canvasId,
						},
					},
					parent: {
						...(!input.parentId ? {} : { connect: { id: input.parentId } }),
					},
					preset: input.preset ?? false,
				},

				include: {
					handles: true,
				},
			});

			emitter(input.canvasId).emit("add", node);

			return node;
		}),
	addMany: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
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
						handles: z
							.array(
								z.object({
									position: z.string(),
									type: z.string(),
								}),
							)
							.nullish(),
						id: z.string().nullish(),
					}),
				),
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
								})) ?? [],
						},
						canvas: {
							connect: {
								id: input.canvasId,
							},
						},
						parent: {
							...(!node.parentId ? {} : { connect: { id: node.parentId } }),
						},
						tempId: node.id,
					},
				}),
			);
			const res = await prisma.$transaction(inserts);

			// Connect children to parents
			const updateNodes = res
				.filter((node) => node.parentId && node.tempId)
				.map((node) => {
					const parent = res.find((n) => n.tempId === node.parentId);
					return prisma.node.update({
						where: {
							id: node.id,
						},
						data: {
							parent: {
								connect: {
									id: parent?.id,
								},
							},
						},
					});
				});
			// Update edges

			await prisma.$transaction(updateNodes);

			res.forEach((node) => {
				emitter(input.canvasId).emit("add", node);
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
				x: z.number().nullish(),
				y: z.number().nullish(),
				width: z.number().nullish(),
				height: z.number().nullish(),
				name: z.string().nullish(),
				parentId: z.string().nullish().nullable(),
				color: z.string().nullish(),
				fontColor: z.string().nullish(),
				fontSize: z.number().nullish(),
				fontWeight: z.string().nullish(),
				fontFamily: z.string().nullish(),
				horizontalAlign: z.string().nullish(),
				verticalAlign: z.string().nullish(),
				borderRadius: z.number().nullish(),
				borderColor: z.string().nullish(),
				borderWidth: z.number().nullish(),
				borderStyle: z.string().nullish(),
				handles: z
					.array(
						z.object({
							position: z.string(),
							type: z.string(),
						}),
					)
					.nullish(),
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
					x: input.x ?? undefined,
					y: input.y ?? undefined,
					width: input.width,
					height: input.height,
					name: input.name ?? undefined,
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
					fontFamily: input.fontFamily,
					borderRadius: input.borderRadius,
					borderColor: input.borderColor,
					borderWidth: input.borderWidth,
					borderStyle: input.borderStyle,
					horizontalAlign: input.horizontalAlign,
					verticalAlign: input.verticalAlign,
					handles: {
						create:
							input.handles?.map((handle) => ({
								type: handle.type,
								position: handle.position,
							})) ?? [],
					},
				},
				include: {
					handles: true,
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

			// console.log(input.changes);

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
				offsetX: z.number().nullish(),
				offsetY: z.number().nullish(),
				preset: z.boolean().nullish(),
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
					handles: true,
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
					fontSize: node.fontSize,
					fontWeight: node.fontWeight,
					fontColor: node.fontColor,
					fontFamily: node.fontFamily,
					borderRadius: node.borderRadius,
					borderColor: node.borderColor,
					borderWidth: node.borderWidth,
					borderStyle: node.borderStyle,
					width: node.width,
					height: node.height,
					color: node.color,
					canvasId: node.canvas.id,
					parentId: node.parentId ?? undefined,
					verticalAlign: node.verticalAlign,
					horizontalAlign: node.horizontalAlign,
					handles: {
						create: node.handles.map((handle) => ({
							type: handle.type,
							position: handle.position,
						})),
					},
					preset: input.preset ?? false,
				},
			});

			emitter(node.canvas.id).emit("add", res);

			return res;
		}),
	duplicateMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
				offsetX: z.number().nullish(),
				offsetY: z.number().nullish(),
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
					handles: true,
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
						fontSize: node.fontSize,
						fontWeight: node.fontWeight,
						fontColor: node.fontColor,
						fontFamily: node.fontFamily,
						width: node.width,
						height: node.height,
						color: node.color,
						borderRadius: node.borderRadius,
						borderColor: node.borderColor,
						borderWidth: node.borderWidth,
						borderStyle: node.borderStyle,
						verticalAlign: node.verticalAlign,
						horizontalAlign: node.horizontalAlign,
						handles: {
							create:
								node.handles?.map((handle) => ({
									type: handle.type,
									position: handle.position,
								})) ?? [],
						},
					},
					include: {
						handles: true,
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
						x: z.number().nullish(),
						y: z.number().nullish(),
						height: z.number().nullish(),
						width: z.number().nullish(),
						color: z.string().nullish(),
						name: z.string().nullish(),
						parentId: z.string().nullish().nullable(),
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
						x: node.x ?? undefined,
						y: node.y ?? undefined,
						height: node.height,
						width: node.width,
						color: node.color,
						name: node.name ?? undefined,
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
				throw new Error(`Canvas ${input.canvasId} not found`);
			}

			if (
				canvas.owner.id !== ctx.user.id &&
				!canvas.members.some((member) => member.id === ctx.user.id)
			) {
				throw new Error("User is not allowed to subscribe to this canvas");
			}

			return emitter(input.canvasId).listenerCount("dragUpdate") > 1;
		}),
	deleteMany: protectedProcedure
		.input(
			z.object({
				ids: z.array(z.string()),
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
				throw new Error("User is not allowed to delete nodes");
			}

			const deleteNodes = nodes.map((node) =>
				prisma.node.delete({
					where: {
						id: node.id,
					},
				}),
			);

			const res = await prisma.$transaction(deleteNodes);

			res.forEach((node) => {
				emitter(node.canvasId).emit("delete", node);
			});

			return res;
		}),
});
