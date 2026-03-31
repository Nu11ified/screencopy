import type { StorageBackend, Preset } from "../db/storage";

// Built-in transform functions
const TRANSFORMS: Record<string, (text: string) => string> = {
	plain: (t) => t.replace(/\s+/g, " ").trim(),
	raw: (t) => t,
	json: (t) => JSON.stringify(t),
	yaml: (t) =>
		t
			.split("\n")
			.filter((l) => l.trim())
			.map((line) => `- ${JSON.stringify(line)}`)
			.join("\n"),
};

export class CopyPresetService {
	private storage: StorageBackend;

	constructor(storage: StorageBackend) {
		this.storage = storage;
	}

	async getPresets(): Promise<Preset[]> {
		return this.storage.getPresets();
	}

	async applyPreset(presetId: string, text: string): Promise<string> {
		// Check built-in first
		if (TRANSFORMS[presetId]) {
			return TRANSFORMS[presetId](text);
		}

		// Check custom presets
		const presets = await this.storage.getPresets();
		const preset = presets.find((p) => p.id === presetId);
		if (!preset) {
			return text; // fallback to raw
		}

		if (preset.type !== "custom" || !preset.template) {
			// Use built-in transform for the type
			return (TRANSFORMS[preset.type] ?? TRANSFORMS.raw)(text);
		}

		// Custom template: replace {{text}} and {{lines}}
		const lines = text.split("\n").filter((l) => l.trim());
		return preset.template
			.replace(/\{\{text\}\}/g, text)
			.replace(/\{\{lines\}\}/g, JSON.stringify(lines));
	}

	async copyToClipboard(text: string): Promise<void> {
		// Use pbcopy on macOS
		const proc = Bun.spawn(["pbcopy"], {
			stdin: "pipe",
		});
		proc.stdin.write(text);
		proc.stdin.end();
		await proc.exited;
	}

	async applyAndCopy(presetId: string, text: string): Promise<string> {
		const transformed = await this.applyPreset(presetId, text);
		await this.copyToClipboard(transformed);
		return transformed;
	}
}
