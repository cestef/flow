import { postJson } from "../swr";

export const createCanvas = async (name: string) =>
	postJson<{ id: string }>("/api/canvas/create", { name });
