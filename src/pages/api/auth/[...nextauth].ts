import NextAuth, { NextAuthOptions } from "next-auth";

import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
	providers: [
		GithubProvider({
			clientId: process.env.GITHUB_ID!,
			clientSecret: process.env.GITHUB_SECRET!,
			profile(profile) {
				return {
					id: profile.id,
					login: profile.login,
					name: profile.name,
					email: profile.email,
					image: profile.avatar_url,
				} as any;
			},
		}),
		DiscordProvider({
			clientId: process.env.DISCORD_CLIENT_ID!,
			clientSecret: process.env.DISCORD_CLIENT_SECRET!,
			profile(profile) {
				const avatar_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
				return {
					id: profile.id,
					login: profile.username,
					name: profile.username,
					email: profile.email,
					image: avatar_url,
				} as any;
			},
		}),
	],
	callbacks: {
		session: async ({ session, user }) => {
			session.user.id = user.id;
			session.user.login = user.login;
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
