import NextAuth from "next-auth";

declare module "next-auth" {
	interface Session {
		user: User;
	}
	interface User {
		userId: string;
		name: string;
		email: string;
		image: string;
		id: string;
		login: string;
	}
}
