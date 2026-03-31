import Carbon
import AppKit

class HotkeyService {
    typealias Handler = () -> Void

    private var hotkeys: [(id: EventHotKeyID, ref: EventHotKeyRef?, handler: Handler)] = []
    private var nextId: UInt32 = 1
    private static var instance: HotkeyService?

    init() {
        HotkeyService.instance = self
        installHandler()
    }

    func register(keyCode: UInt32, modifiers: UInt32, handler: @escaping Handler) {
        var hotKeyID = EventHotKeyID()
        hotKeyID.signature = 0x5343_5059 // 'SCPY'
        hotKeyID.id = nextId
        nextId += 1

        var hotKeyRef: EventHotKeyRef?
        let status = RegisterEventHotKey(
            keyCode,
            modifiers,
            hotKeyID,
            GetApplicationEventTarget(),
            0,
            &hotKeyRef
        )

        if status == noErr {
            hotkeys.append((id: hotKeyID, ref: hotKeyRef, handler: handler))
            print("[Hotkey] Registered keyCode=\(keyCode) modifiers=0x\(String(modifiers, radix: 16)) id=\(hotKeyID.id)")
        } else {
            print("[Hotkey] Failed to register: status=\(status)")
        }
    }

    func unregisterAll() {
        for hotkey in hotkeys {
            if let ref = hotkey.ref {
                UnregisterEventHotKey(ref)
            }
        }
        hotkeys.removeAll()
    }

    /// Register default shortcuts:
    /// - Ctrl+Option+C (keyCode 8) = capture fullscreen
    /// - Ctrl+Option+X (keyCode 7) = capture region
    /// - Ctrl+Option+S (keyCode 1) = toggle panel
    func registerDefaults(
        onCaptureFullscreen: @escaping Handler,
        onCaptureRegion: @escaping Handler,
        onTogglePanel: @escaping Handler
    ) {
        let ctrlOpt: UInt32 = UInt32(Carbon.controlKey | Carbon.optionKey)
        register(keyCode: 8, modifiers: ctrlOpt, handler: onCaptureFullscreen)   // C
        register(keyCode: 7, modifiers: ctrlOpt, handler: onCaptureRegion)       // X
        register(keyCode: 1, modifiers: ctrlOpt, handler: onTogglePanel)         // S
    }

    private func installHandler() {
        var eventType = EventTypeSpec(
            eventClass: OSType(kEventClassKeyboard),
            eventKind: UInt32(kEventHotKeyPressed)
        )

        InstallEventHandler(
            GetApplicationEventTarget(),
            { (_, event, _) -> OSStatus in
                var hotKeyID = EventHotKeyID()
                GetEventParameter(
                    event,
                    EventParamName(kEventParamDirectObject),
                    EventParamType(typeEventHotKeyID),
                    nil,
                    MemoryLayout<EventHotKeyID>.size,
                    nil,
                    &hotKeyID
                )

                if let instance = HotkeyService.instance {
                    for hotkey in instance.hotkeys {
                        if hotkey.id.id == hotKeyID.id {
                            DispatchQueue.main.async {
                                print("[Hotkey] Triggered id=\(hotKeyID.id)")
                                hotkey.handler()
                            }
                            return noErr
                        }
                    }
                }
                return OSStatus(eventNotHandledErr)
            },
            1,
            &eventType,
            nil,
            nil
        )
    }

    deinit {
        unregisterAll()
    }
}
