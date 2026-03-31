import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "screencopy",
		identifier: "dev.screencopy.app",
		version: "0.0.1",
	},
	runtime: {
		exitOnLastWindowClosed: false,
	},
	build: {
		// Vite builds to dist/, we copy from there
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
			"src/mainview/assets/tray-icon-template.png": "views/assets/tray-icon-template.png",
		},
		// Ignore Vite output in watch mode — HMR handles view rebuilds separately
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
	// Uncomment and set baseUrl when ready to distribute:
	// release: {
	// 	baseUrl: "https://storage.googleapis.com/your-bucket/screencopy/",
	// },
} satisfies ElectrobunConfig;
