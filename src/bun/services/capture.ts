import { join } from "path";
import { mkdirSync, existsSync, unlinkSync } from "fs";
import * as native from "../ffi/screencopy-native";
import type { StorageBackend, Capture } from "../db/storage";

// ULID generator (time-sortable unique IDs, no dependency)
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function ulid(): string {
	const now = Date.now();
	let id = "";
	// Timestamp (10 chars, 48 bits)
	let t = now;
	for (let i = 9; i >= 0; i--) {
		id = ENCODING[t % 32]! + id;
		t = Math.floor(t / 32);
	}
	// Randomness (16 chars, 80 bits)
	for (let i = 0; i < 16; i++) {
		id += ENCODING[Math.floor(Math.random() * 32)];
	}
	return id;
}

export interface CaptureOptions {
	mode: "fullscreen" | "window" | "region";
	region?: { x: number; y: number; width: number; height: number };
	displayId?: number;
}

export class CaptureService {
	private storage: StorageBackend;
	private storageDir: string;

	constructor(storage: StorageBackend, storageDir: string) {
		this.storage = storage;
		this.storageDir = storageDir;

		// Ensure storage directories exist
		const imagesDir = join(storageDir, "images");
		if (!existsSync(imagesDir)) {
			mkdirSync(imagesDir, { recursive: true });
		}

		// Initialize native library
		native.init();
		console.log(`Screencopy native v${native.version()} loaded`);
	}

	async capture(opts: CaptureOptions): Promise<Capture> {
		const id = ulid();
		const filename = `${id}.png`;
		const imagePath = join(this.storageDir, "images", filename);

		const result = native.captureAndOCR(
			imagePath,
			opts.region,
			opts.displayId,
		);

		const capture: Capture = {
			id,
			imagePath: `images/${filename}`,
			text: result.text,
			textNormalized: result.text.toLowerCase().replace(/\s+/g, " ").trim(),
			mode: opts.mode,
			regionX: opts.region?.x,
			regionY: opts.region?.y,
			regionW: opts.region?.width,
			regionH: opts.region?.height,
			createdAt: Date.now(),
			syncStatus: "local",
		};

		await this.storage.saveCapture(capture);
		return capture;
	}

	async ocrFromFile(filePath: string): Promise<string> {
		return native.ocrFromFile(filePath);
	}

	async getCapture(id: string): Promise<Capture | null> {
		return this.storage.getCapture(id);
	}

	async listCaptures(limit = 50, offset = 0): Promise<Capture[]> {
		return this.storage.listCaptures({ limit, offset });
	}

	async searchCaptures(query: string, limit = 50): Promise<Capture[]> {
		return this.storage.searchCaptures(query, limit);
	}

	async deleteCapture(id: string): Promise<void> {
		const capture = await this.storage.getCapture(id);
		if (capture) {
			// Delete image file
			const fullPath = join(this.storageDir, capture.imagePath);
			if (existsSync(fullPath)) {
				unlinkSync(fullPath);
			}
			await this.storage.deleteCapture(id);
		}
	}

	getImagePath(relativePath: string): string {
		return join(this.storageDir, relativePath);
	}

	destroy(): void {
		native.deinit();
	}
}
