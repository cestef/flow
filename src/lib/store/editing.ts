import { StateCreator } from "zustand";

export type EditingType = "label" | "color" | null;

export interface EditingSlice {
	editing: {
		[key: string]: {
			type: EditingType;
			data?: any;
		};
	};
	setEditing: (id: string, type: EditingType, data?: any) => void;
}

export const createEditingSlice: StateCreator<EditingSlice> = (set) => ({
	editing: {},
	setEditing: (id, type, data) =>
		set((state) => ({
			editing: {
				...state.editing,
				[id]: {
					type,
					data: data ?? state.editing[id]?.data,
				},
			},
		})),
});
