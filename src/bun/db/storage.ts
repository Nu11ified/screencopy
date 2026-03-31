// Pluggable storage interface — SQLite now, GitForge later

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
	createdAt: number; // unix timestamp ms
	metadata?: Record<string, unknown>;
}

export interface Preset {
	id: string;
	name: string;
	type: "plain" | "json" | "yaml" | "raw" | "custom";
	template?: string;
	sortOrder: number;
}

export interface ListOptions {
	limit?: number;
	offset?: number;
	orderBy?: "createdAt";
	order?: "asc" | "desc";
}

export interface StorageBackend {
	saveCapture(capture: Capture): Promise<void>;
	getCapture(id: string): Promise<Capture | null>;
	listCaptures(opts?: ListOptions): Promise<Capture[]>;
	searchCaptures(query: string, limit?: number): Promise<Capture[]>;
	deleteCapture(id: string): Promise<void>;
	getPresets(): Promise<Preset[]>;
	savePreset(preset: Preset): Promise<void>;
	deletePreset(id: string): Promise<void>;
	getSetting(key: string): Promise<string | null>;
	setSetting(key: string, value: string): Promise<void>;
}
