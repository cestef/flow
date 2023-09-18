import { memo } from "react";
import { NodeProps } from "reactflow";

const PreviewNode = ({ data: { label } }: NodeProps) => {
	return (
		<div className="outline outline-1 rounded-md p-4 text-center flex items-center justify-center outline-stone-500 bg-accent">
			{label}
		</div>
	);
};

export default memo(PreviewNode);
