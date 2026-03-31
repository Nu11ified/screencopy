import Foundation

enum CaptureMode: String, Codable {
    case fullscreen
    case window
    case region
}

enum SyncStatus: String, Codable {
    case local
    case pending
    case synced
    case error
}

struct Capture: Identifiable, Codable {
    let id: String
    let imagePath: String
    let text: String
    let textNormalized: String
    let mode: CaptureMode
    let regionX: Int?
    let regionY: Int?
    let regionW: Int?
    let regionH: Int?
    let createdAt: Date
    var syncStatus: SyncStatus
    var syncedAt: Date?
    var remoteId: String?

    var textPreview: String {
        let clean = text.replacingOccurrences(of: "\n", with: " ")
        return String(clean.prefix(100))
    }

    var timeAgo: String {
        let interval = Date().timeIntervalSince(createdAt)
        if interval < 60 { return "just now" }
        if interval < 3600 { return "\(Int(interval / 60))m ago" }
        if interval < 86400 { return "\(Int(interval / 3600))h ago" }
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter.string(from: createdAt)
    }

    // Generate a ULID
    static func newId() -> String {
        let encoding = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
        let chars = Array(encoding)
        var id = ""
        var t = UInt64(Date().timeIntervalSince1970 * 1000)
        for _ in 0..<10 {
            id = String(chars[Int(t % 32)]) + id
            t /= 32
        }
        for _ in 0..<16 {
            id += String(chars[Int.random(in: 0..<32)])
        }
        return id
    }
}
