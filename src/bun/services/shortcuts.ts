import { GlobalShortcut } from "electrobun/bun";

export interface ShortcutConfig {
	captureFullscreen: string;
	captureRegion: string;
	openHistory: string;
}

const DEFAULT_SHORTCUTS: ShortcutConfig = {
	captureFullscreen: "CommandOrControl+Shift+1",
	captureRegion: "CommandOrControl+Shift+2",
	openHistory: "CommandOrControl+Shift+Space",
};

export class ShortcutService {
	private config: ShortcutConfig;
	private handlers: {
		onCaptureFullscreen: () => void;
		onCaptureRegion: () => void;
		onOpenHistory: () => void;
	};

	constructor(handlers: {
		onCaptureFullscreen: () => void;
		onCaptureRegion: () => void;
		onOpenHistory: () => void;
	}) {
		this.config = { ...DEFAULT_SHORTCUTS };
		this.handlers = handlers;
	}

	register(): void {
		const reg = (accel: string, handler: () => void) => {
			if (!GlobalShortcut.isRegistered(accel)) {
				const ok = GlobalShortcut.register(accel, handler);
				if (ok) {
					console.log(`Registered shortcut: ${accel}`);
				} else {
					console.warn(`Failed to register shortcut: ${accel}`);
				}
			}
		};

		reg(this.config.captureFullscreen, this.handlers.onCaptureFullscreen);
		reg(this.config.captureRegion, this.handlers.onCaptureRegion);
		reg(this.config.openHistory, this.handlers.onOpenHistory);
	}

	unregisterAll(): void {
		GlobalShortcut.unregisterAll();
	}

	getConfig(): ShortcutConfig {
		return { ...this.config };
	}

	updateConfig(newConfig: Partial<ShortcutConfig>): void {
		// Unregister old shortcuts
		this.unregisterAll();
		// Update config
		Object.assign(this.config, newConfig);
		// Re-register with new config
		this.register();
	}
}
