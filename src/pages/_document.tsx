import { Html, Head, Main, NextScript } from "next/document";
import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { UMAMI_WEBSITE_ID } = publicRuntimeConfig;
export default function Document() {
	return (
		<Html lang="en">
			<Head>
				{UMAMI_WEBSITE_ID && (
					<script
						async
						src="https://analytics.umami.is/script.js"
						data-website-id={UMAMI_WEBSITE_ID}
					/>
				)}
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
