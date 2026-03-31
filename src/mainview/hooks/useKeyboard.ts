import { useEffect, useCallback } from "react";

type KeyHandler = (e: KeyboardEvent) => void;

export function useKeyboard(handlers: Record<string, KeyHandler>, deps: unknown[] = []) {
	const handler = useCallback(
		(e: KeyboardEvent) => {
			const key = buildKey(e);
			if (handlers[key]) {
				e.preventDefault();
				handlers[key](e);
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		deps,
	);

	useEffect(() => {
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handler]);
}

function buildKey(e: KeyboardEvent): string {
	const parts: string[] = [];
	if (e.metaKey) parts.push("cmd");
	if (e.ctrlKey) parts.push("ctrl");
	if (e.shiftKey) parts.push("shift");
	if (e.altKey) parts.push("alt");
	parts.push(e.key.toLowerCase());
	return parts.join("+");
}
