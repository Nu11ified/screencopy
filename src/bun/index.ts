import { BrowserWindow, Tray, Utils, Updater } from "electrobun/bun";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { initDatabase } from "./db/schema";
import { SQLiteStorage } from "./db/repository";
import { CaptureService } from "./services/capture";
import { CopyPresetService } from "./services/copy-presets";
import { ShortcutService } from "./services/shortcuts";
import { GitForgeSyncService } from "./services/gitforge-sync";
import { createServer } from "./server";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;
const API_PORT = 47932;

const PANEL_WIDTH = 340;
const PANEL_HEIGHT = 480;

// Storage directory in ~/Documents/Screencopy
const homeDir = process.env.HOME ?? "/tmp";
const STORAGE_DIR = join(homeDir, "Documents", "Screencopy");
if (!existsSync(STORAGE_DIR)) {
	mkdirSync(STORAGE_DIR, { recursive: true });
}
const DB_PATH = join(STORAGE_DIR, "screencopy.db");

// Hide the dock icon — this is a topbar-only app
Utils.setDockIconVisible(false);

// Initialize database and services
const db = initDatabase(DB_PATH);
const storage = new SQLiteStorage(db);
const captureService = new CaptureService(storage, STORAGE_DIR);
const presetService = new CopyPresetService(storage);

// Initialize GitForge sync
const syncService = new GitForgeSyncService(storage, STORAGE_DIR);

// Load saved GitForge config if exists
(async () => {
	const savedConfig = await storage.getSetting("gitforge_config");
	if (savedConfig) {
		try {
			syncService.configure(JSON.parse(savedConfig));
			syncService.startAutoSync();
		} catch {
			console.log("No valid GitForge config found");
		}
	}
})();

// Create system tray
const tray = new Tray({
	title: "",
	image: "views://assets/tray-icon-template.png",
	template: true,
	width: 16,
	height: 16,
});

function quit() {
	console.log("Quit requested");
	shortcuts.unregisterAll();
	syncService.stopAutoSync();
	tray.remove();
	captureService.destroy();
	db.close();
	setTimeout(() => process.exit(0), 100);
}

// Clean up tray icon on SIGINT/SIGTERM (Ctrl+C, kill)
process.on("SIGINT", quit);
process.on("SIGTERM", quit);

// Start API server
createServer(API_PORT, captureService, presetService, syncService, storage, STORAGE_DIR, quit, (newConfig) => {
	shortcuts.updateConfig(newConfig);
}, () => {
	showRegionOverlay();
});
console.log(`API server running on port ${API_PORT}`);

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

const mainUrl = await getMainViewUrl();

let panelWindow: InstanceType<typeof BrowserWindow> | null = null;

function showPanel() {
	if (panelWindow) return;

	const bounds = tray.getBounds();
	const x = Math.round(bounds.x + bounds.width / 2 - PANEL_WIDTH / 2);
	const y = 37;

	panelWindow = new BrowserWindow({
		title: "",
		url: mainUrl,
		titleBarStyle: "hidden",
		styleMask: ["Borderless"],
		transparent: true,
		frame: {
			width: PANEL_WIDTH,
			height: PANEL_HEIGHT,
			x,
			y,
		},
	});

	panelWindow.setAlwaysOnTop(true);

	panelWindow.on("blur", () => {
		if (panelWindow) {
			panelWindow.close();
			panelWindow = null;
		}
	});
}

function togglePanel() {
	if (panelWindow) {
		panelWindow.close();
		panelWindow = null;
	} else {
		showPanel();
	}
}

// Region capture overlay
let overlayWindow: InstanceType<typeof BrowserWindow> | null = null;

function showRegionOverlay() {
	if (overlayWindow) return;

	// Close the panel first so it's not in the screenshot
	if (panelWindow) {
		panelWindow.close();
		panelWindow = null;
	}

	// Small delay so panel closes before overlay appears
	setTimeout(() => {
		const overlayUrl = mainUrl.includes("localhost:5173")
			? "http://localhost:5173/region-overlay.html"
			: "views://mainview/region-overlay.html";

		overlayWindow = new BrowserWindow({
			title: "",
			url: overlayUrl,
			titleBarStyle: "hidden",
			styleMask: ["Borderless"],
			transparent: true,
			frame: {
				width: 1920,
				height: 1200,
				x: 0,
				y: 0,
			},
		});

		overlayWindow.setAlwaysOnTop(true);

		// Poll for title changes to detect region selection completion
		const checkTitle = setInterval(async () => {
			if (!overlayWindow) {
				clearInterval(checkTitle);
				return;
			}
			// The overlay sets document.title when done
			// We'll watch for the close event instead
		}, 100);

		overlayWindow.on("close", () => {
			clearInterval(checkTitle);
			overlayWindow = null;
			// Show panel after capture
			setTimeout(() => showPanel(), 300);
		});
	}, 200);
}

// Global shortcuts
async function captureFromShortcut(mode: "fullscreen" | "region") {
	if (mode === "region") {
		showRegionOverlay();
		return;
	}
	try {
		const capture = await captureService.capture({ mode });
		await presetService.applyAndCopy("plain", capture.text);
		console.log(`Captured (${mode}): ${capture.text.slice(0, 60)}...`);
		showPanel();
	} catch (err) {
		console.error("Shortcut capture failed:", err);
	}
}

const shortcuts = new ShortcutService({
	onCaptureFullscreen: () => captureFromShortcut("fullscreen"),
	onCaptureRegion: () => captureFromShortcut("region"),
	onOpenHistory: () => togglePanel(),
});

// GlobalShortcut disabled — broken in Electrobun v1.16 (blackboardsh/electrobun#334)
// NSEvent global monitor doesn't work in bun subprocess even with ad-hoc codesign.
// Use tray menu for all actions instead.

// Tray menu with quick actions
tray.setMenu([
	{ type: "normal", label: "Capture Fullscreen", action: "capture-full" },
	{ type: "normal", label: "Capture Region", action: "capture-region" },
	{ type: "divider" },
	{ type: "normal", label: "Open Panel", action: "open-panel" },
	{ type: "normal", label: "Open Screenshots Folder", action: "open-folder" },
	{ type: "divider" },
	{ type: "normal", label: "Quit Screencopy", action: "quit" },
]);

tray.on("tray-clicked", (e) => {
	const { action } = e.data as { id: number; action: string };
	switch (action) {
		case "":
			togglePanel();
			break;
		case "capture-full":
			captureFromShortcut("fullscreen");
			break;
		case "capture-region":
			showRegionOverlay();
			break;
		case "open-panel":
			showPanel();
			break;
		case "open-folder":
			Bun.spawn(["open", STORAGE_DIR]);
			break;
		case "quit":
			quit();
			break;
	}
});

console.log("Screencopy topbar app started!");
console.log(`Storage: ${STORAGE_DIR}`);
