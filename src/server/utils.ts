import { Canvas, Member } from "@prisma/client";

export const canAccessCanvas = (
	canvas: (Canvas & { members: Member[] }) | null,
	ctx: {
		user: {
			id: string;
		};
	},
	permission?: "view" | "edit" | "owner",
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
			(!permission || hasPermission(member.permission, permission)),
	);
};

export const SUB_PERMISSIONS: {
	[key: string]: string[];
} = {
	owner: ["view", "edit"],
	edit: ["view"],
	view: [],
};

export const hasPermission = (
	permission: string,
	needed: "edit" | "view" | "owner",
) => {
	return permission === needed || SUB_PERMISSIONS[permission]?.includes(needed);
};
