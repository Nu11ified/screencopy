import SwiftUI

struct DetailView: View {
    let capture: Capture
    let onBack: () -> Void

    @State private var selectedLines: Set<Int> = []
    @State private var copiedPreset: String?

    private var lines: [String] {
        capture.text.components(separatedBy: "\n")
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button {
                    onBack()
                } label: {
                    HStack(spacing: 2) {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 11))
                        Text("Back")
                            .font(.system(size: 13))
                    }
                    .foregroundStyle(.blue)
                }
                .buttonStyle(.plain)

                Spacer()

                Text(capture.timeAgo)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 12)
            .padding(.top, 10)
            .padding(.bottom, 6)

            // Image
            if let image = NSImage(contentsOfFile: fullPath) {
                Image(nsImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .padding(.horizontal, 12)
            }

            Divider().padding(.horizontal, 16).padding(.vertical, 4)

            // Text with line selection
            Text("TEXT")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 2)

            ScrollView {
                VStack(spacing: 0) {
                    ForEach(Array(lines.enumerated()), id: \.offset) { idx, line in
                        if !line.trimmingCharacters(in: .whitespaces).isEmpty {
                            HStack(spacing: 0) {
                                Text(line)
                                    .font(.system(size: 11, design: .monospaced))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                            }
                            .background(
                                selectedLines.contains(idx)
                                    ? Color.blue.opacity(0.12)
                                    : Color.clear
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                            .contentShape(Rectangle())
                            .onTapGesture {
                                if selectedLines.contains(idx) {
                                    selectedLines.remove(idx)
                                } else {
                                    selectedLines.insert(idx)
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 12)
            }
            .frame(maxHeight: 120)

            if !selectedLines.isEmpty {
                Text("\(selectedLines.count) line\(selectedLines.count == 1 ? "" : "s") selected")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.top, 2)
            }

            Divider().padding(.horizontal, 16).padding(.vertical, 4)

            // Preset buttons
            Text("COPY AS")
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 4)

            HStack(spacing: 4) {
                // Copy selected / all
                Button {
                    if selectedLines.isEmpty {
                        ClipboardService.copy(capture.text)
                    } else {
                        ClipboardService.copyLines(capture.text, lineIndices: selectedLines)
                    }
                    flash("copy")
                } label: {
                    Text(selectedLines.isEmpty ? "All" : "Selected")
                        .font(.system(size: 10, weight: .medium))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 5)
                        .background(copiedPreset == "copy" ? Color.green.opacity(0.15) : Color.secondary.opacity(0.08))
                        .foregroundStyle(copiedPreset == "copy" ? .green : .primary)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                .buttonStyle(.plain)

                ForEach(Preset.defaults, id: \.id) { preset in
                    Button {
                        let text = selectedLines.isEmpty ? capture.text : selectedLinesText
                        ClipboardService.copyWithPreset(text, preset: preset)
                        flash(preset.id)
                    } label: {
                        HStack(spacing: 2) {
                            if let key = preset.shortcutKey {
                                Text(key)
                                    .font(.system(size: 8, weight: .bold, design: .monospaced))
                                    .foregroundStyle(.tertiary)
                            }
                            Text(copiedPreset == preset.id ? "✓" : preset.name)
                                .font(.system(size: 10, weight: .medium))
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 5)
                        .background(copiedPreset == preset.id ? Color.green.opacity(0.15) : Color.secondary.opacity(0.08))
                        .foregroundStyle(copiedPreset == preset.id ? .green : .primary)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 10)
        }
    }

    private var fullPath: String {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return "\(home)/Documents/Screencopy/\(capture.imagePath)"
    }

    private var selectedLinesText: String {
        let allLines = capture.text.components(separatedBy: "\n")
        return selectedLines.sorted().compactMap { idx -> String? in
            guard idx >= 0, idx < allLines.count else { return nil }
            return allLines[idx]
        }.joined(separator: "\n")
    }

    private func flash(_ id: String) {
        copiedPreset = id
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            if copiedPreset == id { copiedPreset = nil }
        }
    }
}
