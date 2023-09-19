"use client";

import { y } from "@pluv/react";
import { FC, ReactNode } from "react";
import { PluvRoomProvider } from "../../lib/pluv/bundle";

export interface RoomProviderProps {
	children?: ReactNode;
	initialPresence: {
		color: string;
		x: number;
		y: number;
		grabbing: boolean;
		currentSelected: string[];
		state: "select" | "default" | "grab";
		startX: number;
		startY: number;
	};
	room: string;
}

export const RoomProvider: FC<RoomProviderProps> = ({ children, initialPresence, room }) => {
	return (
		<PluvRoomProvider
			// debug
			initialPresence={initialPresence}
			initialStorage={() => ({
				nodes: y.map(),
				edges: y.map(),
			})}
			room={room}
		>
			{children}
		</PluvRoomProvider>
	);
};
