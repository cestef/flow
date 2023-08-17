import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

import { IncomingMessage } from "http";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { getSession } from "next-auth/react";
import ws from "ws";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (
	opts:
		| NodeHTTPCreateContextFnOptions<IncomingMessage, ws>
		| trpcNext.CreateNextContextOptions,
) => {
	console.log("opts", opts);
	const session = await getSession(opts);

	console.log("createContext for", session?.user?.name ?? "unknown user");
	console.log("session", session);
	return {
		session,
	};
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
