import { useState } from "react";
import { api, type Capture } from "../lib/api";

type CaptureMode = "fullscreen" | "window" | "region";

export function CaptureView({ onCaptured }: { onCaptured?: (c: Capture) => void }) {
	const [mode, setMode] = useState<CaptureMode>("fullscreen");
	const [capturing, setCapturing] = useState(false);
	const [lastCapture, setLastCapture] = useState<Capture | null>(null);
	const [copied, setCopied] = useState(false);

	const handleCapture = async () => {
		if (mode === "region") {
			// Trigger region selection overlay
			await api.startRegionCapture();
			return;
		}

		setCapturing(true);
		try {
			const capture = await api.capture(mode);
			setLastCapture(capture);
			onCaptured?.(capture);
			await api.copyCapture(capture.id, "plain");
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Capture failed:", err);
		} finally {
			setCapturing(false);
		}
	};

	return (
		<div className="view-content">
			{/* Mode selector */}
			<div className="section-label">Capture Mode</div>
			<div className="mode-group">
				<ModeRow icon="monitor" label="Full Screen" active={mode === "fullscreen"} onClick={() => setMode("fullscreen")} />
				<ModeRow icon="window" label="Window" active={mode === "window"} onClick={() => setMode("window")} />
				<ModeRow icon="area" label="Selection" active={mode === "region"} onClick={() => setMode("region")} />
			</div>

			<div className="sep" />

			{/* Capture button */}
			<div className="capture-action">
				<button
					className={`capture-main-btn ${capturing ? "capture-main-btn-loading" : ""}`}
					onClick={handleCapture}
					disabled={capturing}
				>
					{capturing ? "Capturing..." : "Capture & Copy"}
				</button>
				<div className="capture-hint">
					<kbd>{"\u2303\u2325C"}</kbd> fullscreen &middot; <kbd>{"\u2303\u2325X"}</kbd> region &middot; <kbd>{"\u2303\u2325S"}</kbd> panel
				</div>
			</div>

			{/* Last capture preview */}
			{lastCapture && (
				<>
					<div className="sep" />
					<div className="section-label">Last Capture</div>
					<div className="ocr-preview">
						<div className="ocr-preview-text">
							{lastCapture.text || "(no text detected)"}
						</div>
						<div className="ocr-preview-footer">
							<span className="ocr-preview-count">
								{lastCapture.text.length} chars
							</span>
							{copied && <span className="ocr-preview-copied">Copied!</span>}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function ModeRow({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
	return (
		<button className={`mode-row ${active ? "mode-row-active" : ""}`} onClick={onClick}>
			<div className="mode-row-icon"><ModeIcon type={icon} /></div>
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
	const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
	if (type === "monitor") return <svg {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>;
	if (type === "window") return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20" /><path d="M6 6h.01" /><path d="M9 6h.01" /></svg>;
	return <svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /></svg>;
}
