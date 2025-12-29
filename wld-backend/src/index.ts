export interface Env {
	wld_leads: IDBDatabase;
	// optional später: API_KEY als Secret
	// API_KEY: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// CORS Preflight
		if (request.method === "OPTIONS") {
			return cors(204);
		}

		if (url.pathname === "/api/health") {
			return corsJson(200, { ok: true, status: "ok" });
		}

		if (url.pathname === "/api/lead" && request.method === "POST") {
			return handleLead(request, env);
		}

		return corsJson(404, { ok: false, error: "not_found" });
	},
};

function cors(status = 200, extraHeaders: Record<string, string> = {}) {
	return new Response(null, {
		status,
		headers: {
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "GET,POST,OPTIONS",
			"access-control-allow-headers": "content-type",
			...extraHeaders,
		},
	});
}

function corsJson(status: number, data: unknown, extraHeaders: Record<string, string> = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"access-control-allow-origin": "*",
			"access-control-allow-methods": "GET,POST,OPTIONS",
			"access-control-allow-headers": "content-type",
			...extraHeaders,
		},
	});
}

function isValidEmail(v: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function safeStr(v: unknown, max = 4000): string {
	const s = String(v ?? "").trim();
	return s.length > max ? s.slice(0, max) : s;
}

// einfache ID ohne libs
function makeId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function handleLead(request: Request, env: Env): Promise<Response> {
	const contentType = request.headers.get("content-type") || "";
	let payload: Record<string, unknown> = {};

	if (contentType.includes("application/json")) {
		payload = await request.json().catch(() => ({}));
	} else {
		const form = await request.formData().catch(() => null);
		if (!form) return corsJson(400, { ok: false, reason: "invalid_form" });
		payload = Object.fromEntries(form.entries());
	}

	// Honeypot (Spam)
	if (payload.website) {
		return corsJson(200, { ok: true });
	}

	const name = safeStr(payload.name, 120);
	const email = safeStr(payload.email, 180);
	const company = safeStr(payload.company, 180);
	const plan = safeStr(payload.plan ?? payload.selectedPlan, 60);
	const message = safeStr(payload.message, 4000);
	const referrer = safeStr(request.headers.get("referer") || "", 500);

	if (!name || !email || !message) {
		return corsJson(400, { ok: false, reason: "missing_fields" });
	}
	if (!isValidEmail(email)) {
		return corsJson(400, { ok: false, reason: "invalid_email" });
	}
	if (message.length < 10) {
		return corsJson(400, { ok: false, reason: "message_too_short" });
	}

	const id = makeId();
	const created_at = new Date().toISOString();

	try {
		await env.wld_leads
			.prepare(
				`INSERT INTO leads (id, name, email, company, plan, message, referrer, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);`
			)
			.bind(id, name, email, company || null, plan || null, message, referrer || null, created_at)
			.run();

		return corsJson(200, { ok: true, id });
	} catch (err) {
		// intern loggen, extern keine Details leaken
		console.error("D1 insert failed:", err);
		return corsJson(500, { ok: false, reason: "db_insert_failed" });
	}
}
