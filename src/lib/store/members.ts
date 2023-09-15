import { StateCreator } from "zustand";

export interface MembersSlice {
	membersPanel: boolean;
	toggleMembersPanel: (open?: boolean) => void;
}

export const createMembersSlice: StateCreator<MembersSlice> = (set) => ({
	membersPanel: false,
	toggleMembersPanel: (open) => set((state) => ({ membersPanel: open ?? !state.membersPanel })),
});
