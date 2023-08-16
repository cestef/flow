import NextAuth, { NextAuthOptions } from "next-auth";

import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
	providers: [
		GithubProvider({
			clientId: process.env.GITHUB_ID!,
			clientSecret: process.env.GITHUB_SECRET!,
			profile(profile) {
				return {
					id: profile.id,
					name: profile.name,
					email: profile.email,
					image: profile.avatar_url,
				};
			},
		}),
	],
	callbacks: {
		session: async ({ session, user }) => {
			session.user.id = user.id;
			return Promise.resolve(session);
		},
	},
	adapter: PrismaAdapter(prisma) as any,
	pages: {
		signIn: "/auth/login",
	},
};

const authHandler = NextAuth(authOptions);
export default async function handler(...params: any[]) {
	await authHandler(...params);
}
