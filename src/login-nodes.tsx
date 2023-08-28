import { EDGES_TYPES, NODES_TYPES } from "./lib/constants";

import { Button } from "./components/ui/button";
import { signIn } from "next-auth/react";

export const loginNodes = [
	{
		id: "1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "I want to build",
			fontWeight: "bolder",
		},
		position: { x: -500, y: 0 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.1",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A flowchart",
			fontWeight: "bolder",
		},
		position: { x: -730, y: 150 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.2",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A mindmap",
			fontWeight: "bolder",
		},
		position: { x: -500, y: 150 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.3",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "A sandwich",
			fontWeight: "bolder",
		},
		position: { x: -270, y: 150 },
		style: {
			width: 210,
		},
	},
	{
		id: "1.4",
		type: NODES_TYPES.DEFAULT,
		data: {
			label: "You don't need Flow.",
			fontWeight: "bolder",
		},
		position: { x: -270, y: 300 },
		style: {
			width: 210,
		},
	},
	{
		id: "2",
		type: NODES_TYPES.DEFAULT,
		data: { label: "I want to collaborate with", fontWeight: "bolder" },
		position: { x: -630, y: 300 },
		style: {
			width: 240,
		},
	},
	{
		id: "2.1",
		type: NODES_TYPES.DEFAULT,
		data: { label: "Friends", fontWeight: "bolder" },
		position: { x: -845, y: 450 },
		style: {
			width: 210,
		},
	},
	{
		id: "2.2",
		type: NODES_TYPES.DEFAULT,
		data: { label: "Teammates", fontWeight: "bolder" },
		position: { x: -615, y: 450 },
		style: {
			width: 210,
		},
	},
	{
		id: "2.3",
		type: NODES_TYPES.DEFAULT,
		data: { label: "My cat", fontWeight: "bolder" },
		position: { x: -385, y: 450 },
		style: {
			width: 210,
		},
	},
	{
		id: "3",
		data: { label: "You need Flow.", fontWeight: "bolder" },
		position: { x: -615, y: 600 },
		type: NODES_TYPES.DEFAULT,
		style: {
			width: 210,
		},
	},
	{
		id: "3.1",
		data: { label: "You need help.", fontWeight: "bolder" },
		position: { x: -270, y: 600 },
		type: NODES_TYPES.DEFAULT,
		style: {
			width: 210,
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
		position: { x: -430, y: 750 },
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
