import { postJson } from "../swr";

export const createInvite = async (
	canvasId: string,
	expires?: Date,
	uses?: number,
	permission: "view" | "edit" = "view"
) =>
	postJson<{ id: string; code: string }>("/api/invite/create", {
		canvasId,
		expires,
		uses,
		permission,
	});

export const redeemInvite = async (code: string) => postJson("/api/invite/redeem", { code });
