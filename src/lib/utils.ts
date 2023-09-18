import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React, { useCallback } from "react";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

import { Canvas, Member } from "@prisma/client";
import { useStore } from "./store";

export const canAccessCanvas = (
	canvas: (Canvas & { members: Member[] }) | null,
	userId: string,
	permission?: "view" | "edit" | "owner",
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
			(!permission || hasPermission(member.permission, permission)),
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

const COLORS = [
	"#0081a7",
	"#00afb9",
	"#f07167",
	"#2a9d8f",
	"#e9c46a",
	"#f4a261",
	"#c8b6ff",
	"#e7c6ff",
	"#bbd0ff",
	"#e63946",
	"#6a994e",
	"#a7c957",
];

export const getRandomHexColor = () => {
	return COLORS[Math.floor(Math.random() * COLORS.length)];
};

export const shallowMerge = <T extends Record<string, unknown>>(a: T, b: Partial<T>): T => {
	return Object.entries(b).reduce((acc, [key, value]) => {
		if (typeof value === "object" && value !== null) {
			return {
				...acc,
				[key]: shallowMerge((acc[key] ?? {}) as T, value as Partial<T>),
			};
		}

		return {
			...acc,
			[key]: value,
		};
	}, a);
};

export const shallowEqual = <T extends Record<string, unknown>>(a: T, b: T): boolean => {
	return Object.entries(a).every(([key, value]) => {
		if (typeof value === "object" && value !== null) {
			return shallowEqual(value as T, b[key] as T);
		}

		return value === b[key];
	});
};

export const shallowDiff = <T extends Record<string, unknown>>(a: T, b: T): Partial<T> => {
	return Object.entries(a).reduce((acc, [key, value]) => {
		if (typeof value === "object" && value !== null) {
			return {
				...acc,
				[key]: shallowDiff(value as T, b[key] as T),
			};
		}

		return {
			...acc,
			[key]: value === b[key] ? undefined : value,
		};
	}, {} as Partial<T>);
};

export const generateId = (length: number = 16) => nanoid(length);
export const useEditing = (id: string) => {
	const setEditing = useStore((state) => state.setEditing);
	const editing = useStore((state) => state.editing[id]) ?? { type: null };

	const stop = () => setEditing(id, null);
	const update = (data: any) => setEditing(id, editing.type, data);

	return {
		editing,
		setEditing,
		stop,
		update,
	};
};
