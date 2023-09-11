import { Canvas, Member } from "@prisma/client";
import { User } from "next-auth";
import { Context } from "./context";

export const canAccessCanvas = (
	canvas: (Canvas & { members: Member[] }) | null,
	ctx: {
		user: {
			id: string;
		};
	},
	permission: "view" | "edit" = "view",
) => {
	if (!canvas) {
		return false;
	}

	if (canvas.ownerId === ctx.user.id) {
		return true;
	}

	return canvas.members.some(
		(member) =>
			member.userId === ctx.user.id && member.permission === permission,
	);
};
