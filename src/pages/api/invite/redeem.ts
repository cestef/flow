import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async (req: NextApiRequest, res: NextApiResponse) => {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}
	const session = await getServerSession(req, res, authOptions);
	if (!session) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const { code } = req.body;

	if (!code) {
		res.status(400).json({ error: "Missing code" });
		return;
	}

	const invite = await prisma.invite.findUnique({
		where: {
			code,
		},
		include: {
			canvas: {
				include: {
					members: true,
				},
			},
		},
	});

	if (!invite) {
		res.status(400).json({ error: "Invalid code" });
		return;
	}

	if (invite.expires && invite.expires.getTime() < Date.now()) {
		res.status(400).json({ error: "Expired code" });
		return;
	}

	if (invite.maxUses && invite.maxUses <= invite.uses) {
		res.status(400).json({ error: "Max uses reached" });
		return;
	}

	if (invite.canvas.ownerId === session.user.id) {
		res.status(400).json({ error: "You are the owner of this canvas" });
		return;
	}

	if (invite.canvas.members?.some((member) => member.id === session.user.id)) {
		res.status(400).json({ error: "You are already a member of this canvas" });
		return;
	}

	await prisma.canvas.update({
		where: {
			id: invite.canvasId,
		},
		data: {
			members: {
				create: {
					userId: session.user.id,
				},
			},
		},
	});

	await prisma.invite.update({
		where: {
			id: invite.id,
		},
		data: {
			uses: invite.uses + 1,
		},
	});

	res.status(200).json({ success: true });
};
