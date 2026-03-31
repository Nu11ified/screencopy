import { BrowserWindow, Tray, Utils, Updater } from "electrobun/bun";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

const PANEL_WIDTH = 340;
const PANEL_HEIGHT = 380;
const QUIT_PORT = 47932;

// Hide the dock icon — this is a topbar-only app
Utils.setDockIconVisible(false);

// Tiny local server so the UI can signal quit
Bun.serve({
	port: QUIT_PORT,
	fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/quit") {
			console.log("Quit requested from panel");
			setTimeout(() => process.exit(0), 100);
			return new Response("ok", {
				headers: { "Access-Control-Allow-Origin": "*" },
			});
		}
		return new Response("not found", { status: 404 });
	},
});

// Create system tray with screenshot icon
const tray = new Tray({
	title: "",
	image: "views://assets/tray-icon-template.png",
	template: true,
	width: 16,
	height: 16,
});

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

function togglePanel() {
	if (panelWindow) {
		panelWindow.close();
		panelWindow = null;
		return;
	}

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

tray.on("tray-clicked", (e) => {
	const { action } = e.data as { id: number; action: string };
	if (action === "") {
		togglePanel();
	}
});

console.log("Screencopy topbar app started!");
