import React, { memo } from "react";

//@ts-ignore
import twemoji from "twemoji";

const Twemoji = ({ emoji }: { emoji: string }) => {
	return (
		<span
			className="inline-block w-6 h-6 align-text-bottom"
			// rome-ignore lint/security/noDangerouslySetInnerHtml: Need to use dangerouslySetInnerHTML to render twemoji
			dangerouslySetInnerHTML={{
				__html: twemoji.parse(emoji, {
					folder: "svg",
					ext: ".svg",
					base: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/",
				}),
			}}
		/>
	);
};

export default memo(Twemoji);
