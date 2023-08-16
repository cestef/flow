/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	publicRuntimeConfig: {
		// Will be available on both server and client
		APP_URL: process.env.APP_URL,
		WS_URL: process.env.WS_URL,
	},
};

module.exports = nextConfig;
