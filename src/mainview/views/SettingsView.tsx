import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

// Convert accelerator format to macOS symbols
function formatShortcut(accel: string): string {
	return accel
		.replace("CommandOrControl", "\u2318")
		.replace("Command", "\u2318")
		.replace("Control", "\u2303")
		.replace("Shift", "\u21E7")
		.replace("Alt", "\u2325")
		.replace("Option", "\u2325")
		.replace(/\+/g, "");
}

// Convert KeyboardEvent to accelerator format
function eventToAccelerator(e: KeyboardEvent): string | null {
	if (["Meta", "Shift", "Control", "Alt"].includes(e.key)) return null;
	const parts: string[] = [];
	if (e.metaKey) parts.push("CommandOrControl");
	if (e.ctrlKey && !e.metaKey) parts.push("Control");
	if (e.shiftKey) parts.push("Shift");
	if (e.altKey) parts.push("Option");
	parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
	return parts.join("+");
}

const SHORTCUT_LABELS: Record<string, string> = {
	captureFullscreen: "Capture Screen",
	captureRegion: "Capture Region",
	openHistory: "Open Panel",
};

export function SettingsView() {
	const [showQuitConfirm, setShowQuitConfirm] = useState(false);
	const [shortcuts, setShortcuts] = useState<Record<string, string>>({});
	const [editing, setEditing] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<{
		configured: boolean;
		org: string | null;
		repo: string | null;
	} | null>(null);
	const [showSyncForm, setShowSyncForm] = useState(false);
	const [syncToken, setSyncToken] = useState("");
	const [syncOrg, setSyncOrg] = useState("");
	const [syncRepo, setSyncRepo] = useState("");
	const [syncing, setSyncing] = useState(false);
	const [syncResult, setSyncResult] = useState<string | null>(null);

	useEffect(() => {
		api.getShortcuts().then(setShortcuts);
		api.getSyncStatus().then(setSyncStatus);
	}, []);

	// Handle keyboard recording for shortcut editing
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!editing) return;
			e.preventDefault();
			e.stopPropagation();

			if (e.key === "Escape") {
				setEditing(null);
				return;
			}

			const accel = eventToAccelerator(e);
			if (!accel) return;

			const updated = { ...shortcuts, [editing]: accel };
			setShortcuts(updated);
			setEditing(null);
			api.updateShortcuts(updated);
		},
		[editing, shortcuts],
	);

	useEffect(() => {
		if (editing) {
			window.addEventListener("keydown", handleKeyDown, true);
			return () => window.removeEventListener("keydown", handleKeyDown, true);
		}
	}, [editing, handleKeyDown]);

	const handleConnect = async () => {
		if (!syncToken || !syncOrg || !syncRepo) return;
		await api.configureSyncService(syncToken, syncOrg, syncRepo);
		setSyncStatus({ configured: true, org: syncOrg, repo: syncRepo });
		setShowSyncForm(false);
		setSyncToken("");
	};

	const handleDisconnect = async () => {
		await api.disconnectSync();
		setSyncStatus({ configured: false, org: null, repo: null });
	};

	const handleSyncNow = async () => {
		setSyncing(true);
		setSyncResult(null);
		try {
			const result = await api.syncNow();
			setSyncResult(`Synced ${result.synced}, ${result.errors} errors`);
		} catch {
			setSyncResult("Sync failed");
		} finally {
			setSyncing(false);
			setTimeout(() => setSyncResult(null), 3000);
		}
	};

	return (
		<div className="view-content">
			<div className="section-label">Shortcuts</div>
			<div className="settings-group">
				{Object.entries(SHORTCUT_LABELS).map(([key, label]) => (
					<button
						key={key}
						className={`settings-row settings-row-btn ${editing === key ? "settings-row-editing" : ""}`}
						onClick={() => setEditing(editing === key ? null : key)}
					>
						<span className="settings-label">{label}</span>
						{editing === key ? (
							<span className="settings-recording">Press keys...</span>
						) : (
							<kbd className="settings-kbd">
								{formatShortcut(shortcuts[key] ?? "")}
							</kbd>
						)}
					</button>
				))}
			</div>

			<div className="sep" />

			<div className="section-label">Storage</div>
			<div className="settings-group">
				<div className="settings-row">
					<span className="settings-label">Location</span>
					<button
						className="settings-open-btn"
						onClick={() => api.openStorageFolder()}
					>
						Open Folder
					</button>
				</div>
			</div>

			<div className="sep" />

			<div className="section-label">GitForge Sync</div>
			<div className="settings-group">
				{syncStatus?.configured ? (
					<>
						<div className="settings-row">
							<span className="settings-label">Repository</span>
							<span className="settings-value">
								{syncStatus.org}/{syncStatus.repo}
							</span>
						</div>
						<div className="sync-actions">
							<button className="sync-btn" onClick={handleSyncNow} disabled={syncing}>
								{syncing ? "Syncing..." : "Sync Now"}
							</button>
							<button className="sync-btn sync-btn-danger" onClick={handleDisconnect}>
								Disconnect
							</button>
						</div>
						{syncResult && <div className="sync-result">{syncResult}</div>}
					</>
				) : showSyncForm ? (
					<div className="sync-form">
						<input className="sync-input" type="password" placeholder="Token (gf_...)" value={syncToken} onChange={(e) => setSyncToken(e.target.value)} />
						<div className="sync-form-row">
							<input className="sync-input" type="text" placeholder="org" value={syncOrg} onChange={(e) => setSyncOrg(e.target.value)} />
							<span className="sync-slash">/</span>
							<input className="sync-input" type="text" placeholder="repo" value={syncRepo} onChange={(e) => setSyncRepo(e.target.value)} />
						</div>
						<div className="sync-actions">
							<button className="sync-btn sync-btn-primary" onClick={handleConnect}>Connect</button>
							<button className="sync-btn" onClick={() => setShowSyncForm(false)}>Cancel</button>
						</div>
					</div>
				) : (
					<div className="settings-row">
						<span className="settings-label">Not connected</span>
						<button className="settings-connect-btn" onClick={() => setShowSyncForm(true)}>Connect</button>
					</div>
				)}
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
