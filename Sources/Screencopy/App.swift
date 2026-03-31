import SwiftUI

@main
struct ScreencopyApp: App {
    @StateObject private var captureService = CaptureService()
    @StateObject private var storage = StorageService()
    private let hotkeyService = HotkeyService()

    init() {
        // Register global hotkeys after a short delay to ensure app is ready
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { [hotkeyService] in
            hotkeyService.registerDefaults(
                onCaptureFullscreen: {
                    print("[App] Fullscreen capture triggered via hotkey")
                    // Capture is handled by the service
                },
                onCaptureRegion: {
                    print("[App] Region capture triggered via hotkey")
                },
                onTogglePanel: {
                    print("[App] Toggle panel triggered via hotkey")
                }
            )
        }
    }

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(captureService)
                .environmentObject(storage)
        } label: {
            Image(systemName: "camera.viewfinder")
                .symbolRenderingMode(.hierarchical)
        }
        .menuBarExtraStyle(.window)
    }
}
