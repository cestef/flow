import { publicProcedure, router } from "../trpc";

import { canvasRouter } from "./canvas";
import { edgesRouter } from "./edges";
import { membersRouter } from "./members";
import { nodesRouter } from "./nodes";

export const appRouter = router({
	health: publicProcedure.query(() => "ok"),
	canvas: canvasRouter,
	nodes: nodesRouter,
	edges: edgesRouter,
	members: membersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
