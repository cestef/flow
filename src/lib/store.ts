import { Edge, Node } from "reactflow";

import { z } from "zod";
import { create } from "zustand";
import { combine } from "zustand/middleware";

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
			snapLines: false,
			clipboard: {
				nodes: [] as Node[],
				edges: [] as Edge[],
			},
			selected: {
				nodes: [] as Node[],
				edges: [] as Edge[],
			},
			settingsOpen: false,
			helperLineVertical: undefined as number | undefined,
			helperLineHorizontal: undefined as number | undefined,
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
			setClipboard: (nodes: Node[], edges: Edge[]) =>
				set({ clipboard: { nodes, edges } }),
			clearClipboard: () => set({ clipboard: { nodes: [], edges: [] } }),
			setSelected: (nodes: Node[], edges: Edge[]) =>
				set({ selected: { nodes, edges } }),
			clearSelected: () => set({ selected: { nodes: [], edges: [] } }),
			setSettingsOpen: (settingsOpen: boolean) => set({ settingsOpen }),
			setHelperLineVertical: (helperLineVertical: number | undefined) =>
				set({ helperLineVertical }),
			setHelperLineHorizontal: (helperLineHorizontal: number | undefined) =>
				set({ helperLineHorizontal }),
			setSnapLines: (snapLines: boolean) => set({ snapLines }),
		}),
	),
);
