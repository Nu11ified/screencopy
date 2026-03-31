import AppKit
import SwiftUI

class RegionOverlayController {
    private var window: NSWindow?
    private var onCapture: ((NSRect) -> Void)?

    func show(onCapture: @escaping (NSRect) -> Void) {
        self.onCapture = onCapture

        guard let screen = NSScreen.main else { return }

        let window = NSWindow(
            contentRect: screen.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.level = .screenSaver
        window.isOpaque = false
        window.backgroundColor = NSColor.black.withAlphaComponent(0.15)
        window.ignoresMouseEvents = false
        window.hasShadow = false
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        let overlayView = RegionSelectionView { [weak self] rect in
            self?.finish(rect: rect)
        } onCancel: { [weak self] in
            self?.cancel()
        }
        window.contentView = overlayView
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(overlayView)

        // Set crosshair cursor
        NSCursor.crosshair.push()

        self.window = window
    }

    private func finish(rect: NSRect) {
        NSCursor.pop()
        window?.close()
        window = nil

        guard rect.width > 5, rect.height > 5 else { return }

        // Convert to screen coordinates (flip Y for CGDisplay)
        if let screen = NSScreen.main {
            let screenHeight = screen.frame.height
            let flippedRect = NSRect(
                x: rect.origin.x,
                y: screenHeight - rect.origin.y - rect.height,
                width: rect.width,
                height: rect.height
            )
            // Scale for retina
            let scale = screen.backingScaleFactor
            let scaledRect = NSRect(
                x: flippedRect.origin.x * scale,
                y: flippedRect.origin.y * scale,
                width: flippedRect.width * scale,
                height: flippedRect.height * scale
            )
            onCapture?(scaledRect)
        }
    }

    private func cancel() {
        NSCursor.pop()
        window?.close()
        window = nil
    }
}

class RegionSelectionView: NSView {
    private var startPoint: NSPoint?
    private var currentRect: NSRect?
    private var onComplete: ((NSRect) -> Void)?
    private var onCancel: (() -> Void)?

    private let selectionColor = NSColor.systemBlue
    private let dimLabel = NSTextField(labelWithString: "")

    init(onComplete: @escaping (NSRect) -> Void, onCancel: @escaping () -> Void) {
        self.onComplete = onComplete
        self.onCancel = onCancel
        super.init(frame: .zero)

        dimLabel.font = NSFont.monospacedSystemFont(ofSize: 11, weight: .medium)
        dimLabel.textColor = .white
        dimLabel.backgroundColor = NSColor.black.withAlphaComponent(0.75)
        dimLabel.isBezeled = false
        dimLabel.isEditable = false
        dimLabel.alignment = .center
        dimLabel.wantsLayer = true
        dimLabel.layer?.cornerRadius = 4
        dimLabel.isHidden = true
        addSubview(dimLabel)
    }

    required init?(coder: NSCoder) { fatalError() }

    override var acceptsFirstResponder: Bool { true }

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 53 { // Esc
            onCancel?()
        }
    }

    override func mouseDown(with event: NSEvent) {
        startPoint = convert(event.locationInWindow, from: nil)
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start = startPoint else { return }
        let current = convert(event.locationInWindow, from: nil)

        let rect = NSRect(
            x: min(start.x, current.x),
            y: min(start.y, current.y),
            width: abs(current.x - start.x),
            height: abs(current.y - start.y)
        )
        currentRect = rect

        // Update dimension label
        dimLabel.stringValue = " \(Int(rect.width)) × \(Int(rect.height)) "
        dimLabel.sizeToFit()
        dimLabel.frame.origin = NSPoint(x: rect.maxX + 8, y: rect.minY - 4)
        dimLabel.isHidden = false

        needsDisplay = true
    }

    override func mouseUp(with event: NSEvent) {
        guard let rect = currentRect else {
            onCancel?()
            return
        }
        onComplete?(rect)
    }

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)

        guard let rect = currentRect else { return }

        // Selection border
        selectionColor.withAlphaComponent(0.08).setFill()
        NSBezierPath(rect: rect).fill()

        selectionColor.setStroke()
        let path = NSBezierPath(rect: rect)
        path.lineWidth = 2
        path.stroke()
    }
}
