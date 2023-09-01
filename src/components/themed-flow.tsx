import ReactFlow, { Background, Controls, MiniMap } from "reactflow";

import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

// export const MiniMapStyled = styled(MiniMap)`
// 	background-color: ${(props) => props.theme.bg};

// 	.react-flow__minimap-mask {
// 		fill: ${(props) => props.theme.minimapMaskBg};
// 	}

// 	.react-flow__minimap-node {
// 		fill: ${(props) => props.theme.nodeBg};
// 		stroke: none;
// 	}
// `;

// export const ControlsStyled = styled(Controls)`
// 	button {
// 		background-color: ${(props) => props.theme.controlsBg};
// 		color: ${(props) => props.theme.controlsColor};
// 		border-bottom: 1px solid ${(props) => props.theme.controlsBorder};

// 		&:hover {
// 			background-color: ${(props) => props.theme.controlsBgHover};
// 		}

// 		path {
// 			fill: currentColor;
// 		}
// 	}
// `;

export const BackgroundStyled = ({
	className,
	...props
}: React.ComponentProps<typeof Background>) => (
	<Background
		className={cn("bg-background", className)}
		size={1.5}
		{...props}
	/>
);

export const ControlsStyled = ({ ...props }) => (
	<Controls className="bg-foreground text-primary" {...props} />
);

export const MiniMapStyled = ({ ...props }) => (
	<MiniMap className="bg-background" {...props} />
);

export const ReactFlowStyled = ({
	...props
}: ComponentProps<typeof ReactFlow>) => (
	<ReactFlow className="bg-background" {...props} />
);
