import SwiftUI

@main
struct ScreencopyApp: App {
    @StateObject private var captureService = CaptureService()
    @StateObject private var storage = StorageService()
    @StateObject private var syncService: SyncService
    private let hotkeyService = HotkeyService()

    init() {
        let storageInstance = StorageService()
        _storage = StateObject(wrappedValue: storageInstance)
        _syncService = StateObject(wrappedValue: SyncService(storage: storageInstance))

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [hotkeyService] in
            hotkeyService.registerDefaults(
                onCaptureFullscreen: {
                    print("[Hotkey] Fullscreen capture")
                },
                onCaptureRegion: {
                    print("[Hotkey] Region capture")
                },
                onTogglePanel: {
                    print("[Hotkey] Toggle panel")
                }
            )
        }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(captureService)
                .environmentObject(storage)
                .environmentObject(syncService)
        } label: {
            Image(systemName: "camera.viewfinder")
                .symbolRenderingMode(.hierarchical)
        }
        .menuBarExtraStyle(.window)
    }
}
