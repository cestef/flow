/*
import { StateCreator } from "zustand";

export interface CanvasSlice {
	canvasId: string | null;
	setCanvasId: (canvasId: string | null) => void;
}

export const createCanvasSlice: StateCreator<CanvasSlice> = (set) => ({
	canvasId: null,
	setCanvasId: (canvasId) => set({ canvasId }),
});

*/

import { StateCreator } from "zustand";
import * as Y from "yjs";

export interface AwarenessState {
	color: string;
	selected: string[];
	x: number;
	y: number;
}

export interface AwarenessSlice {
	states: Map<number, AwarenessState>;
	setStates: (states: Map<number, AwarenessState>) => void;
	localId: number;
	setLocalId: (localId: number) => void;
	mouseX: number;
	mouseY: number;
	mouseDown: boolean;
	setMouseX: (mouseX: number) => void;
	setMouseY: (mouseY: number) => void;
	setMouseDown: (mouseDown: boolean) => void;
}

export const createAwarenessSlice: StateCreator<AwarenessSlice> = (set) => ({
	states: new Map(),
	setStates: (states) => set({ states }),
	localId: 0,
	setLocalId: (localId) => set({ localId }),
	mouseX: 0,
	mouseY: 0,
	mouseDown: false,
	setMouseX: (mouseX) => set({ mouseX }),
	setMouseY: (mouseY) => set({ mouseY }),
	setMouseDown: (mouseDown) => set({ mouseDown }),
});
