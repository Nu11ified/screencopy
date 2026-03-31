import { join } from "path";
import { readFileSync } from "fs";
import type { StorageBackend, Capture } from "../db/storage";

export interface GitForgeConfig {
	token: string; // gf_ prefixed PAT
	baseUrl: string; // https://api.gitforge.dev
	org: string;
	repo: string;
}

/**
 * GitForge sync service.
 * Pushes captures to a GitForge repository as files:
 *   - images/{id}.png — screenshot image (via Git LFS or direct)
 *   - captures/{id}.json — capture metadata + OCR text
 *   - index.json — manifest of all captures (updated on each sync)
 *
 * Uses the GitForge API to commit files directly without needing
 * a local git clone.
 */
export class GitForgeSyncService {
	private config: GitForgeConfig | null = null;
	private storage: StorageBackend;
	private storageDir: string;
	private syncing = false;
	private syncInterval: Timer | null = null;

	constructor(storage: StorageBackend, storageDir: string) {
		this.storage = storage;
		this.storageDir = storageDir;
	}

	isConfigured(): boolean {
		return this.config !== null;
	}

	configure(config: GitForgeConfig): void {
		this.config = config;
		console.log(
			`GitForge sync configured: ${config.org}/${config.repo}`,
		);
	}

	disconnect(): void {
		this.stopAutoSync();
		this.config = null;
	}

	getConfig(): GitForgeConfig | null {
		return this.config ? { ...this.config } : null;
	}

	/**
	 * Sync all unsynced captures to GitForge.
	 * Each capture becomes two files in the repo:
	 * - captures/{id}.json (metadata + text)
	 * - images/{id}.png (screenshot)
	 */
	async syncAll(): Promise<{ synced: number; errors: number }> {
		if (!this.config || this.syncing) {
			return { synced: 0, errors: 0 };
		}

		this.syncing = true;
		let synced = 0;
		let errors = 0;

		try {
			const unsynced = await this.storage.getUnsynced();
			console.log(`GitForge: ${unsynced.length} captures to sync`);

			for (const capture of unsynced) {
				try {
					await this.syncCapture(capture);
					synced++;
				} catch (err) {
					console.error(`GitForge sync error for ${capture.id}:`, err);
					await this.storage.markSyncError(capture.id);
					errors++;
				}
			}
		} finally {
			this.syncing = false;
		}

		if (synced > 0) {
			console.log(`GitForge: synced ${synced} captures`);
		}

		return { synced, errors };
	}

	private async syncCapture(capture: Capture): Promise<void> {
		if (!this.config) throw new Error("Not configured");

		const { token, baseUrl, org, repo } = this.config;
		const headers = {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};

		// Prepare capture metadata JSON
		const captureData = {
			id: capture.id,
			text: capture.text,
			mode: capture.mode,
			createdAt: capture.createdAt,
			region:
				capture.regionX != null
					? {
							x: capture.regionX,
							y: capture.regionY,
							w: capture.regionW,
							h: capture.regionH,
						}
					: null,
		};

		// Read image file as base64
		const imagePath = join(this.storageDir, capture.imagePath);
		const imageData = readFileSync(imagePath);
		const imageBase64 = imageData.toString("base64");

		// Push files via GitForge API
		// Using the tree/blob API to create a commit with both files
		const commitPayload = {
			branch: "main",
			message: `capture: ${capture.id} (${capture.mode})`,
			files: [
				{
					path: `captures/${capture.id}.json`,
					content: JSON.stringify(captureData, null, 2),
					encoding: "utf-8",
				},
				{
					path: `images/${capture.id}.png`,
					content: imageBase64,
					encoding: "base64",
				},
			],
		};

		const res = await fetch(
			`${baseUrl}/api/repos/${org}/${repo}/commits`,
			{
				method: "POST",
				headers,
				body: JSON.stringify(commitPayload),
			},
		);

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`GitForge API error ${res.status}: ${body}`);
		}

		const result = (await res.json()) as { sha?: string; id?: string };
		const remoteId = result.sha ?? result.id ?? capture.id;

		await this.storage.markSynced(capture.id, remoteId);
	}

	/**
	 * Start auto-syncing every intervalMs (default 30s).
	 */
	startAutoSync(intervalMs = 30_000): void {
		this.stopAutoSync();
		this.syncInterval = setInterval(() => {
			this.syncAll().catch((err) =>
				console.error("GitForge auto-sync error:", err),
			);
		}, intervalMs);
		console.log(
			`GitForge auto-sync started (every ${intervalMs / 1000}s)`,
		);
	}

	stopAutoSync(): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
	}
}
