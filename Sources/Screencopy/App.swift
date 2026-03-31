import SwiftUI

@main
struct ScreencopyApp: App {
    @StateObject private var captureService = CaptureService()
    @StateObject private var appState = AppState()

    var body: some Scene {
        MenuBarExtra {
            MenuBarView()
                .environmentObject(captureService)
                .environmentObject(appState)
        } label: {
            Image(systemName: "camera.viewfinder")
                .symbolRenderingMode(.hierarchical)
        }
        .menuBarExtraStyle(.window)
    }
}

@MainActor
class AppState: ObservableObject {
    @Published var captures: [Capture] = []
    @Published var searchQuery = ""

    var filteredCaptures: [Capture] {
        if searchQuery.isEmpty { return captures }
        let q = searchQuery.lowercased()
        return captures.filter { $0.textNormalized.contains(q) }
    }

    func addCapture(_ capture: Capture) {
        captures.insert(capture, at: 0)
    }

    func removeCapture(id: String) {
        captures.removeAll { $0.id == id }
    }
}
