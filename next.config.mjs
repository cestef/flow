import * as pack from "./package.json" assert { type: "json" };

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	publicRuntimeConfig: {
		// Will be available on both server and client
		APP_URL: process.env.APP_URL,
		WS_URL: process.env.WS_URL,
        PLUV_WS_URL: process.env.PLUV_WS_URL,
        PLUV_AUTH_URL: process.env.PLUV_AUTH_URL,
		GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
		VERSION: pack.default.version,
	},
};

export default nextConfig;
