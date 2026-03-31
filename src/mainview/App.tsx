import { useState } from "react";
import { sendQuit } from "./lib/electrobun";

type CaptureMode = "fullscreen" | "window" | "area";

function App() {
	const [mode, setMode] = useState<CaptureMode>("fullscreen");
	const [timer, setTimer] = useState(0);
	const [showPointer, setShowPointer] = useState(false);
	const [showQuitConfirm, setShowQuitConfirm] = useState(false);

	const timerOptions = [0, 3, 5, 10];

	return (
		<div className="panel">
			{/* Header */}
			<div className="panel-header">
				<span className="panel-title">Screenshot</span>
				<button
					className={`toggle ${showPointer ? "toggle-on" : ""}`}
					onClick={() => setShowPointer(!showPointer)}
				>
					<div className="toggle-thumb" />
				</button>
			</div>

			<div className="sep" />

			{/* Capture Modes */}
			<div className="section-label">Capture Mode</div>
			<div className="mode-group">
				<ModeRow
					icon="monitor"
					label="Full Screen"
					active={mode === "fullscreen"}
					onClick={() => setMode("fullscreen")}
				/>
				<ModeRow
					icon="window"
					label="Window"
					active={mode === "window"}
					onClick={() => setMode("window")}
				/>
				<ModeRow
					icon="area"
					label="Selection"
					active={mode === "area"}
					onClick={() => setMode("area")}
				/>
			</div>

			<div className="sep" />

			{/* Timer */}
			<div className="section-label">Timer</div>
			<div className="timer-row">
				{timerOptions.map((t) => (
					<button
						key={t}
						onClick={() => setTimer(t)}
						className={`timer-pill ${timer === t ? "timer-active" : ""}`}
					>
						{t === 0 ? "Off" : `${t}s`}
					</button>
				))}
			</div>

			<div className="sep" />

			{/* Capture */}
			<button className="capture-row">
				<CaptureIcon />
				<span>Capture Screenshot</span>
			</button>

			<div className="sep" />

			{/* Quit */}
			{!showQuitConfirm ? (
				<button className="quit-row" onClick={() => setShowQuitConfirm(true)}>
					Quit Screencopy
				</button>
			) : (
				<div className="quit-confirm">
					<span className="quit-confirm-text">Quit Screencopy?</span>
					<div className="quit-confirm-btns">
						<button
							className="quit-cancel"
							onClick={() => setShowQuitConfirm(false)}
						>
							Cancel
						</button>
						<button
							className="quit-confirm-btn"
							onClick={() => sendQuit()}
						>
							Quit
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function ModeRow({
	icon,
	label,
	active,
	onClick,
}: {
	icon: string;
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button className={`mode-row ${active ? "mode-row-active" : ""}`} onClick={onClick}>
			<div className="mode-row-icon">
				<ModeIcon type={icon} />
			</div>
			<span className="mode-row-label">{label}</span>
			{active && (
				<svg className="mode-row-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M20 6 9 17l-5-5" />
				</svg>
			)}
		</button>
	);
}

function ModeIcon({ type }: { type: string }) {
	const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
	if (type === "monitor") {
		return (
			<svg {...props}>
				<rect x="2" y="3" width="20" height="14" rx="2" />
				<path d="M8 21h8" />
				<path d="M12 17v4" />
			</svg>
		);
	}
	if (type === "window") {
		return (
			<svg {...props}>
				<rect x="2" y="4" width="20" height="16" rx="2" />
				<path d="M2 8h20" />
				<path d="M6 6h.01" />
				<path d="M9 6h.01" />
			</svg>
		);
	}
	return (
		<svg {...props}>
			<path d="M3 7V5a2 2 0 0 1 2-2h2" />
			<path d="M17 3h2a2 2 0 0 1 2 2v2" />
			<path d="M21 17v2a2 2 0 0 1-2 2h-2" />
			<path d="M7 21H5a2 2 0 0 1-2-2v-2" />
		</svg>
	);
}

function CaptureIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
			<circle cx="12" cy="13" r="3" />
		</svg>
	);
}

export default App;
