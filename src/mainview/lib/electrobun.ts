const QUIT_PORT = 47932;

export function sendQuit() {
	fetch(`http://localhost:${QUIT_PORT}/quit`).catch(() => {
		// fallback
		window.close();
	});
}
