import { useState } from "react";
import { NavBar } from "./components/NavBar";
import { CaptureView } from "./views/CaptureView";
import { HistoryView } from "./views/HistoryView";
import { DetailView } from "./views/DetailView";
import { SettingsView } from "./views/SettingsView";
import { useKeyboard } from "./hooks/useKeyboard";
import type { Capture } from "./lib/api";

type View = "capture" | "history" | "settings";

function App() {
	const [view, setView] = useState<View>("capture");
	const [detailCapture, setDetailCapture] = useState<Capture | null>(null);

	// Global keyboard shortcuts
	useKeyboard(
		{
			escape: () => {
				if (detailCapture) {
					setDetailCapture(null);
				}
			},
			"cmd+1": () => { setDetailCapture(null); setView("capture"); },
			"cmd+2": () => { setDetailCapture(null); setView("history"); },
			"cmd+3": () => { setDetailCapture(null); setView("settings"); },
		},
		[detailCapture],
	);

	const handleCaptured = (capture: Capture) => {
		// Optionally switch to detail view after capture
	};

	const handleSelectCapture = (capture: Capture) => {
		setDetailCapture(capture);
	};

	return (
		<div className="panel">
			<div className="panel-body">
				{detailCapture ? (
					<DetailView
						capture={detailCapture}
						onBack={() => setDetailCapture(null)}
					/>
				) : view === "capture" ? (
					<CaptureView onCaptured={handleCaptured} />
				) : view === "history" ? (
					<HistoryView onSelect={handleSelectCapture} />
				) : (
					<SettingsView />
				)}
			</div>
			{!detailCapture && <NavBar active={view} onChange={setView} />}
		</div>
	);
}

export default App;
