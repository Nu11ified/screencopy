import AppKit
import Carbon

class HotkeyService {
    typealias Handler = () -> Void

    private var monitors: [Any] = []
    private var hotkeys: [(modifiers: NSEvent.ModifierFlags, keyCode: UInt16, handler: Handler)] = []

    func register(keyCode: UInt16, modifiers: NSEvent.ModifierFlags, handler: @escaping Handler) {
        hotkeys.append((modifiers: modifiers, keyCode: keyCode, handler: handler))
        print("[Hotkey] Registered keyCode=\(keyCode) modifiers=\(modifiers.rawValue)")
    }

    func start() {
        // Global monitor — catches events when app is NOT focused
        let globalMonitor = NSEvent.addGlobalMonitorForEvents(
            matching: .keyDown,
            handler: { [weak self] event in
                self?.handleEvent(event)
            }
        )
        if let globalMonitor { monitors.append(globalMonitor) }

        // Local monitor — catches events when app IS focused
        let localMonitor = NSEvent.addLocalMonitorForEvents(
            matching: .keyDown,
            handler: { [weak self] event in
                if self?.handleEvent(event) == true {
                    return nil // consumed
                }
                return event
            }
        )
        if let localMonitor { monitors.append(localMonitor) }

        print("[Hotkey] Monitoring started (\(hotkeys.count) hotkeys)")
    }

    @discardableResult
    private func handleEvent(_ event: NSEvent) -> Bool {
        let eventMods = event.modifierFlags.intersection([.control, .option, .command, .shift])

        for hotkey in hotkeys {
            if event.keyCode == hotkey.keyCode && eventMods == hotkey.modifiers {
                print("[Hotkey] Triggered keyCode=\(hotkey.keyCode)")
                hotkey.handler()
                return true
            }
        }
        return false
    }

    func stop() {
        for monitor in monitors {
            NSEvent.removeMonitor(monitor)
        }
        monitors.removeAll()
        hotkeys.removeAll()
    }

    /// Register default shortcuts:
    /// - Ctrl+Option+C = capture fullscreen
    /// - Ctrl+Option+X = capture region
    /// - Ctrl+Option+S = toggle panel
    func registerDefaults(
        onCaptureFullscreen: @escaping Handler,
        onCaptureRegion: @escaping Handler,
        onTogglePanel: @escaping Handler
    ) {
        let ctrlOpt: NSEvent.ModifierFlags = [.control, .option]
        register(keyCode: 8, modifiers: ctrlOpt, handler: onCaptureFullscreen)   // C
        register(keyCode: 7, modifiers: ctrlOpt, handler: onCaptureRegion)       // X
        register(keyCode: 1, modifiers: ctrlOpt, handler: onTogglePanel)         // S
        start()
    }

    deinit {
        stop()
    }
}
