import { protectedProcedure, router } from "../trpc";

import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { canAccessCanvas } from "../utils";

export const invitesRouter = router({
	create: protectedProcedure
		.input(
			z.object({
				canvasId: z.string(),
				maxUses: z.number().nullish(),
				expires: z.date().nullish(),
				permission: z.enum(["view", "edit"]).default("view"),
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
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			const code = generateCodeCrypto(6);

			const invite = await prisma.invite.create({
				data: {
					canvasId: input.canvasId,
					maxUses: input.maxUses ?? undefined,
					expires: input.expires,
					code: code,
					userId: ctx.user.id,
					permission: input.permission,
				},
			});

			return invite;
		}),
	redeem: protectedProcedure
		.input(
			z.object({
				code: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const invite = await prisma.invite.findFirst({
				where: {
					code: input.code,
				},
			});

			if (!invite) {
				throw new Error("Invite not found");
			}

			if (invite.maxUses && invite.maxUses <= invite.uses) {
				throw new Error("Invite has been used too many times");
			}

			if (invite.expires && new Date(invite.expires) < new Date()) {
				throw new Error("Invite has expired");
			}

			const canvas = await prisma.canvas.findFirst({
				where: {
					id: invite.canvasId,
				},
				include: {
					members: true,
				},
			});

			if (!canvas) {
				throw new Error("Canvas not found");
			}

			if (canAccessCanvas(canvas, ctx)) {
				throw new Error("You are already a member of this canvas");
			}

			await prisma.invite.update({
				where: {
					id: invite.id,
				},
				data: {
					uses: invite.uses + 1,
				},
			});

			await prisma.canvas.update({
				where: {
					id: invite.canvasId,
				},
				data: {
					members: {
						create: {
							userId: ctx.user.id,
							permission: invite.permission,
						},
					},
				},
			});

			return canvas;
		}),
});
function generateCode(length: number) {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
	let code = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		code += characters.charAt(randomIndex);
	}

	return code;
}

function generateCodeCrypto(length: number) {
	return createHash("sha256")
		.update(randomBytes(length))
		.digest("hex")
		.slice(0, length);
}
