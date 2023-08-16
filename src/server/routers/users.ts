import { protectedProcedure, router } from "../trpc";

import EventEmitter from "events";
import { observable } from "@trpc/server/observable";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const emitters = new Map<string, EventEmitter>();

export const emitter = (id: string): EventEmitter => {
  if (!emitters.has(id)) {
    emitters.set(id, new EventEmitter());
  }

  return emitters.get(id)!;
};

export const usersRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: input.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    }),
  find: protectedProcedure
    .input(
      z.object({
        emailOrName: z.string().optional(),
        id: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!input.emailOrName && !input.id) {
        throw new Error("Must provide emailOrName or id");
      }
      const user = await prisma.user.findMany({
        where: {
          OR: [
            { email: input.emailOrName },
            { name: { search: input.emailOrName } },
            { id: input.id },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    }),
});
