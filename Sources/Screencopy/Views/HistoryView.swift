import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var storage: StorageService
    @State private var searchQuery = ""
    @State private var selectedIdx = 0
    var onSelect: (Capture) -> Void

    private var results: [Capture] {
        if searchQuery.isEmpty {
            return storage.captures
        }
        return storage.search(searchQuery)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Search
            HStack(spacing: 6) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.tertiary)
                    .font(.system(size: 12))
                TextField("Search captures...", text: $searchQuery)
                    .textFieldStyle(.plain)
                    .font(.system(size: 13))
                if !searchQuery.isEmpty {
                    Button {
                        searchQuery = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.tertiary)
                            .font(.system(size: 11))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.secondary.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
            .padding(.horizontal, 12)
            .padding(.top, 10)
            .padding(.bottom, 4)

            if results.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: searchQuery.isEmpty ? "camera" : "magnifyingglass")
                        .font(.system(size: 24))
                        .foregroundStyle(.quaternary)
                    Text(searchQuery.isEmpty ? "No captures yet" : "No results")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                ScrollView {
                    LazyVStack(spacing: 2) {
                        ForEach(Array(results.enumerated()), id: \.element.id) { idx, capture in
                            HistoryRow(capture: capture, isSelected: idx == selectedIdx)
                                .onTapGesture { onSelect(capture) }
                        }
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                }
                .frame(maxHeight: 300)

                HStack(spacing: 4) {
                    Text("\(results.count) captures")
                        .font(.system(size: 9))
                        .foregroundStyle(.quaternary)
                }
                .padding(.bottom, 4)
            }
        }
    }
}

struct HistoryRow: View {
    let capture: Capture
    var isSelected: Bool = false

    var body: some View {
        HStack(spacing: 10) {
            if let image = NSImage(contentsOfFile: fullPath) {
                Image(nsImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 44, height: 32)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
            } else {
                RoundedRectangle(cornerRadius: 4)
                    .fill(.secondary.opacity(0.1))
                    .frame(width: 44, height: 32)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(capture.textPreview.isEmpty ? "(no text)" : capture.textPreview)
                    .font(.system(size: 11))
                    .lineLimit(1)
                    .truncationMode(.tail)

                HStack(spacing: 6) {
                    Text(capture.mode.rawValue)
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.tertiary)
                        .textCase(.uppercase)
                    Text(capture.timeAgo)
                        .font(.system(size: 9))
                        .foregroundStyle(.quaternary)
                    if capture.syncStatus == .synced {
                        Image(systemName: "checkmark.icloud.fill")
                            .font(.system(size: 8))
                            .foregroundStyle(.green.opacity(0.6))
                    }
                }
            }

            Spacer()
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .contentShape(Rectangle())
    }

    private var fullPath: String {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        return "\(home)/Documents/Screencopy/\(capture.imagePath)"
    }
}
