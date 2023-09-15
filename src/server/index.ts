import { createPluvHandler } from "@pluv/platform-node";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import Http from "http";
import { io } from "./io";
import { authenticate } from "./auth";

const app = express();

const server = Http.createServer(app);

const Pluv = createPluvHandler({
	// Your PluvIO instance
	io,
	// Optional: Specify the base path from which endpoints are defined
	endpoint: "/api/pluv", // defaults to "/api/pluv"
	// Your Http.Server instance
	server,
	// If your PluvIO instance defines authorization, add your authorization
	// logic here. Return a user if authorized, return null or throw an error
	// if not authorized.
	async authorize({ req, res, roomId }) {
		try {
			const user = await authenticate(req.headers.cookie, roomId);
			console.log("authorize", user);
			return user;
		} catch (e) {
			console.error(e);
			return null;
		}
	},
});

// Create your WS.Server instance, which listens to "connection" events
Pluv.createWsServer();

app.use(bodyParser.json());
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(Pluv.handler);

server.listen(3001);
