import { useStore } from "@/lib/store";

export default function Panels() {
	const canvasPanelOpen = useStore((state) => state.canvasPanel);
	return <></>;
}
