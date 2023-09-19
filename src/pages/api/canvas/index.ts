import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import * as Y from "yjs";
import { Edge, Node } from "reactflow";

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
		include: {
			members: {
				include: {
					user: true,
				},
			},
		},
	});

	const yDocs = canvases.map((canvas) => {
		const yDoc = new Y.Doc();
		// console.log(canvas.state);
		Y.applyUpdate(yDoc, Buffer.from(canvas.state, "base64"));
		const storage = yDoc.getMap("storage");
		const nodes = storage.get("nodes") as Y.Map<Node> | undefined;
		const edges = storage.get("edges") as Y.Map<Edge> | undefined;
		return {
			...canvas,
			nodes: nodes ? Object.values(nodes.toJSON()) : [],
			edges: edges ? Object.values(edges.toJSON()) : [],
		};
	});

	res.status(200).json(yDocs);
}
