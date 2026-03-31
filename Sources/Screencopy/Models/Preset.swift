import Foundation

struct Preset: Identifiable {
    let id: String
    let name: String
    let type: PresetType
    let shortcutKey: String? // "1", "2", etc.

    enum PresetType: String {
        case plain, raw, json, yaml, cmd, custom
    }

    func apply(to text: String) -> String {
        switch type {
        case .plain:
            return text.components(separatedBy: .whitespacesAndNewlines)
                .filter { !$0.isEmpty }
                .joined(separator: " ")
        case .raw:
            return text
        case .json:
            if let data = try? JSONSerialization.data(withJSONObject: text, options: .fragmentsAllowed),
               let json = String(data: data, encoding: .utf8) {
                return json
            }
            return "\"\(text.replacingOccurrences(of: "\"", with: "\\\""))\""
        case .yaml:
            return text.components(separatedBy: "\n")
                .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
                .map { "- \"\($0)\"" }
                .joined(separator: "\n")
        case .cmd:
            return text.components(separatedBy: "\n")
                .filter { !$0.trimmingCharacters(in: .whitespaces).isEmpty }
                .joined(separator: " && ")
        case .custom:
            return text
        }
    }

    static let defaults: [Preset] = [
        Preset(id: "plain", name: "Plain", type: .plain, shortcutKey: "1"),
        Preset(id: "raw", name: "Raw", type: .raw, shortcutKey: "2"),
        Preset(id: "json", name: "JSON", type: .json, shortcutKey: "3"),
        Preset(id: "yaml", name: "YAML", type: .yaml, shortcutKey: "4"),
        Preset(id: "cmd", name: "CMD", type: .cmd, shortcutKey: "5"),
    ]
}
