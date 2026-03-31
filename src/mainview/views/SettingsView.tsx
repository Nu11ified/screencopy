import { useState } from "react";
import { api } from "../lib/api";

export function SettingsView() {
	const [showQuitConfirm, setShowQuitConfirm] = useState(false);

	return (
		<div className="view-content">
			<div className="section-label">Shortcuts</div>
			<div className="settings-group">
				<SettingsRow label="Capture Screen" shortcut="Cmd+Shift+5" />
				<SettingsRow label="Capture Region" shortcut="Cmd+Shift+6" />
				<SettingsRow label="Open History" shortcut="Cmd+Shift+V" />
			</div>

			<div className="sep" />

			<div className="section-label">Storage</div>
			<div className="settings-group">
				<div className="settings-row">
					<span className="settings-label">Location</span>
					<span className="settings-value">~/Documents/Screencopy</span>
				</div>
			</div>

			<div className="sep" />

			<div className="section-label">About</div>
			<div className="settings-group">
				<div className="settings-row">
					<span className="settings-label">Version</span>
					<span className="settings-value">0.0.1</span>
				</div>
				<div className="settings-row">
					<span className="settings-label">Engine</span>
					<span className="settings-value">Apple Vision + Zig</span>
				</div>
			</div>

			<div className="sep" />

			{!showQuitConfirm ? (
				<button className="quit-row" onClick={() => setShowQuitConfirm(true)}>
					Quit Screencopy
				</button>
			) : (
				<div className="quit-confirm">
					<span className="quit-confirm-text">Quit Screencopy?</span>
					<div className="quit-confirm-btns">
						<button className="quit-cancel" onClick={() => setShowQuitConfirm(false)}>Cancel</button>
						<button className="quit-confirm-btn" onClick={() => api.quit()}>Quit</button>
					</div>
				</div>
			)}
		</div>
	);
}

function SettingsRow({ label, shortcut }: { label: string; shortcut: string }) {
	return (
		<div className="settings-row">
			<span className="settings-label">{label}</span>
			<kbd className="settings-kbd">{shortcut}</kbd>
		</div>
	);
}
