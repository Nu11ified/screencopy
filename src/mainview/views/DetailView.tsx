import { useState, useEffect } from "react";
import { api, type Capture, type Preset } from "../lib/api";
import { PresetButtons } from "../components/PresetButtons";
import { useKeyboard } from "../hooks/useKeyboard";

export function DetailView({
	capture,
	onBack,
}: {
	capture: Capture;
	onBack: () => void;
}) {
	const [presets, setPresets] = useState<Preset[]>([]);

	useEffect(() => {
		api.getPresets().then(setPresets);
	}, []);

	// Keyboard: number keys for quick copy, Escape/Backspace to go back
	useKeyboard(
		{
			escape: onBack,
			backspace: onBack,
			"1": () => presets[0] && api.copyCapture(capture.id, presets[0].id),
			"2": () => presets[1] && api.copyCapture(capture.id, presets[1].id),
			"3": () => presets[2] && api.copyCapture(capture.id, presets[2].id),
			"4": () => presets[3] && api.copyCapture(capture.id, presets[3].id),
		},
		[capture.id, presets],
	);

	const time = new Date(capture.createdAt).toLocaleString();

	return (
		<div className="view-content">
			{/* Header with back button */}
			<div className="detail-header">
				<button className="detail-back" onClick={onBack}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="m15 18-6-6 6-6" />
					</svg>
					<span>Back</span>
				</button>
				<button
					className="detail-delete"
					onClick={async () => {
						await api.deleteCapture(capture.id);
						onBack();
					}}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M3 6h18" />
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
					</svg>
				</button>
			</div>

			{/* Image preview */}
			<div className="detail-image-wrap">
				<img
					className="detail-image"
					src={api.getImageUrl(capture.id)}
					alt="Screenshot"
				/>
			</div>

			{/* Meta */}
			<div className="detail-meta">
				<span>{capture.mode}</span>
				<span>{time}</span>
			</div>

			<div className="sep" />

			{/* OCR text */}
			<div className="section-label">Extracted Text</div>
			<div className="detail-text">
				{capture.text || "(no text detected)"}
			</div>

			<div className="sep" />

			{/* Copy presets */}
			<div className="section-label">Copy As</div>
			<PresetButtons captureId={capture.id} presets={presets} />
		</div>
	);
}
