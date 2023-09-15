import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const EMPTY_DOCUMENT = "AAA=";

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

	const { name } = req.body;

	if (!name) {
		res.status(400).json({ error: "Missing name" });
		return;
	}

	const canvas = await prisma.canvas.create({
		data: {
			ownerId: session.user.id,
			state: EMPTY_DOCUMENT,
			name,
		},
	});

	res.status(200).json({ canvas });
};
