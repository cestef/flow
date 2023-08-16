export const nodes = [
	{
		id: "1",
		type: "custom",
		data: { label: "Start here..." },
		position: { x: -150, y: 0 },
	},
	{
		id: "2",
		type: "custom",
		data: { label: "...or here!" },
		position: { x: 150, y: 0 },
	},
	{
		id: "3",
		data: { label: "Delete me." },
		position: { x: 0, y: 100 },
		type: "custom",
	},
	{
		id: "4",
		data: { label: "Then me!" },
		position: { x: 0, y: 200 },
		type: "custom",
	},
	{
		id: "5",
		type: "custom",
		data: { label: "End here!" },
		position: { x: 0, y: 300 },
	},
];

export const edges = [
	{ id: "1->3", source: "1", target: "3", animated: true, type: "smoothstep" },
	{ id: "2->3", source: "2", target: "3", animated: true, type: "smoothstep" },
	{ id: "3->4", source: "3", target: "4", animated: true, type: "smoothstep" },
	{ id: "4->5", source: "4", target: "5", animated: true, type: "smoothstep" },
];
