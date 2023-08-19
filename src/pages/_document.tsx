import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta
					name="description"
					content="Flow is a collaborative diagramming tool"
				/>
				<meta name="theme-color" content="#004F30" />
				<meta name="color-scheme" content="dark light" />
				<meta name="og:title" content="Flow" />
				<meta
					name="og:description"
					content="Flow is a collaborative diagramming tool"
				/>
				<meta name="og:image" content="/icon.png" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
