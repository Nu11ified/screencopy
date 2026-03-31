import { useState } from "react";
import { api, type Preset } from "../lib/api";

export function PresetButtons({
	captureId,
	presets,
}: {
	captureId: string;
	presets: Preset[];
}) {
	const [copied, setCopied] = useState<string | null>(null);

	const handleCopy = async (presetId: string) => {
		await api.copyCapture(captureId, presetId);
		setCopied(presetId);
		setTimeout(() => setCopied(null), 1500);
	};

	return (
		<div className="preset-buttons">
			{presets.map((p, i) => (
				<button
					key={p.id}
					className={`preset-btn ${copied === p.id ? "preset-btn-copied" : ""}`}
					onClick={() => handleCopy(p.id)}
					title={`Copy as ${p.name} (${i + 1})`}
				>
					{copied === p.id ? (
						<>
							<CheckIcon />
							<span>Copied</span>
						</>
					) : (
						<>
							<span className="preset-key">{i + 1}</span>
							<span>{p.name}</span>
						</>
					)}
				</button>
			))}
		</div>
	);
}

function CheckIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}
