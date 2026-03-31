import { BrowserWindow, Tray, Utils, Updater } from "electrobun/bun";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { initDatabase } from "./db/schema";
import { SQLiteStorage } from "./db/repository";
import { CaptureService } from "./services/capture";
import { CopyPresetService } from "./services/copy-presets";
import { ShortcutService } from "./services/shortcuts";
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
	tray.remove();
	captureService.destroy();
	db.close();
	setTimeout(() => process.exit(0), 100);
}

// Start API server
createServer(API_PORT, captureService, presetService, STORAGE_DIR, quit);
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

// Global shortcuts
async function captureFromShortcut(mode: "fullscreen" | "region") {
	try {
		const capture = await captureService.capture({ mode });
		// Auto-copy plain text to clipboard
		await presetService.applyAndCopy("plain", capture.text);
		console.log(`Captured (${mode}): ${capture.text.slice(0, 60)}...`);
		// Show panel so user can see result
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
shortcuts.register();

// Tray click
tray.on("tray-clicked", (e) => {
	const { action } = e.data as { id: number; action: string };
	if (action === "") {
		togglePanel();
	}
});

console.log("Screencopy topbar app started!");
console.log(`Storage: ${STORAGE_DIR}`);
