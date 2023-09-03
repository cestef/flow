import "@/styles/globals.css";
import "reactflow/dist/style.css";

import { SessionProvider, getSession } from "next-auth/react";

import { CmdK } from "@/components/commands";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trpc } from "@/lib/utils";
import { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import { AppType } from "next/app";
import getConfig from "next/config";
import Head from "next/head";
import Script from "next/script";
import React from "react";
import { ReactFlowProvider } from "reactflow";

const { publicRuntimeConfig } = getConfig();
const { GOOGLE_ANALYTICS_ID } = publicRuntimeConfig;
const isProduction = process.env.NODE_ENV === "production";

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps,
}) => {
	return (
		<SessionProvider session={pageProps.session}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
				<ReactFlowProvider>
					<Toaster />
					<TooltipProvider>
						<Head>
							<title>Flow</title>
						</Head>
						{isProduction && !!GOOGLE_ANALYTICS_ID && (
							<>
								<Script
									src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
								/>
								<Script id="google-analytics">
									{`
                                        window.dataLayer = window.dataLayer || [];
                                        function gtag(){dataLayer.push(arguments);}
                                        gtag('js', new Date());
                                
                                        gtag('config', 'GA_MEASUREMENT_ID');
                                    `}
								</Script>
							</>
						)}
						<CmdK />
						<Component {...pageProps} />
					</TooltipProvider>
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
