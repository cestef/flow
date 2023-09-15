import { StateCreator } from "zustand";

export interface CmdKSlice {
	cmdk: boolean;
	setCmdk: (cmdk: boolean) => void;
	cmdkSearch: string;
	setCmdkSearch: (cmdkSearch: string) => void;
}

export const createCmdKSlice: StateCreator<CmdKSlice> = (set) => ({
	cmdk: false,
	setCmdk: (cmdk) => set({ cmdk }),
	cmdkSearch: "",
	setCmdkSearch: (cmdkSearch) => set({ cmdkSearch }),
});
