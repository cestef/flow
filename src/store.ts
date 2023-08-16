import {
	combine,
	createJSONStorage,
	devtools,
	persist,
} from "zustand/middleware";

import { create } from "zustand";
import { z } from "zod";

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
		}),
	),
);
