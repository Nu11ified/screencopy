import { useState, useEffect, useCallback } from "react";
import { api, type Capture } from "../lib/api";

export function useCaptures() {
	const [captures, setCaptures] = useState<Capture[]>([]);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");

	const refresh = useCallback(async () => {
		setLoading(true);
		try {
			const data = query
				? await api.listCaptures(query)
				: await api.listCaptures();
			setCaptures(data);
		} catch (err) {
			console.error("Failed to load captures:", err);
		} finally {
			setLoading(false);
		}
	}, [query]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const search = useCallback((q: string) => {
		setQuery(q);
	}, []);

	const deleteCapture = useCallback(
		async (id: string) => {
			await api.deleteCapture(id);
			await refresh();
		},
		[refresh],
	);

	return { captures, loading, query, search, refresh, deleteCapture };
}
