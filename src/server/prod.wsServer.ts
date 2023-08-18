import http from "http";
import { parse } from "url";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { createContext } from "./context";
import { appRouter } from "./routers/_app";

const port = parseInt(process.env.PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";

const server = http.createServer((req, res) => {
	const proto = req.headers["x-forwarded-proto"];
	if (proto && proto === "http") {
		// redirect to ssl
		res.writeHead(303, {
			location: `https://${req.headers.host}${req.headers.url ?? ""}`,
		});
		res.end();
		return;
	}
});
const wss = new ws.Server({ server });
const handler = applyWSSHandler({ wss, router: appRouter, createContext });

process.on("SIGTERM", () => {
	console.log("SIGTERM");
	handler.broadcastReconnectNotification();
});
server.listen(port);

console.log(
	`> Server listening at http://localhost:${port} as ${
		dev ? "development" : process.env.NODE_ENV
	}`,
);
