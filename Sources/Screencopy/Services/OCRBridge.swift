import Foundation
import CScreencopy

struct OCRResult {
    let imagePath: String
    let text: String
}

enum OCRBridge {
    private static let textBufferSize: UInt32 = 256 * 1024 // 256KB

    static func initialize() {
        let result = sc_init()
        let version = String(cString: sc_version())
        print("Screencopy native v\(version) loaded (init: \(result))")
    }

    static func shutdown() {
        sc_deinit()
    }

    static func captureFullscreen(outputPath: String, displayId: UInt32 = 0) -> Int32 {
        return outputPath.withCString { path in
            sc_capture_fullscreen(displayId, path)
        }
    }

    static func captureRegion(x: Int32, y: Int32, w: Int32, h: Int32, outputPath: String) -> Int32 {
        return outputPath.withCString { path in
            sc_capture_region(x, y, w, h, path)
        }
    }

    static func captureAndOCR(
        outputPath: String,
        region: NSRect? = nil,
        displayId: UInt32 = 0
    ) -> OCRResult? {
        var textBuffer = [UInt8](repeating: 0, count: Int(textBufferSize))

        let x = Int32(region?.origin.x ?? 0)
        let y = Int32(region?.origin.y ?? 0)
        let w = Int32(region?.size.width ?? 0)
        let h = Int32(region?.size.height ?? 0)

        let bytesWritten = outputPath.withCString { path in
            sc_capture_and_ocr(displayId, x, y, w, h, path, &textBuffer, textBufferSize)
        }

        guard bytesWritten >= 0 else {
            print("Capture+OCR failed: \(bytesWritten)")
            return nil
        }

        let text = String(bytes: textBuffer.prefix(Int(bytesWritten)), encoding: .utf8) ?? ""
        return OCRResult(imagePath: outputPath, text: text)
    }

    static func ocrFromFile(imagePath: String) -> String? {
        var textBuffer = [UInt8](repeating: 0, count: Int(textBufferSize))

        let bytesWritten = imagePath.withCString { path in
            sc_ocr_from_file(path, &textBuffer, textBufferSize)
        }

        guard bytesWritten >= 0 else { return nil }
        return String(bytes: textBuffer.prefix(Int(bytesWritten)), encoding: .utf8)
    }
}
