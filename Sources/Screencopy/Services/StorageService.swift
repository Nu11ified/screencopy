import Foundation
import SQLite3

@MainActor
class StorageService: ObservableObject {
    private var db: OpaquePointer?
    private let storageDir: String

    @Published var captures: [Capture] = []

    init() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        storageDir = "\(home)/Documents/Screencopy"
        try? FileManager.default.createDirectory(atPath: storageDir, withIntermediateDirectories: true)

        let dbPath = "\(storageDir)/screencopy.db"
        guard sqlite3_open(dbPath, &db) == SQLITE_OK else {
            print("Failed to open database at \(dbPath)")
            return
        }

        exec("PRAGMA journal_mode = WAL")
        exec("PRAGMA foreign_keys = ON")
        migrate()
        loadCaptures()
    }

    deinit {
        sqlite3_close(db)
    }

    // MARK: - Schema

    private func migrate() {
        exec("""
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
                created_at REAL NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'local',
                synced_at REAL,
                remote_id TEXT
            )
        """)

        exec("""
            CREATE VIRTUAL TABLE IF NOT EXISTS captures_fts
            USING fts5(text, content=captures, content_rowid=rowid)
        """)

        exec("""
            CREATE TRIGGER IF NOT EXISTS captures_ai AFTER INSERT ON captures BEGIN
                INSERT INTO captures_fts(rowid, text) VALUES (new.rowid, new.text);
            END
        """)

        exec("""
            CREATE TRIGGER IF NOT EXISTS captures_ad AFTER DELETE ON captures BEGIN
                INSERT INTO captures_fts(captures_fts, rowid, text) VALUES('delete', old.rowid, old.text);
            END
        """)

        exec("CREATE INDEX IF NOT EXISTS idx_captures_created ON captures(created_at DESC)")

        exec("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
    }

    // MARK: - Captures

    func saveCapture(_ capture: Capture) {
        let sql = """
            INSERT OR REPLACE INTO captures
            (id, image_path, text, text_normalized, mode, region_x, region_y, region_w, region_h, created_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return }
        defer { sqlite3_finalize(stmt) }

        bind(stmt, 1, capture.id)
        bind(stmt, 2, capture.imagePath)
        bind(stmt, 3, capture.text)
        bind(stmt, 4, capture.textNormalized)
        bind(stmt, 5, capture.mode.rawValue)
        bindOptionalInt(stmt, 6, capture.regionX)
        bindOptionalInt(stmt, 7, capture.regionY)
        bindOptionalInt(stmt, 8, capture.regionW)
        bindOptionalInt(stmt, 9, capture.regionH)
        sqlite3_bind_double(stmt, 10, capture.createdAt.timeIntervalSince1970)
        bind(stmt, 11, capture.syncStatus.rawValue)

        sqlite3_step(stmt)
        loadCaptures()
    }

    func deleteCapture(id: String) {
        exec("DELETE FROM captures WHERE id = '\(id)'")

        // Delete image file
        if let capture = captures.first(where: { $0.id == id }) {
            let path = "\(storageDir)/\(capture.imagePath)"
            try? FileManager.default.removeItem(atPath: path)
        }
        loadCaptures()
    }

    func loadCaptures() {
        captures = query("SELECT * FROM captures ORDER BY created_at DESC LIMIT 200")
    }

    func search(_ query: String) -> [Capture] {
        if query.trimmingCharacters(in: .whitespaces).isEmpty {
            return captures
        }
        // FTS5 search
        return self.query("""
            SELECT c.* FROM captures c
            INNER JOIN captures_fts fts ON c.rowid = fts.rowid
            WHERE captures_fts MATCH '\(query.replacingOccurrences(of: "'", with: "''"))*'
            ORDER BY rank LIMIT 50
        """)
    }

    // MARK: - Settings

    func getSetting(_ key: String) -> String? {
        var stmt: OpaquePointer?
        let sql = "SELECT value FROM settings WHERE key = ?"
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return nil }
        defer { sqlite3_finalize(stmt) }
        bind(stmt, 1, key)
        guard sqlite3_step(stmt) == SQLITE_ROW else { return nil }
        return getString(stmt, 0)
    }

    func setSetting(_ key: String, _ value: String) {
        exec("INSERT OR REPLACE INTO settings (key, value) VALUES ('\(key)', '\(value.replacingOccurrences(of: "'", with: "''"))')")
    }

    // MARK: - Sync helpers

    func getUnsynced() -> [Capture] {
        return query("SELECT * FROM captures WHERE sync_status IN ('local', 'error') ORDER BY created_at ASC")
    }

    func markSynced(id: String, remoteId: String) {
        exec("UPDATE captures SET sync_status = 'synced', synced_at = \(Date().timeIntervalSince1970), remote_id = '\(remoteId)' WHERE id = '\(id)'")
        loadCaptures()
    }

    // MARK: - SQLite helpers

    private func exec(_ sql: String) {
        var err: UnsafeMutablePointer<CChar>?
        sqlite3_exec(db, sql, nil, nil, &err)
        if let err = err {
            print("SQL error: \(String(cString: err))")
            sqlite3_free(err)
        }
    }

    private func query(_ sql: String) -> [Capture] {
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else { return [] }
        defer { sqlite3_finalize(stmt) }

        var results: [Capture] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            let capture = Capture(
                id: getString(stmt, 0) ?? "",
                imagePath: getString(stmt, 1) ?? "",
                text: getString(stmt, 2) ?? "",
                textNormalized: getString(stmt, 3) ?? "",
                mode: CaptureMode(rawValue: getString(stmt, 4) ?? "fullscreen") ?? .fullscreen,
                regionX: getOptionalInt(stmt, 5),
                regionY: getOptionalInt(stmt, 6),
                regionW: getOptionalInt(stmt, 7),
                regionH: getOptionalInt(stmt, 8),
                createdAt: Date(timeIntervalSince1970: sqlite3_column_double(stmt, 9)),
                syncStatus: SyncStatus(rawValue: getString(stmt, 10) ?? "local") ?? .local,
                syncedAt: sqlite3_column_type(stmt, 11) != SQLITE_NULL
                    ? Date(timeIntervalSince1970: sqlite3_column_double(stmt, 11)) : nil,
                remoteId: getString(stmt, 12)
            )
            results.append(capture)
        }
        return results
    }

    private func bind(_ stmt: OpaquePointer?, _ idx: Int32, _ value: String) {
        sqlite3_bind_text(stmt, idx, (value as NSString).utf8String, -1, unsafeBitCast(-1, to: sqlite3_destructor_type.self))
    }

    private func bindOptionalInt(_ stmt: OpaquePointer?, _ idx: Int32, _ value: Int?) {
        if let v = value {
            sqlite3_bind_int(stmt, idx, Int32(v))
        } else {
            sqlite3_bind_null(stmt, idx)
        }
    }

    private func getString(_ stmt: OpaquePointer?, _ idx: Int32) -> String? {
        guard let cStr = sqlite3_column_text(stmt, idx) else { return nil }
        return String(cString: cStr)
    }

    private func getOptionalInt(_ stmt: OpaquePointer?, _ idx: Int32) -> Int? {
        if sqlite3_column_type(stmt, idx) == SQLITE_NULL { return nil }
        return Int(sqlite3_column_int(stmt, idx))
    }
}
