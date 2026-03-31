const API_BASE = "http://localhost:47932";

export interface Capture {
	id: string;
	imagePath: string;
	text: string;
	textNormalized: string;
	mode: "fullscreen" | "window" | "region";
	regionX?: number;
	regionY?: number;
	regionW?: number;
	regionH?: number;
	createdAt: number;
	metadata?: Record<string, unknown>;
}

export interface Preset {
	id: string;
	name: string;
	type: "plain" | "json" | "yaml" | "raw" | "custom";
	template?: string;
	sortOrder: number;
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { "Content-Type": "application/json" },
		...opts,
	});
	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error ?? "Request failed");
	}
	return res.json();
}

export const api = {
	startRegionCapture() {
		return request<{ ok: boolean }>("/api/capture/region", { method: "POST" });
	},

	capture(mode: string = "fullscreen", region?: { x: number; y: number; width: number; height: number }) {
		return request<Capture>("/api/capture", {
			method: "POST",
			body: JSON.stringify({ mode, region }),
		});
	},

	listCaptures(query?: string, limit = 50, offset = 0) {
		const params = new URLSearchParams();
		if (query) params.set("q", query);
		params.set("limit", String(limit));
		params.set("offset", String(offset));
		return request<Capture[]>(`/api/captures?${params}`);
	},

	getCapture(id: string) {
		return request<Capture>(`/api/captures/${id}`);
	},

	deleteCapture(id: string) {
		return request<{ ok: boolean }>(`/api/captures/${id}`, { method: "DELETE" });
	},

	getImageUrl(id: string) {
		return `${API_BASE}/api/captures/${id}/image`;
	},

	copyCapture(id: string, preset = "plain") {
		return request<{ text: string }>(`/api/captures/${id}/copy`, {
			method: "POST",
			body: JSON.stringify({ preset }),
		});
	},

	getPresets() {
		return request<Preset[]>("/api/presets");
	},

	// Storage
	openStorageFolder() {
		return request<{ ok: boolean }>("/api/storage/open", { method: "POST" });
	},

	// Shortcuts
	getShortcuts() {
		return request<Record<string, string>>("/api/shortcuts");
	},

	updateShortcuts(config: Record<string, string>) {
		return request<{ ok: boolean }>("/api/shortcuts", {
			method: "PUT",
			body: JSON.stringify(config),
		});
	},

	// Sync
	getSyncStatus() {
		return request<{ configured: boolean; org: string | null; repo: string | null }>("/api/sync/status");
	},

	configureSyncService(token: string, org: string, repo: string) {
		return request<{ ok: boolean }>("/api/sync/configure", {
			method: "POST",
			body: JSON.stringify({ token, org, repo }),
		});
	},

	disconnectSync() {
		return request<{ ok: boolean }>("/api/sync/disconnect", { method: "POST" });
	},

	syncNow() {
		return request<{ synced: number; errors: number }>("/api/sync/now", { method: "POST" });
	},

	quit() {
		return fetch(`${API_BASE}/api/quit`, { method: "POST" }).catch(() => {});
	},
};
