import "@/styles/globals.css";
import "reactflow/dist/style.css";

import { SessionProvider, getSession } from "next-auth/react";

import { Toaster } from "@/components/ui/toaster";
import { trpc } from "@/lib/utils";
import { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import { AppType } from "next/app";
import React from "react";
import { ReactFlowProvider } from "reactflow";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps,
}) => {
	return (
		<SessionProvider session={pageProps.session}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<ReactFlowProvider>
					<Toaster />
					<Component {...pageProps} />
				</ReactFlowProvider>
			</ThemeProvider>
		</SessionProvider>
	);
};

MyApp.getInitialProps = async ({ ctx }) => {
	return {
		session: await getSession(ctx),
	};
};

export default trpc.withTRPC(MyApp);
