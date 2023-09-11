import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { Canvas } from "@prisma/client";
import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { canAccessCanvas } from "../utils";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
	if (!emitters.has(id)) {
		emitters.set(id, new EventEmitter());
	}

	return emitters.get(id)!;
};

export const membersRouter = router({
	me: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const member = await prisma.member.findFirst({
				where: {
					canvasId: input.canvasId,
					userId: ctx.user.id,
				},
			});

			if (!member) {
				const owner = await prisma.canvas.findFirst({
					where: {
						id: input.canvasId,
						ownerId: ctx.user.id,
					},
				});

				if (!owner) {
					throw new Error("Not an owner or member of this canvas");
				}

				return {
					userId: ctx.user.id,
					id: "root",
					permission: "edit",
				};
			}

			return member;
		}),
	add: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				id: z.string(),
				permission: z.enum(["view", "edit"]),
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
									userId: ctx.user.id,
								},
							},
						},
					],
				},
				include: {
					members: true,
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			if (
				canAccessCanvas(canvas, {
					user: {
						id: input.id,
					},
				})
			) {
				throw new Error("User is already a member of this canvas");
			}

			const res = await prisma.canvas.update({
				where: {
					id: input.canvasId,
				},
				data: {
					members: {
						create: {
							userId: input.id,
							permission: input.permission,
						},
					},
				},
			});
			emitter(input.id).emit("addMember", res);
			emitter(canvas.id).emit("addMember", input.id);
		}),
	delete: protectedProcedure
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
					],
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			console.log(input);

			await prisma.canvas.update({
				where: {
					id: input.canvasId,
				},
				data: {
					members: {
						delete: {
							id: input.id,
						},
					},
				},
			});

			emitter(canvas.id).emit("removeMember", input.id);
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

			if (!canAccessCanvas(canvas, ctx)) {
				throw new Error("User is not allowed to subscribe to this canvas");
			}

			return observable<string>((observer) => {
				const onAddMember = (userId: string) => {
					observer.next(userId);
				};

				emitter(input.canvasId).on("addMember", onAddMember);
				return () => {
					emitter(input.canvasId).off("addMember", onAddMember);
				};
			});
		}),
	onSelfAddMember: protectedProcedure.subscription(async ({ ctx }) => {
		return observable<Canvas>((observer) => {
			const onAddMember = (canvas: Canvas) => {
				observer.next(canvas);
			};

			emitter(ctx.user.id).on("addMember", onAddMember);
			return () => {
				emitter(ctx.user.id).off("addMember", onAddMember);
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

			if (!canAccessCanvas(canvas, ctx)) {
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
	updatePermission: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				id: z.string(),
				permission: z.enum(["view", "edit"]),
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
						update: {
							where: {
								id: input.id,
							},
							data: {
								permission: input.permission,
							},
						},
					},
				},
			});
		}),
});
