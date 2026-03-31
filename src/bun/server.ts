import { join } from "path";
import type { CaptureService } from "./services/capture";
import type { CopyPresetService } from "./services/copy-presets";
import type { GitForgeSyncService } from "./services/gitforge-sync";
import type { StorageBackend } from "./db/storage";

export function createServer(
	port: number,
	captureService: CaptureService,
	presetService: CopyPresetService,
	syncService: GitForgeSyncService,
	storage: StorageBackend,
	storageDir: string,
	onQuit: () => void,
) {
	const headers = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Content-Type": "application/json",
	};

	return Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);
			const path = url.pathname;

			// CORS preflight
			if (req.method === "OPTIONS") {
				return new Response(null, { status: 204, headers });
			}

			try {
				// POST /api/capture
				if (req.method === "POST" && path === "/api/capture") {
					const body = (await req.json()) as {
						mode?: string;
						region?: { x: number; y: number; width: number; height: number };
					};
					const capture = await captureService.capture({
						mode: (body.mode as "fullscreen" | "window" | "region") ?? "fullscreen",
						region: body.region,
					});
					return Response.json(capture, { headers });
				}

				// GET /api/captures?q=search&limit=50&offset=0
				if (req.method === "GET" && path === "/api/captures") {
					const q = url.searchParams.get("q");
					const limit = parseInt(url.searchParams.get("limit") ?? "50");
					const offset = parseInt(url.searchParams.get("offset") ?? "0");

					const captures = q
						? await captureService.searchCaptures(q, limit)
						: await captureService.listCaptures(limit, offset);
					return Response.json(captures, { headers });
				}

				// GET /api/captures/:id
				const captureMatch = path.match(/^\/api\/captures\/([^/]+)$/);
				if (req.method === "GET" && captureMatch) {
					const capture = await captureService.getCapture(captureMatch[1]);
					if (!capture) return Response.json({ error: "Not found" }, { status: 404, headers });
					return Response.json(capture, { headers });
				}

				// DELETE /api/captures/:id
				if (req.method === "DELETE" && captureMatch) {
					await captureService.deleteCapture(captureMatch[1]);
					return Response.json({ ok: true }, { headers });
				}

				// GET /api/captures/:id/image
				const imageMatch = path.match(/^\/api\/captures\/([^/]+)\/image$/);
				if (req.method === "GET" && imageMatch) {
					const capture = await captureService.getCapture(imageMatch[1]);
					if (!capture) return new Response("Not found", { status: 404 });
					const imagePath = captureService.getImagePath(capture.imagePath);
					const file = Bun.file(imagePath);
					if (!(await file.exists())) return new Response("Image not found", { status: 404 });
					return new Response(file, {
						headers: {
							"Content-Type": "image/png",
							"Access-Control-Allow-Origin": "*",
						},
					});
				}

				// POST /api/captures/:id/copy
				const copyMatch = path.match(/^\/api\/captures\/([^/]+)\/copy$/);
				if (req.method === "POST" && copyMatch) {
					const capture = await captureService.getCapture(copyMatch[1]);
					if (!capture) return Response.json({ error: "Not found" }, { status: 404, headers });
					const body = (await req.json()) as { preset?: string };
					const presetId = body.preset ?? "plain";
					const transformed = await presetService.applyAndCopy(presetId, capture.text);
					return Response.json({ text: transformed }, { headers });
				}

				// GET /api/presets
				if (req.method === "GET" && path === "/api/presets") {
					const presets = await presetService.getPresets();
					return Response.json(presets, { headers });
				}

				// GET /api/sync/status
				if (req.method === "GET" && path === "/api/sync/status") {
					const config = syncService.getConfig();
					return Response.json({
						configured: syncService.isConfigured(),
						org: config?.org ?? null,
						repo: config?.repo ?? null,
					}, { headers });
				}

				// POST /api/sync/configure
				if (req.method === "POST" && path === "/api/sync/configure") {
					const body = (await req.json()) as {
						token: string;
						org: string;
						repo: string;
						baseUrl?: string;
					};
					const config = {
						token: body.token,
						org: body.org,
						repo: body.repo,
						baseUrl: body.baseUrl ?? "https://api.gitforge.dev",
					};
					syncService.configure(config);
					syncService.startAutoSync();
					// Persist config
					await storage.setSetting("gitforge_config", JSON.stringify(config));
					return Response.json({ ok: true }, { headers });
				}

				// POST /api/sync/disconnect
				if (req.method === "POST" && path === "/api/sync/disconnect") {
					syncService.disconnect();
					await storage.setSetting("gitforge_config", "");
					return Response.json({ ok: true }, { headers });
				}

				// POST /api/sync/now
				if (req.method === "POST" && path === "/api/sync/now") {
					const result = await syncService.syncAll();
					return Response.json(result, { headers });
				}

				// POST /api/quit
				if (req.method === "POST" && path === "/api/quit") {
					onQuit();
					return Response.json({ ok: true }, { headers });
				}

				// Legacy quit endpoint
				if (path === "/quit") {
					onQuit();
					return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
				}

				return Response.json({ error: "Not found" }, { status: 404, headers });
			} catch (err) {
				console.error("API error:", err);
				return Response.json(
					{ error: String(err) },
					{ status: 500, headers },
				);
			}
		},
	});
}
