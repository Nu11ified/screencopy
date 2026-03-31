import { useState, useEffect } from "react";
import { api } from "../lib/api";

export function SettingsView() {
	const [showQuitConfirm, setShowQuitConfirm] = useState(false);
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
		api.getSyncStatus().then(setSyncStatus);
	}, []);

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
				<SettingsRow label="Capture Screen" shortcut="Cmd+Shift+5" />
				<SettingsRow label="Capture Region" shortcut="Cmd+Shift+6" />
				<SettingsRow label="Open Panel" shortcut="Cmd+Shift+V" />
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
							<button
								className="sync-btn"
								onClick={handleSyncNow}
								disabled={syncing}
							>
								{syncing ? "Syncing..." : "Sync Now"}
							</button>
							<button
								className="sync-btn sync-btn-danger"
								onClick={handleDisconnect}
							>
								Disconnect
							</button>
						</div>
						{syncResult && (
							<div className="sync-result">{syncResult}</div>
						)}
					</>
				) : showSyncForm ? (
					<div className="sync-form">
						<input
							className="sync-input"
							type="password"
							placeholder="GitForge token (gf_...)"
							value={syncToken}
							onChange={(e) => setSyncToken(e.target.value)}
						/>
						<div className="sync-form-row">
							<input
								className="sync-input"
								type="text"
								placeholder="org"
								value={syncOrg}
								onChange={(e) => setSyncOrg(e.target.value)}
							/>
							<span className="sync-slash">/</span>
							<input
								className="sync-input"
								type="text"
								placeholder="repo"
								value={syncRepo}
								onChange={(e) => setSyncRepo(e.target.value)}
							/>
						</div>
						<div className="sync-actions">
							<button className="sync-btn sync-btn-primary" onClick={handleConnect}>
								Connect
							</button>
							<button className="sync-btn" onClick={() => setShowSyncForm(false)}>
								Cancel
							</button>
						</div>
					</div>
				) : (
					<div className="settings-row">
						<span className="settings-label">Not connected</span>
						<button
							className="settings-connect-btn"
							onClick={() => setShowSyncForm(true)}
						>
							Connect
						</button>
					</div>
				)}
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
