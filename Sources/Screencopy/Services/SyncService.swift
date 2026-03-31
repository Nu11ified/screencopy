import Foundation

struct SyncConfig: Codable {
    var token: String
    var org: String
    var repo: String
    var baseUrl: String

    init(token: String, org: String, repo: String, baseUrl: String = "https://api.gitforge.dev") {
        self.token = token
        self.org = org
        self.repo = repo
        self.baseUrl = baseUrl
    }
}

@MainActor
class SyncService: ObservableObject {
    @Published var isConfigured = false
    @Published var isSyncing = false
    @Published var lastSyncResult: String?

    private var config: SyncConfig?
    private var timer: Timer?
    private weak var storage: StorageService?
    private let storageDir: String

    init(storage: StorageService) {
        self.storage = storage
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        self.storageDir = "\(home)/Documents/Screencopy"

        // Load saved config
        if let saved = storage.getSetting("gitforge_config"),
           let data = saved.data(using: .utf8),
           let cfg = try? JSONDecoder().decode(SyncConfig.self, from: data) {
            self.config = cfg
            self.isConfigured = true
            startAutoSync()
        }
    }

    func configure(_ config: SyncConfig) {
        self.config = config
        self.isConfigured = true

        if let data = try? JSONEncoder().encode(config),
           let json = String(data: data, encoding: .utf8) {
            storage?.setSetting("gitforge_config", json)
        }

        startAutoSync()
        print("[Sync] Configured: \(config.org)/\(config.repo)")
    }

    func disconnect() {
        stopAutoSync()
        config = nil
        isConfigured = false
        storage?.setSetting("gitforge_config", "")
        print("[Sync] Disconnected")
    }

    func syncNow() async -> (synced: Int, errors: Int) {
        guard let config = config, let storage = storage else {
            return (0, 0)
        }

        isSyncing = true
        defer { isSyncing = false }

        let unsynced = storage.getUnsynced()
        var synced = 0
        var errors = 0

        for capture in unsynced {
            do {
                try await pushCapture(capture, config: config)
                storage.markSynced(id: capture.id, remoteId: capture.id)
                synced += 1
            } catch {
                print("[Sync] Error syncing \(capture.id): \(error)")
                errors += 1
            }
        }

        if synced > 0 {
            lastSyncResult = "Synced \(synced) captures"
        } else if errors > 0 {
            lastSyncResult = "\(errors) sync errors"
        }

        // Clear result after 3s
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) { [weak self] in
            self?.lastSyncResult = nil
        }

        return (synced, errors)
    }

    private func pushCapture(_ capture: Capture, config: SyncConfig) async throws {
        let imagePath = "\(storageDir)/\(capture.imagePath)"
        let imageData = try Data(contentsOf: URL(fileURLWithPath: imagePath))
        let imageBase64 = imageData.base64EncodedString()

        let captureData: [String: Any] = [
            "id": capture.id,
            "text": capture.text,
            "mode": capture.mode.rawValue,
            "createdAt": capture.createdAt.timeIntervalSince1970 * 1000,
        ]
        let captureJson = try JSONSerialization.data(withJSONObject: captureData, options: .prettyPrinted)

        let payload: [String: Any] = [
            "branch": "main",
            "message": "capture: \(capture.id) (\(capture.mode.rawValue))",
            "files": [
                ["path": "captures/\(capture.id).json", "content": String(data: captureJson, encoding: .utf8)!, "encoding": "utf-8"],
                ["path": "images/\(capture.id).png", "content": imageBase64, "encoding": "base64"],
            ]
        ]

        let url = URL(string: "\(config.baseUrl)/api/repos/\(config.org)/\(config.repo)/commits")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(config.token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw SyncError.apiError
        }
    }

    func startAutoSync(interval: TimeInterval = 30) {
        stopAutoSync()
        timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                _ = await self?.syncNow()
            }
        }
    }

    func stopAutoSync() {
        timer?.invalidate()
        timer = nil
    }

    enum SyncError: Error {
        case apiError
    }
}
