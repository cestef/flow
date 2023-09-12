import { EDGES_TYPES, NODES_TYPES } from "../constants";

import { useStore } from "../store";

export const welcomeNodes = [
	{
		id: "1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "Let's get started",
			fontWeight: "bolder",
			handles: [
				{
					id: "a",
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -500, y: 0 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.1",
		type: NODES_TYPES.BUTTON,
		data: {
			label: "Create a new canvas",
			onClick: () => {
				useStore.getState().toggleCreateNewCanvas(true);
			},
		},
		position: { x: -615, y: 150 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.2",
		type: NODES_TYPES.BUTTON,
		data: {
			label: "Select an existing canvas",
			onClick: () => {
				useStore.getState().toggleChooseCanvas(true);
			},
			// disabled: () => useStore.getState().currentCanvasId === "",
		},
		position: { x: -385, y: 150 },
		style: {
			width: 210,
		},
	},
	// {
	// 	id: "2",
	// 	type: NODES_TYPES.BUTTON,
	// 	data: {
	// 		label: "Add new members",
	// 		onClick: () => {
	// 			useStore.getState().toggleAddNewMember(true);
	// 		},
	// 		// disabled: () => useStore.getState().currentCanvasId === "",
	// 	},
	// 	position: { x: -500, y: 300 },
	// 	style: {
	// 		width: 210,
	// 	},
	// },
];

export const welcomeEdges = [
	{
		id: "1->1.1",
		source: "1",
		target: "1.1",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "1->1.2",
		source: "1",
		target: "1.2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	// {
	// 	id: "1.1->2",
	// 	source: "1.1",
	// 	target: "2",
	// 	animated: true,
	// 	type: EDGES_TYPES.DEFAULT,
	// },
	// {
	// 	id: "1.2->2",
	// 	source: "1.2",
	// 	target: "2",
	// 	animated: true,
	// 	type: EDGES_TYPES.DEFAULT,
	// },
];
