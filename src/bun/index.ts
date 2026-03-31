import { BrowserWindow, Tray, Utils, Updater } from "electrobun/bun";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Hide the dock icon — this is a topbar-only app
Utils.setDockIconVisible(false);

// Create system tray icon
const tray = new Tray({
	title: "Screencopy",
	image: "views://assets/tray-icon-template.png",
	template: true,
	width: 22,
	height: 22,
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

const url = await getMainViewUrl();

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;

function createWindow() {
	if (mainWindow) return;

	mainWindow = new BrowserWindow({
		title: "Screencopy",
		url,
		frame: {
			width: 400,
			height: 500,
			x: 200,
			y: 50,
		},
	});
}

// Set up tray menu
tray.setMenu([
	{
		type: "normal",
		label: "Show Window",
		action: "show-window",
	},
	{
		type: "divider",
	},
	{
		type: "normal",
		label: "Quit Screencopy",
		action: "quit",
	},
]);

tray.on("tray-clicked", (e) => {
	const { action } = e.data as { id: number; action: string };

	if (action === "" || action === "show-window") {
		createWindow();
	} else if (action === "quit") {
		process.exit(0);
	}
});

console.log("Screencopy topbar app started!");
