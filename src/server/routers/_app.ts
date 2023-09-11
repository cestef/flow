import { publicProcedure, router } from "../trpc";

import { exec as e } from "child_process";
import { promisify } from "util";
import { canvasRouter } from "./canvas";
import { commentsRouter } from "./comments";
import { edgesRouter } from "./edges";
import { invitesRouter } from "./invites";
import { membersRouter } from "./members";
import { nodesRouter } from "./nodes";
import { usersRouter } from "./users";
const exec = promisify(e);

const version = require("../../../package.json").version;

const getLastCommit = async () => {
	const { stdout } = await exec("git rev-parse --short HEAD");
	return stdout.trim();
};

export const appRouter = router({
	health: publicProcedure.query(() => "ok"),
	version: publicProcedure.query(async () => ({
		version,
		commit: await getLastCommit(),
	})),
	canvas: canvasRouter,
	nodes: nodesRouter,
	edges: edgesRouter,
	members: membersRouter,
	users: usersRouter,
	invites: invitesRouter,
	comments: commentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
