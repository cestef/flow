import { Edge, Node } from "reactflow";
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

export enum CommandTypes {
	CREATE_NODE = "CREATE_NODE",
	CREATE_EDGE = "CREATE_EDGE",
	DELETE_NODE = "DELETE_NODE",
	DELETE_EDGE = "DELETE_EDGE",
	MOVE_NODE = "MOVE_NODE",
	RESIZE_NODE = "RESIZE_NODE",
	CLEAR_CANVAS = "CLEAR_CANVAS",
}

export interface Command {
	type: CommandTypes;
	payload: any;
}

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
			clipboard: {
				nodes: [] as Node[],
				edges: [] as Edge[],
			},
			selected: {
				nodes: [] as Node[],
				edges: [] as Edge[],
			},
			history: {
				past: [] as Command[],
				present: {} as Command,
				future: [] as Command[],
			},
			settingsOpen: false,
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
			do: (command: Command) =>
				set((state) => {
					const { past, present } = state.history;
					return {
						history: {
							past: [...past, present],
							present: command,
							future: [],
						},
					};
				}),
			undo: () =>
				set((state) => {
					const { past, present, future } = state.history;
					const previous = past[past.length - 1];
					const newPast = past.slice(0, past.length - 1);
					return {
						history: {
							past: newPast,
							present: previous,
							future: [present, ...future],
						},
					};
				}),
			redo: () =>
				set((state) => {
					const { past, present, future } = state.history;
					const next = future[0];
					const newFuture = future.slice(1);
					return {
						history: {
							past: [...past, present],
							present: next,
							future: newFuture,
						},
					};
				}),
			setSettingsOpen: (settingsOpen: boolean) => set({ settingsOpen }),
		}),
	),
);
