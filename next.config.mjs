import million from "million/compiler";

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	publicRuntimeConfig: {
		// Will be available on both server and client
		APP_URL: process.env.APP_URL,
		WS_URL: process.env.WS_URL,
	},
};

const millionConfig = {
	auto: true,
	// if you're using RSC:
	// auto: { rsc: true },
};

// export default million.next(nextConfig, millionConfig);
export default nextConfig;
