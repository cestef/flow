/*
addMember: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				email: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if the canvas is owned by the user
			const canvas = await prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.canvasId,
							owner: {
								id: ctx.user.id,
							},
						},
						// {
						// 	id: input.canvasId,
						// 	members: {
						// 		some: {
						// 			id: ctx.user.id,
						// 		},
						// 	},
						// },
					],
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			const res = await prisma.canvas.update({
				where: {
					id: input.canvasId,
				},
				data: {
					members: {
						connect: {
							email: input.email,
						},
					},
				},
				select: {
					members: true,
				},
			});

			emitter(ctx.user.id).emit(
				"addMember",
				res.members.find((m) => m.email === input.email)!.id,
			);
		}),
	removeMember: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				userId: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Check if the canvas is owned by the user
			const canvas = await prisma.canvas.findFirst({
				where: {
					OR: [
						{
							id: input.canvasId,
							owner: {
								id: ctx.user.id,
							},
						},
						// {
						// 	id: input.canvasId,
						// 	members: {
						// 		some: {
						// 			id: ctx.user.id,
						// 		},
						// 	},
						// },
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

			emitter(ctx.user.id).emit("removeMember", input.userId);
		}),
	onAddMember: protectedProcedure.subscription(async ({ ctx }) => {
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
			const onAddMember = (userId: string) => {
				emit.next(userId);
			};
			emitter(ctx.user.id).on("addMember", onAddMember);
			for (const ownerId of ownerIds)
				emitter(ownerId).on("addMember", onAddMember);
			return () => {
				emitter(ctx.user.id).off("addMember", onAddMember);
				for (const ownerId of ownerIds)
					emitter(ownerId).off("addMember", onAddMember);
			};
		});
	}),
	onRemoveMember: protectedProcedure.subscription(async ({ ctx }) => {
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
			const onRemoveMember = (userId: string) => {
				emit.next(userId);
			};
			emitter(ctx.user.id).on("removeMember", onRemoveMember);
			for (const ownerId of ownerIds)
				emitter(ownerId).on("removeMember", onRemoveMember);
			return () => {
				emitter(ctx.user.id).off("removeMember", onRemoveMember);
				for (const ownerId of ownerIds)
					emitter(ownerId).off("removeMember", onRemoveMember);
			};
		});
	}),
 */

import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { prisma } from "@/lib/prisma";
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
				email: z.string().email(),
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
						connectOrCreate: {
							where: {
								email: input.email,
							},
							create: {
								email: input.email,
							},
						},
					},
				},
			});

			emitter(canvas.id).emit("addMember", input.email);
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
