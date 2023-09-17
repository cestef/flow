import { create } from "zustand";
import { CanvasSlice, createCanvasSlice } from "./canvas";
import { AwarenessSlice, createAwarenessSlice } from "./awareness";
import { MembersSlice, createMembersSlice } from "./members";
import { CmdKSlice, createCmdKSlice } from "./cmdk";
import { PresetsSlice, createPresetsSlice } from "./presets";
import { EditingSlice, createEditingSlice } from "./editing";

export interface RootSlice
	extends CanvasSlice,
		AwarenessSlice,
		MembersSlice,
		CmdKSlice,
		PresetsSlice,
		EditingSlice {
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
	...createEditingSlice(...a),
	isMobile: false,
	setMobile: (isMobile) => a[0]((state) => ({ isMobile })),
}));
