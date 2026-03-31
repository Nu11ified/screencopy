import SwiftUI

struct SettingsPanel: View {
    @EnvironmentObject var captureService: CaptureService
    @EnvironmentObject var storage: StorageService
    @EnvironmentObject var syncService: SyncService

    @State private var showSyncForm = false
    @State private var syncToken = ""
    @State private var syncOrg = ""
    @State private var syncRepo = ""

    var body: some View {
        VStack(spacing: 0) {
            // Shortcuts
            GroupBox {
                VStack(spacing: 4) {
                    shortcutRow("Capture Screen", "⌃⌥C")
                    Divider()
                    shortcutRow("Capture Region", "⌃⌥X")
                    Divider()
                    shortcutRow("Toggle Panel", "⌃⌥S")
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 10)

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
            .padding(.top, 6)

            // GitForge Sync
            GroupBox {
                VStack(spacing: 6) {
                    HStack {
                        Text("GitForge Sync")
                            .font(.system(size: 12, weight: .medium))
                        Spacer()
                    }

                    if syncService.isConfigured {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .font(.system(size: 10))
                            Text("Connected")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                            Spacer()
                            Button("Sync") {
                                Task { _ = await syncService.syncNow() }
                            }
                            .font(.system(size: 10))
                            .disabled(syncService.isSyncing)

                            Button("Disconnect") {
                                syncService.disconnect()
                            }
                            .font(.system(size: 10))
                            .foregroundStyle(.red)
                        }
                        .buttonStyle(.plain)

                        if let result = syncService.lastSyncResult {
                            Text(result)
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                        }
                    } else if showSyncForm {
                        VStack(spacing: 4) {
                            SecureField("Token (gf_...)", text: $syncToken)
                                .textFieldStyle(.roundedBorder)
                                .font(.system(size: 11))
                            HStack(spacing: 4) {
                                TextField("org", text: $syncOrg)
                                    .textFieldStyle(.roundedBorder)
                                    .font(.system(size: 11))
                                Text("/").foregroundStyle(.tertiary)
                                TextField("repo", text: $syncRepo)
                                    .textFieldStyle(.roundedBorder)
                                    .font(.system(size: 11))
                            }
                            HStack {
                                Button("Connect") {
                                    let config = SyncConfig(token: syncToken, org: syncOrg, repo: syncRepo)
                                    syncService.configure(config)
                                    showSyncForm = false
                                    syncToken = ""
                                }
                                .disabled(syncToken.isEmpty || syncOrg.isEmpty || syncRepo.isEmpty)
                                Button("Cancel") { showSyncForm = false }
                            }
                            .font(.system(size: 11))
                            .buttonStyle(.plain)
                        }
                    } else {
                        Button("Connect to GitForge") {
                            showSyncForm = true
                        }
                        .font(.system(size: 11))
                        .buttonStyle(.plain)
                        .foregroundStyle(.blue)
                    }
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 6)

            // About
            GroupBox {
                VStack(spacing: 4) {
                    aboutRow("Version", "0.2.0")
                    Divider()
                    aboutRow("Engine", "Apple Vision + Zig")
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

    private func shortcutRow(_ label: String, _ shortcut: String) -> some View {
        HStack {
            Text(label).font(.system(size: 12))
            Spacer()
            Text(shortcut)
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(.secondary)
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 4))
        }
    }

    private func aboutRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 12))
            Spacer()
            Text(value).font(.system(size: 11)).foregroundStyle(.secondary)
        }
    }
}
