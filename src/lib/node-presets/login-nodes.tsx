import { EDGES_TYPES, NODES_TYPES } from "../constants";

import { signIn } from "next-auth/react";

export const loginNodes = [
	{
		id: "1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "I want to build",
			fontWeight: "bolder",
			handles: [
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -485, y: 0 },
		style: {
			width: 180,
			height: 50,
		},
	},
	{
		id: "1.1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A flowchart",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -700, y: 125 },
		style: {
			width: 150,
			height: 50,
		},
	},
	{
		id: "1.2",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A mindmap",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -470, y: 125 },
		style: {
			width: 150,
			height: 50,
		},
	},
	{
		id: "1.3",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A sandwich",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -240, y: 125 },
		style: {
			width: 150,
			height: 50,
		},
	},
	{
		id: "1.4",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "You don't need Flow.",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
			],
		},
		position: { x: -270, y: 250 },
		style: {
			width: 210,
			height: 50,
		},
	},
	{
		id: "2",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "I want to collaborate with",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -630, y: 250 },
		style: {
			width: 240,
			height: 50,
		},
	},
	{
		id: "2.1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "Friends",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -735, y: 375 },
		style: {
			width: 100,
			height: 50,
		},
	},
	{
		id: "2.2",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "Teammates",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -585, y: 375 },
		style: {
			width: 150,
			height: 50,
		},
	},
	{
		id: "2.3",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "My cat",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -385, y: 375 },
		style: {
			width: 110,
			height: 50,
		},
	},
	{
		id: "3",
		data: {
			label: "You need Flow.",
			fontWeight: "bolder",
			color: "linear-gradient(45deg, #E11D48 30%, #FF8E53 90%)",
			borderColor: "transparent",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -615, y: 500 },
		type: NODES_TYPES.DEFAULT,
		style: {
			width: 210,
			height: 50,
		},
	},
	{
		id: "3.1",
		data: {
			label: "You need help.",
			fontWeight: "bolder",
			handles: [
				{
					position: "top",
					type: "target",
				},
				{
					position: "bottom",
					type: "source",
				},
			],
		},
		position: { x: -270, y: 500 },
		type: NODES_TYPES.DEFAULT,
		style: {
			width: 210,
			height: 50,
		},
	},
	{
		id: "3.2",
		data: {
			label: "Login",
			onClick: () => {
				signIn();
			},
		},
		position: { x: -430, y: 625 },
		type: NODES_TYPES.BUTTON,
		style: {
			width: 210,
		},
	},
];

export const loginEdges = [
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
	{
		id: "1->1.3",
		source: "1",
		target: "1.3",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "1.1->2",
		source: "1.1",
		target: "2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "1.2->2",
		source: "1.2",
		target: "2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2->2.1",
		source: "2",
		target: "2.1",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2->2.2",
		source: "2",
		target: "2.2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2->2.3",
		source: "2",
		target: "2.3",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2.1->3",
		source: "2.1",
		target: "3",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2.2->3",
		source: "2.2",
		target: "3",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2.3->3",
		source: "2.3",
		target: "3",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "1.3->1.4",
		source: "1.3",
		target: "1.4",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "2.3->3.1",
		source: "2.3",
		target: "3.1",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "3->3.2",
		source: "3",
		target: "3.2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
	{
		id: "3.1->3.2",
		source: "3.1",
		target: "3.2",
		animated: true,
		type: EDGES_TYPES.DEFAULT,
	},
];
