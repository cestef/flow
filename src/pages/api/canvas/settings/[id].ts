import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { ZodError, z } from "zod";
import { prisma } from "@/lib/prisma";

const SettingsSchema = z.object({
	members: z.object({
		canInvite: z.boolean(),
	}),
});

export default async function (req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}
	const session = await getServerSession(req, res, authOptions);
	if (!session) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const canvasId = req.query.id as string;

	if (!canvasId) {
		res.status(400).json({ error: "Invalid canvas ID" });
		return;
	}

	try {
		const settings = SettingsSchema.parse(req.body);
		const canvas = await prisma.canvas.findUnique({
			where: {
				id: canvasId,
			},
			include: {
				members: true,
			},
		});

		if (!canvas) {
			res.status(404).json({ error: "Canvas not found" });
			return;
		}

		if (canvas.ownerId !== session.user.id) {
			res.status(403).json({ error: "Forbidden" });
			return;
		}

		await prisma.canvas.update({
			where: {
				id: canvasId,
			},
			data: {
				settings,
			},
		});
		res.status(200).json({ success: true });
	} catch (e) {
		if (e instanceof ZodError) {
			res.status(400).json({ error: e.issues, code: "invalid_body" });
			return;
		}
		res.status(500).json({ error: "Internal Server Error" });
	}
}
