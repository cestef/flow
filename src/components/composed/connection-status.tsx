import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { TypeAnimation } from "react-type-animation";

export default function ConnectionStatus() {
	const [isOnline, setIsOnline] = useState(true);
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);
	return (
		<Dialog open={!isOnline}>
			<DialogContent
				closeButton={false}
				className="bg-transparent border-none shadow-none p-0 flex flex-col items-center justify-center outline-none"
			>
				<h1 className="text-4xl font-bold text-center flex justify-between mb-6 ml-[1.5em]">
					Reconnecting
					<TypeAnimation
						cursor={false}
						sequence={[
							"",
							1000,
							".",
							1000,
							"..",
							1000,
							"...",
							1000,
							"..",
							1000,
							".",
							1000,
						]}
						repeat={Infinity}
						speed={1}
						className="w-[1.5em] text-left"
					/>
				</h1>
				<Loader2 className="animate-spin h-14 w-14" />
			</DialogContent>
		</Dialog>
	);
}
