import SwiftUI

enum Tab: String, CaseIterable {
    case capture = "Capture"
    case history = "History"
    case settings = "Settings"

    var icon: String {
        switch self {
        case .capture: return "camera.fill"
        case .history: return "clock.fill"
        case .settings: return "gear"
        }
    }
}

struct MenuBarView: View {
    @EnvironmentObject var captureService: CaptureService
    @EnvironmentObject var storage: StorageService
    @State private var selectedTab: Tab = .capture
    @State private var selectedCapture: Capture?

    var body: some View {
        VStack(spacing: 0) {
            if let capture = selectedCapture {
                DetailView(capture: capture) {
                    selectedCapture = nil
                }
            } else {
                switch selectedTab {
                case .capture:
                    CapturePanel()
                case .history:
                    HistoryView(onSelect: { selectedCapture = $0 })
                case .settings:
                    SettingsPanel()
                }

                Divider()

                HStack(spacing: 0) {
                    ForEach(Tab.allCases, id: \.self) { tab in
                        Button {
                            selectedTab = tab
                        } label: {
                            VStack(spacing: 2) {
                                Image(systemName: tab.icon)
                                    .font(.system(size: 12))
                                Text(tab.rawValue)
                                    .font(.system(size: 9, weight: .medium))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                            .foregroundStyle(selectedTab == tab ? .blue : .secondary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 4)
                .padding(.bottom, 4)
            }
        }
        .frame(width: 320)
    }
}

struct CapturePanel: View {
    @EnvironmentObject var captureService: CaptureService
    @EnvironmentObject var storage: StorageService
    @State private var copied = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Screencopy")
                    .font(.system(size: 14, weight: .semibold))
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.top, 14)
            .padding(.bottom, 8)

            Divider().padding(.horizontal, 16)

            VStack(spacing: 6) {
                Button {
                    Task {
                        if let capture = await captureService.captureFullscreen() {
                            storage.saveCapture(capture)
                            ClipboardService.copyWithPreset(capture.text, preset: Preset.defaults[0])
                            copied = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "desktopcomputer")
                        Text("Capture Fullscreen")
                        Spacer()
                        if captureService.isCapturing {
                            ProgressView().controlSize(.small)
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
                .disabled(captureService.isCapturing)

                Button {
                    // TODO: Region capture
                } label: {
                    HStack {
                        Image(systemName: "crop")
                        Text("Capture Region")
                        Spacer()
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(.secondary.opacity(0.06), in: RoundedRectangle(cornerRadius: 8))
                }
                .buttonStyle(.plain)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)

            if let capture = captureService.lastCapture {
                Divider().padding(.horizontal, 16)

                VStack(alignment: .leading, spacing: 4) {
                    Text("LAST CAPTURE")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(.secondary)

                    Text(capture.text.isEmpty ? "(no text detected)" : capture.text)
                        .font(.system(size: 11, design: .monospaced))
                        .lineLimit(4)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                        .background(.secondary.opacity(0.06), in: RoundedRectangle(cornerRadius: 6))

                    HStack {
                        Text("\(capture.text.count) chars")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                        Spacer()
                        if copied {
                            Text("Copied!")
                                .font(.caption2)
                                .foregroundStyle(.green)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            }
        }
    }
}
