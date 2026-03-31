import { dlopen, FFIType, suffix, ptr, CString } from "bun:ffi";
import { join } from "path";

// Resolve library path - check multiple locations
function findLibrary(): string {
	const libName = `libscreencopy.${suffix}`;
	const candidates = [
		// Dev: relative to source
		join(import.meta.dir, "../../zig/zig-out/lib", libName),
		// Electrobun bundled: Resources/app/MacOS/
		join(process.cwd(), "..", "Resources", "app", "MacOS", libName),
		// Electrobun bundled: same dir as cwd
		join(process.cwd(), libName),
		// Fallback: project root
		join(import.meta.dir, "../../../src/zig/zig-out/lib", libName),
	];

	for (const path of candidates) {
		try {
			if (Bun.file(path).size > 0) {
				console.log(`Loaded native library: ${path}`);
				return path;
			}
		} catch {
			// file doesn't exist, try next
		}
	}

	throw new Error(
		`${libName} not found. Run 'cd src/zig && zig build' first.\nSearched: ${candidates.join(", ")}`,
	);
}

const lib = dlopen(findLibrary(), {
	sc_init: {
		returns: FFIType.i32,
		args: [],
	},
	sc_deinit: {
		returns: FFIType.void,
		args: [],
	},
	sc_capture_fullscreen: {
		returns: FFIType.i32,
		args: [FFIType.u32, FFIType.cstring],
	},
	sc_capture_region: {
		returns: FFIType.i32,
		args: [FFIType.i32, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.cstring],
	},
	sc_ocr_from_file: {
		returns: FFIType.i32,
		args: [FFIType.cstring, FFIType.ptr, FFIType.u32],
	},
	sc_capture_and_ocr: {
		returns: FFIType.i32,
		args: [
			FFIType.u32, // display_id
			FFIType.i32, // x
			FFIType.i32, // y
			FFIType.i32, // w
			FFIType.i32, // h
			FFIType.cstring, // image_out_path
			FFIType.ptr, // text_buf
			FFIType.u32, // text_buf_len
		],
	},
	sc_version: {
		returns: FFIType.cstring,
		args: [],
	},
});

export const native = lib.symbols;

// Text buffer size for OCR results (256KB should handle full pages)
const TEXT_BUF_SIZE = 256 * 1024;

export interface CaptureResult {
	imagePath: string;
	text: string;
}

export interface Region {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function init(): number {
	return native.sc_init();
}

export function deinit(): void {
	native.sc_deinit();
}

export function version(): string {
	try {
		const v = native.sc_version();
		if (typeof v === "number" && v !== 0) {
			return new CString(v).toString();
		}
		return String(v ?? "unknown");
	} catch {
		return "unknown";
	}
}

export function captureFullscreen(
	outputPath: string,
	displayId = 0,
): number {
	const pathBuf = Buffer.from(outputPath + "\0", "utf-8");
	return native.sc_capture_fullscreen(displayId, ptr(pathBuf));
}

export function captureRegion(
	region: Region,
	outputPath: string,
): number {
	const pathBuf = Buffer.from(outputPath + "\0", "utf-8");
	return native.sc_capture_region(
		region.x,
		region.y,
		region.width,
		region.height,
		ptr(pathBuf),
	);
}

export function ocrFromFile(imagePath: string): string {
	const pathBuf = Buffer.from(imagePath + "\0", "utf-8");
	const textBuf = new Uint8Array(TEXT_BUF_SIZE);
	const bytesWritten = native.sc_ocr_from_file(
		ptr(pathBuf),
		ptr(textBuf),
		TEXT_BUF_SIZE,
	);
	if (bytesWritten < 0) {
		throw new Error(`OCR failed with error code: ${bytesWritten}`);
	}
	return new TextDecoder().decode(textBuf.subarray(0, bytesWritten));
}

export function captureAndOCR(
	outputPath: string,
	region?: Region,
	displayId = 0,
): CaptureResult {
	const pathBuf = Buffer.from(outputPath + "\0", "utf-8");
	const textBuf = new Uint8Array(TEXT_BUF_SIZE);

	const x = region?.x ?? 0;
	const y = region?.y ?? 0;
	const w = region?.width ?? 0;
	const h = region?.height ?? 0;

	const bytesWritten = native.sc_capture_and_ocr(
		displayId,
		x,
		y,
		w,
		h,
		ptr(pathBuf),
		ptr(textBuf),
		TEXT_BUF_SIZE,
	);

	if (bytesWritten < 0) {
		throw new Error(`Capture+OCR failed with error code: ${bytesWritten}`);
	}

	return {
		imagePath: outputPath,
		text: new TextDecoder().decode(textBuf.subarray(0, bytesWritten)),
	};
}
