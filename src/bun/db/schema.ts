import { Database } from "bun:sqlite";

const SCHEMA_VERSION = 2;

export function initDatabase(dbPath: string): Database {
	const db = new Database(dbPath, { create: true });

	// WAL mode for better concurrent reads
	db.run("PRAGMA journal_mode = WAL");
	db.run("PRAGMA foreign_keys = ON");

	// Check current version
	db.run(`CREATE TABLE IF NOT EXISTS _schema_version (version INTEGER NOT NULL)`);
	const row = db.query("SELECT version FROM _schema_version LIMIT 1").get() as
		| { version: number }
		| null;
	const currentVersion = row?.version ?? 0;

	if (currentVersion < SCHEMA_VERSION) {
		migrate(db, currentVersion);
	}

	return db;
}

function migrate(db: Database, fromVersion: number) {
	if (fromVersion < 1) {
		db.run(`
			CREATE TABLE IF NOT EXISTS captures (
				id TEXT PRIMARY KEY,
				image_path TEXT NOT NULL,
				text TEXT NOT NULL DEFAULT '',
				text_normalized TEXT NOT NULL DEFAULT '',
				mode TEXT NOT NULL DEFAULT 'fullscreen',
				region_x INTEGER,
				region_y INTEGER,
				region_w INTEGER,
				region_h INTEGER,
				created_at INTEGER NOT NULL,
				metadata TEXT
			)
		`);

		// FTS5 for fast full-text search
		db.run(`
			CREATE VIRTUAL TABLE IF NOT EXISTS captures_fts
			USING fts5(text, content=captures, content_rowid=rowid)
		`);

		// Triggers to keep FTS in sync
		db.run(`
			CREATE TRIGGER IF NOT EXISTS captures_ai AFTER INSERT ON captures BEGIN
				INSERT INTO captures_fts(rowid, text) VALUES (new.rowid, new.text);
			END
		`);

		db.run(`
			CREATE TRIGGER IF NOT EXISTS captures_ad AFTER DELETE ON captures BEGIN
				INSERT INTO captures_fts(captures_fts, rowid, text) VALUES('delete', old.rowid, old.text);
			END
		`);

		db.run(`
			CREATE TRIGGER IF NOT EXISTS captures_au AFTER UPDATE ON captures BEGIN
				INSERT INTO captures_fts(captures_fts, rowid, text) VALUES('delete', old.rowid, old.text);
				INSERT INTO captures_fts(rowid, text) VALUES (new.rowid, new.text);
			END
		`);

		// Index for fast time-ordered listing
		db.run(`CREATE INDEX IF NOT EXISTS idx_captures_created_at ON captures(created_at DESC)`);

		db.run(`
			CREATE TABLE IF NOT EXISTS presets (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				type TEXT NOT NULL DEFAULT 'plain',
				template TEXT,
				sort_order INTEGER DEFAULT 0
			)
		`);

		// Seed default presets
		const insertPreset = db.prepare(
			"INSERT OR IGNORE INTO presets (id, name, type, sort_order) VALUES (?, ?, ?, ?)",
		);
		insertPreset.run("plain", "Plain", "plain", 0);
		insertPreset.run("raw", "Raw", "raw", 1);
		insertPreset.run("json", "JSON", "json", 2);
		insertPreset.run("yaml", "YAML", "yaml", 3);

		db.run(`
			CREATE TABLE IF NOT EXISTS settings (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL
			)
		`);

	}

	if (fromVersion < 2) {
		// Add sync tracking columns
		db.run(`ALTER TABLE captures ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local'`);
		db.run(`ALTER TABLE captures ADD COLUMN synced_at INTEGER`);
		db.run(`ALTER TABLE captures ADD COLUMN remote_id TEXT`);

		db.run(`CREATE INDEX IF NOT EXISTS idx_captures_sync_status ON captures(sync_status)`);
	}

	// Set version
	db.run("DELETE FROM _schema_version");
	db.run("INSERT INTO _schema_version (version) VALUES (?)", [
		SCHEMA_VERSION,
	]);
}
