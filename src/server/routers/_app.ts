import { publicProcedure, router } from "../trpc";

import { canvasRouter } from "./canvas";
import { commentsRouter } from "./comments";
import { edgesRouter } from "./edges";
import { invitesRouter } from "./invites";
import { membersRouter } from "./members";
import { nodesRouter } from "./nodes";
import { usersRouter } from "./users";

const version = require("../../../package.json").version;
const getLastCommit = async () => {
	const { exec } = require("child_process");
	const { promisify } = require("util");
	const execAsync = promisify(exec);
	const { stdout } = await execAsync("git rev-parse --short HEAD");
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
