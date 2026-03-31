import AppKit
import Foundation

@MainActor
class CaptureService: ObservableObject {
    @Published var lastCapture: Capture?
    @Published var isCapturing = false

    private let storageDir: String
    private let imagesDir: String

    init() {
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        storageDir = "\(home)/Documents/Screencopy"
        imagesDir = "\(storageDir)/images"

        // Create directories
        try? FileManager.default.createDirectory(atPath: imagesDir, withIntermediateDirectories: true)

        OCRBridge.initialize()
    }

    func captureFullscreen() async -> Capture? {
        isCapturing = true
        defer { isCapturing = false }

        let id = Capture.newId()
        let imagePath = "\(imagesDir)/\(id).png"

        guard let result = OCRBridge.captureAndOCR(outputPath: imagePath) else {
            return nil
        }

        let capture = Capture(
            id: id,
            imagePath: "images/\(id).png",
            text: result.text,
            textNormalized: result.text.lowercased()
                .components(separatedBy: .whitespacesAndNewlines)
                .filter { !$0.isEmpty }
                .joined(separator: " "),
            mode: .fullscreen,
            regionX: nil, regionY: nil, regionW: nil, regionH: nil,
            createdAt: Date(),
            syncStatus: .local
        )

        lastCapture = capture
        return capture
    }

    func captureRegion(_ rect: NSRect) async -> Capture? {
        isCapturing = true
        defer { isCapturing = false }

        let id = Capture.newId()
        let imagePath = "\(imagesDir)/\(id).png"

        guard let result = OCRBridge.captureAndOCR(
            outputPath: imagePath,
            region: rect
        ) else { return nil }

        let capture = Capture(
            id: id,
            imagePath: "images/\(id).png",
            text: result.text,
            textNormalized: result.text.lowercased()
                .components(separatedBy: .whitespacesAndNewlines)
                .filter { !$0.isEmpty }
                .joined(separator: " "),
            mode: .region,
            regionX: Int(rect.origin.x),
            regionY: Int(rect.origin.y),
            regionW: Int(rect.size.width),
            regionH: Int(rect.size.height),
            createdAt: Date(),
            syncStatus: .local
        )

        lastCapture = capture
        return capture
    }

    func fullImagePath(for capture: Capture) -> String {
        return "\(storageDir)/\(capture.imagePath)"
    }

    func openStorageFolder() {
        NSWorkspace.shared.open(URL(fileURLWithPath: storageDir))
    }

    deinit {
        OCRBridge.shutdown()
    }
}
