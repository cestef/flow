import { postJson } from "../swr";

export const createCanvas = async (name: string) =>
	postJson<{ id: string }>("/api/canvas/create", { name });

export const updateCanvasSettings = async (id: string, settings: any) =>
	postJson(`/api/canvas/settings/${id}`, settings);
