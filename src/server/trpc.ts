import { TRPCError, initTRPC } from "@trpc/server";

import { Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
	/**
	 * @see https://trpc.io/docs/v10/data-transformers
	 */
	transformer: superjson,
	/**
	 * @see https://trpc.io/docs/v10/error-formatting
	 */
	errorFormatter({ shape }) {
		return shape;
	},
});

const isAuthed = t.middleware(({ next, ctx }) => {
	const user = ctx.session?.user;

	if (!user?.name) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	return next({
		ctx: {
			user,
		},
	});
});

export const middleware = t.middleware;
export const router = t.router;

/**
 * Unprotected procedure
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure
 */
export const protectedProcedure = t.procedure.use(isAuthed);
export const procedure = t.procedure;

export type { AppRouter } from "./routers/_app";
