import { Database } from "bun:sqlite";
import type {
	Capture,
	Preset,
	ListOptions,
	StorageBackend,
} from "./storage";

export class SQLiteStorage implements StorageBackend {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async saveCapture(capture: Capture): Promise<void> {
		this.db
			.prepare(
				`INSERT OR REPLACE INTO captures
				(id, image_path, text, text_normalized, mode, region_x, region_y, region_w, region_h, created_at, metadata)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			)
			.run(
				capture.id,
				capture.imagePath,
				capture.text,
				capture.textNormalized,
				capture.mode,
				capture.regionX ?? null,
				capture.regionY ?? null,
				capture.regionW ?? null,
				capture.regionH ?? null,
				capture.createdAt,
				capture.metadata ? JSON.stringify(capture.metadata) : null,
			);
	}

	async getCapture(id: string): Promise<Capture | null> {
		const row = this.db
			.prepare("SELECT * FROM captures WHERE id = ?")
			.get(id) as CaptureRow | null;
		return row ? rowToCapture(row) : null;
	}

	async listCaptures(opts?: ListOptions): Promise<Capture[]> {
		const limit = opts?.limit ?? 50;
		const offset = opts?.offset ?? 0;
		const order = opts?.order === "asc" ? "ASC" : "DESC";

		const rows = this.db
			.prepare(
				`SELECT * FROM captures ORDER BY created_at ${order} LIMIT ? OFFSET ?`,
			)
			.all(limit, offset) as CaptureRow[];

		return rows.map(rowToCapture);
	}

	async searchCaptures(query: string, limit = 50): Promise<Capture[]> {
		if (!query.trim()) return this.listCaptures({ limit });

		// Use FTS5 for full-text search
		const rows = this.db
			.prepare(
				`SELECT c.* FROM captures c
				INNER JOIN captures_fts fts ON c.rowid = fts.rowid
				WHERE captures_fts MATCH ?
				ORDER BY rank
				LIMIT ?`,
			)
			.all(query, limit) as CaptureRow[];

		return rows.map(rowToCapture);
	}

	async deleteCapture(id: string): Promise<void> {
		this.db.prepare("DELETE FROM captures WHERE id = ?").run(id);
	}

	async getPresets(): Promise<Preset[]> {
		const rows = this.db
			.prepare("SELECT * FROM presets ORDER BY sort_order ASC")
			.all() as PresetRow[];

		return rows.map((r) => ({
			id: r.id,
			name: r.name,
			type: r.type as Preset["type"],
			template: r.template ?? undefined,
			sortOrder: r.sort_order,
		}));
	}

	async savePreset(preset: Preset): Promise<void> {
		this.db
			.prepare(
				"INSERT OR REPLACE INTO presets (id, name, type, template, sort_order) VALUES (?, ?, ?, ?, ?)",
			)
			.run(preset.id, preset.name, preset.type, preset.template ?? null, preset.sortOrder);
	}

	async getUnsynced(): Promise<Capture[]> {
		const rows = this.db
			.prepare("SELECT * FROM captures WHERE sync_status IN ('local', 'error') ORDER BY created_at ASC")
			.all() as CaptureRow[];
		return rows.map(rowToCapture);
	}

	async markSynced(id: string, remoteId: string): Promise<void> {
		this.db
			.prepare("UPDATE captures SET sync_status = 'synced', synced_at = ?, remote_id = ? WHERE id = ?")
			.run(Date.now(), remoteId, id);
	}

	async markSyncError(id: string): Promise<void> {
		this.db
			.prepare("UPDATE captures SET sync_status = 'error' WHERE id = ?")
			.run(id);
	}

	async deletePreset(id: string): Promise<void> {
		this.db.prepare("DELETE FROM presets WHERE id = ?").run(id);
	}

	async getSetting(key: string): Promise<string | null> {
		const row = this.db
			.prepare("SELECT value FROM settings WHERE key = ?")
			.get(key) as { value: string } | null;
		return row?.value ?? null;
	}

	async setSetting(key: string, value: string): Promise<void> {
		this.db
			.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
			.run(key, value);
	}
}

// Row types from SQLite
interface CaptureRow {
	id: string;
	image_path: string;
	text: string;
	text_normalized: string;
	mode: string;
	region_x: number | null;
	region_y: number | null;
	region_w: number | null;
	region_h: number | null;
	created_at: number;
	metadata: string | null;
	sync_status: string;
	synced_at: number | null;
	remote_id: string | null;
}

interface PresetRow {
	id: string;
	name: string;
	type: string;
	template: string | null;
	sort_order: number;
}

function rowToCapture(row: CaptureRow): Capture {
	return {
		id: row.id,
		imagePath: row.image_path,
		text: row.text,
		textNormalized: row.text_normalized,
		mode: row.mode as Capture["mode"],
		regionX: row.region_x ?? undefined,
		regionY: row.region_y ?? undefined,
		regionW: row.region_w ?? undefined,
		regionH: row.region_h ?? undefined,
		createdAt: row.created_at,
		metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
		syncStatus: (row.sync_status as Capture["syncStatus"]) ?? "local",
		syncedAt: row.synced_at ?? undefined,
		remoteId: row.remote_id ?? undefined,
	};
}
