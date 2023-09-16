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

	const { canvasId, expires, uses, permission } = req.body;

	if (!canvasId) {
		res.status(400).json({ error: "Missing canvasId" });
		return;
	}

	const expiresDate = expires ? new Date(expires) : null;
	if (
		(expires && expiresDate?.toString() === "Invalid Date") ||
		(expiresDate?.getTime() ?? Date.now()) < Date.now()
	) {
		res.status(400).json({ error: "Invalid expires" });
		return;
	}

	if (uses && uses < 0) {
		res.status(400).json({ error: "Invalid uses" });
		return;
	}

	if (permission !== "view" && permission !== "edit") {
		res.status(400).json({ error: "Invalid permission" });
		return;
	}

	const code = generateCode();

	const invite = await prisma.invite.create({
		data: {
			code,
			canvasId,
			expires: expiresDate,
			uses,
			permission,
			creatorId: session.user.id,
		},
	});

	res.status(200).json({ code, id: invite.id });
};

const alphanumeric = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function generateCode() {
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
	}
	return code;
}
