import { Canvas, Member } from "@prisma/client";

export const canAccessCanvas = (
	canvas: (Canvas & { members: Member[] }) | null,
	ctx: {
		user: {
			id: string;
		};
	},
	permission?: "view" | "edit",
) => {
	if (!canvas) {
		return false;
	}

	if (canvas.ownerId === ctx.user.id) {
		return true;
	}

	return canvas.members.some(
		(member) =>
			member.userId === ctx.user.id &&
			(!permission || member.permission === permission),
	);
};
