import million from "million/compiler";
import * as pack from "./package.json" assert { type: "json" };

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	publicRuntimeConfig: {
		// Will be available on both server and client
		APP_URL: process.env.APP_URL,
		WS_URL: process.env.WS_URL,
		GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
		VERSION: pack.default.version,
	},
};

const millionConfig = {
	auto: true,
	// if you're using RSC:
	// auto: { rsc: true },
};

export default million.next(nextConfig, millionConfig);
// export default nextConfig;
