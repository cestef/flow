import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const { PLUV_INTERNAL_AUTH_URL } = process.env;
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== "GET") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	const { room } = req.query;

	if (typeof room !== "string") {
		res.status(400).json({ error: "Invalid room" });
		return;
	}

	const cookies = req.headers.cookie;

	if (typeof cookies !== "string") {
		res.status(400).json({ error: "Invalid cookies" });
		return;
	}

	console.log("[PLUV_INTERNAL_AUTH_URL]", PLUV_INTERNAL_AUTH_URL);

	const { data } = await axios.get(`${PLUV_INTERNAL_AUTH_URL}?room=${room}`, {
		headers: {
			cookie: cookies,
		},
	});

	res.status(200).send(data);
}
