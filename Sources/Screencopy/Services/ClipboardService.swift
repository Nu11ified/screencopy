import AppKit

enum ClipboardService {
    static func copy(_ text: String) {
        let pasteboard = NSPasteboard.general
        pasteboard.clearContents()
        pasteboard.setString(text, forType: .string)
    }

    static func copyWithPreset(_ text: String, preset: Preset) {
        let transformed = preset.apply(to: text)
        copy(transformed)
    }

    static func copyLines(_ text: String, lineIndices: Set<Int>) {
        let lines = text.components(separatedBy: "\n")
        let selected = lineIndices.sorted().compactMap { idx -> String? in
            guard idx >= 0, idx < lines.count else { return nil }
            return lines[idx]
        }
        copy(selected.joined(separator: "\n"))
    }
}
