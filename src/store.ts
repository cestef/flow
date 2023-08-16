import {
	combine,
	createJSONStorage,
	devtools,
	persist,
} from "zustand/middleware";

import { z } from "zod";
import { create } from "zustand";

const ZStore = z.object({
	createNewCanvas: z.object({
		opened: z.boolean(),
		name: z.string(),
	}),
});

export const useStore = create(
	combine(
		{
			createNewCanvas: {
				opened: false,
				name: "",
			},
			currentCanvasId: "",
			contextMenuPosition: {
				x: 0,
				y: 0,
			},
			addNewMember: {
				opened: false,
				email: "",
			},
			chooseCanvas: {
				opened: false,
			},
			canvasPanelHidden: false,
			membersPanelHidden: false,
			snapToGrid: false,
		},
		(set) => ({
			toggleCreateNewCanvas: (opened?: boolean) =>
				set((state) => ({
					createNewCanvas: {
						...state.createNewCanvas,
						opened: opened ?? !state.createNewCanvas.opened,
					},
				})),
			setCreateNewCanvasName: (name: string) =>
				set((state) => ({
					createNewCanvas: { ...state.createNewCanvas, name },
				})),
			setCurrentCanvasId: (id: string) => set({ currentCanvasId: id }),
			setContextMenuPosition: (x: number, y: number) =>
				set({ contextMenuPosition: { x, y } }),
			toggleAddNewMember: (opened?: boolean) =>
				set((state) => ({
					addNewMember: {
						...state.addNewMember,
						opened: opened ?? !state.addNewMember.opened,
					},
				})),
			setAddNewMemberEmail: (email: string) =>
				set((state) => ({
					addNewMember: { ...state.addNewMember, email },
				})),
			toggleChooseCanvas: (opened?: boolean) =>
				set((state) => ({
					chooseCanvas: {
						...state.chooseCanvas,
						opened: opened ?? !state.chooseCanvas.opened,
					},
				})),
			toggleCanvasPanel: (hidden?: boolean) =>
				set((state) => ({
					canvasPanelHidden: hidden ?? !state.canvasPanelHidden,
				})),
			toggleMembersPanel: (hidden?: boolean) =>
				set((state) => ({
					membersPanelHidden: hidden ?? !state.membersPanelHidden,
				})),
			setSnapToGrid: (snapToGrid: boolean) => set({ snapToGrid }),
		}),
	),
);
