import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { useCallback } from "react";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
import { Canvas, Member } from "@prisma/client";

export const canAccessCanvas = (
	canvas: (Canvas & { members: Member[] }) | null,
	userId: string,
	permission?: "view" | "edit" | "owner"
) => {
	if (!canvas) {
		return false;
	}

	if (canvas.ownerId === userId) {
		return true;
	}

	return canvas.members.some(
		(member) =>
			member.userId === userId &&
			(!permission || hasPermission(member.permission, permission))
	);
};

export const SUB_PERMISSIONS: {
	[key: string]: string[];
} = {
	owner: ["view", "edit"],
	edit: ["view"],
	view: [],
};

export const hasPermission = (permission: string, needed: "edit" | "view" | "owner") => {
	return permission === needed || SUB_PERMISSIONS[permission]?.includes(needed);
};

export const useForceUpdate = (): (() => void) => {
	const [, dispatch] = React.useState<{}>(Object.create(null));

	return useCallback(() => dispatch(Object.create(null)), [dispatch]);
};

export const getRandomHexColor = () => {
	return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};
export const shallowMerge = <T extends Record<string, unknown>>(a: T, b: Partial<T>): T => {
	return Object.entries(b).reduce((acc, [key, value]) => {
		if (typeof value === "object" && value !== null) {
			return {
				...acc,
				[key]: {
					...(acc[key] ?? {}),
					...value,
				},
			};
		}

		return {
			...acc,
			[key]: value,
		};
	}, a);
};
