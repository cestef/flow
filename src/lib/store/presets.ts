import { StateCreator } from "zustand";

export interface PresetsSlice {
	presetsPanel: boolean;
	togglePresetsPanel: (open?: boolean) => void;
}

export const createPresetsSlice: StateCreator<PresetsSlice> = (set) => ({
	presetsPanel: false,
	togglePresetsPanel: (open) => set((state) => ({ presetsPanel: open ?? !state.presetsPanel })),
});
