import { prisma } from "../lib/prisma";
import { canAccessCanvas } from "../lib/utils";
import { getSession } from "next-auth/react";

export const authenticate = async (cookie: string | undefined, docName: string | undefined) => {
	if (!docName) {
		throw new Error("Canvas not found");
	}
	if (!cookie) {
		throw new Error("Authentication cookie not found");
	}
	console.log(`authenticate: ${docName}, ${cookie}`);
	const session = await getSession({
		req: {
			headers: {
				cookie,
			},
		},
	});

	console.log(`onAuthenticate: ${session?.user?.login}`);
	if (!session?.user.id) {
		throw new Error("Not authenticated");
	}
	const canvas = await prisma.canvas.findUnique({
		where: {
			id: docName,
		},
		include: {
			members: true,
		},
	});
	if (!canvas) {
		throw new Error("Canvas not found");
	}

	if (!canAccessCanvas(canvas, session.user.id)) {
		throw new Error("Cannot access canvas");
	}
	return session.user;
};
