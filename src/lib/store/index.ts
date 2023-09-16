import { create } from "zustand";
import { CanvasSlice, createCanvasSlice } from "./canvas";
import { AwarenessSlice, createAwarenessSlice } from "./awareness";
import { MembersSlice, createMembersSlice } from "./members";
import { CmdKSlice, createCmdKSlice } from "./cmdk";
import { PresetsSlice, createPresetsSlice } from "./presets";

export interface RootSlice
	extends CanvasSlice,
		AwarenessSlice,
		MembersSlice,
		CmdKSlice,
		PresetsSlice {
	cmdk: boolean;
	setCmdk: (cmdk: boolean) => void;
	isMobile: boolean;
	setMobile: (isMobile: boolean) => void;
}

export const useStore = create<RootSlice>()((...a) => ({
	...createCanvasSlice(...a),
	...createAwarenessSlice(...a),
	...createMembersSlice(...a),
	...createPresetsSlice(...a),
	...createCmdKSlice(...a),
	isMobile: false,
	setMobile: (isMobile) => a[0]((state) => ({ isMobile })),
}));
