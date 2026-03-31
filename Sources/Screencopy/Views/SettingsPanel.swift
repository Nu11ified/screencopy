import SwiftUI

struct SettingsPanel: View {
    @EnvironmentObject var captureService: CaptureService

    var body: some View {
        VStack(spacing: 0) {
            // Storage
            GroupBox {
                HStack {
                    Text("Storage")
                        .font(.system(size: 12))
                    Spacer()
                    Button("Open Folder") {
                        captureService.openStorageFolder()
                    }
                    .font(.system(size: 11))
                    .buttonStyle(.plain)
                    .foregroundStyle(.blue)
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 10)

            // About
            GroupBox {
                VStack(spacing: 4) {
                    HStack {
                        Text("Version")
                            .font(.system(size: 12))
                        Spacer()
                        Text("0.2.0")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                    Divider()
                    HStack {
                        Text("Engine")
                            .font(.system(size: 12))
                        Spacer()
                        Text("Apple Vision + Zig")
                            .font(.system(size: 11))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            Divider().padding(.horizontal, 16).padding(.vertical, 8)

            Button {
                NSApplication.shared.terminate(nil)
            } label: {
                Text("Quit Screencopy")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 12)
            .padding(.bottom, 8)
        }
    }
}
