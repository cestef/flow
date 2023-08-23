import { publicProcedure, router } from "../trpc";

import { canvasRouter } from "./canvas";
import { edgesRouter } from "./edges";
import { invitesRouter } from "./invites";
import { membersRouter } from "./members";
import { nodesRouter } from "./nodes";
import { usersRouter } from "./users";

export const appRouter = router({
	health: publicProcedure.query(() => "ok"),
	canvas: canvasRouter,
	nodes: nodesRouter,
	edges: edgesRouter,
	members: membersRouter,
	users: usersRouter,
	invites: invitesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
