import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import * as Y from "yjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}
	const session = await getServerSession(req, res, authOptions);
	if (!session) {
		res.status(401).json({ error: "Unauthorized" });
		return;
	}

	const canvases = await prisma.canvas.findMany({
		where: {
			OR: [
				{
					ownerId: session.user.id,
				},
				{
					members: {
						some: {
							userId: session.user.id,
						},
					},
				},
			],
		},
	});

	res.status(200).json(canvases);
}
