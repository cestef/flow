"use-client";

import { ThemeProvider } from "@/components/providers/theme";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PluvProvider } from "@/lib/pluv/bundle";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	return (
		<SessionProvider session={session}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<ReactFlowProvider>
					<PluvProvider>
						<TooltipProvider>
							<Head>
								<title>Flow</title>
							</Head>
							<Toaster />
							<Component {...pageProps} />
						</TooltipProvider>
					</PluvProvider>
				</ReactFlowProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}
// clmi15v3v0006v8h5lwwolffv
