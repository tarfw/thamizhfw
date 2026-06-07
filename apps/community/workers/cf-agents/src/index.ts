import { getDb } from "./db";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.CORS_ORIGIN ?? "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    const error = (msg: string, status = 400) => json({ error: msg }, status);

    const url = new URL(request.url);
    const path = url.pathname;
    let body: any = {};
    if (request.method !== "GET") {
      try {
        body = await request.json();
      } catch (e: any) {
        return json({ error: "Bad JSON body", detail: e.message });
      }
    }

    if (path === "/api/health") {
      return json({ status: "ok", app: "Thamizh Agents" });
    }

    try {
      const db = getDb(env);

      // ─── Archive ────────────────────────────────────────
      if (path === "/api/archive/ingest" && request.method === "POST") {
        const { title, source, language, content, url: docUrl } = body as any;
        if (!title) return error("title required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO documents (id, title, source, language, content, url) VALUES (?, ?, ?, ?, ?, ?)", [id, title, source ?? null, language ?? "ta", content ?? null, docUrl ?? null]);
        return json({ id, message: "Document ingested" }, 201);
      }

      if (path === "/api/archive/search" && request.method === "GET") {
        const q = url.searchParams.get("q");
        if (!q) return error("query param q required");
        const result = await db.execute("SELECT id, title, source, language, ingested_at FROM documents WHERE title LIKE ? OR content LIKE ? LIMIT 50", [`%${q}%`, `%${q}%`]);
        return json(result.rows);
      }

      // ─── Human Rights Evidence ─────────────────────────
      if (path === "/api/evidence/incidents" && request.method === "GET") {
        const result = await db.execute("SELECT * FROM incidents ORDER BY date DESC LIMIT 100");
        return json(result.rows);
      }

      if (path === "/api/evidence/incidents" && request.method === "POST") {
        const { title, date, location, description, category, severity } = body as any;
        if (!title) return error("title required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO incidents (id, title, date, location, description, category, severity) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, title, date ?? null, location ?? null, description ?? null, category ?? null, severity ?? 1]);
        return json({ id }, 201);
      }

      if (path.startsWith("/api/evidence/incidents/") && request.method === "GET") {
        const id = path.split("/").pop();
        const result = await db.execute("SELECT * FROM incidents WHERE id = ?", [id]);
        if (result.rows.length === 0) return error("Not found", 404);
        return json(result.rows[0]);
      }

      if (path.startsWith("/api/evidence/incidents/") && request.method === "PUT") {
        const id = path.split("/").pop();
        const { title, date, location, description, category, severity } = body as any;
        const existing = await db.execute("SELECT id FROM incidents WHERE id = ?", [id]);
        if (existing.rows.length === 0) return error("Not found", 404);
        await db.execute("UPDATE incidents SET title = COALESCE(?, title), date = COALESCE(?, date), location = COALESCE(?, location), description = COALESCE(?, description), category = COALESCE(?, category), severity = COALESCE(?, severity) WHERE id = ?", [title ?? null, date ?? null, location ?? null, description ?? null, category ?? null, severity ?? null, id]);
        return json({ id });
      }

      // ─── Fact-Check ─────────────────────────────────────
      if (path === "/api/factcheck/verify" && request.method === "POST") {
        const { text, source_url } = body as any;
        if (!text) return error("text required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO claims (id, text, source_url) VALUES (?, ?, ?)", [id, text, source_url ?? null]);
        return json({ id, status: "pending", message: "Claim submitted for verification" }, 201);
      }

      if (path === "/api/factcheck/claims" && request.method === "GET") {
        const result = await db.execute("SELECT * FROM claims ORDER BY checked_at DESC LIMIT 50");
        return json(result.rows);
      }

      // ─── Translation ────────────────────────────────────
      if (path === "/api/translate" && request.method === "POST") {
        const { text, source_lang, target_lang } = body as any;
        if (!text || !target_lang) return error("text and target_lang required");
        const cached = await db.execute("SELECT translated_text FROM translations_cache WHERE source_text = ? AND source_lang = ? AND target_lang = ?", [text, source_lang ?? "ta", target_lang]);
        if (cached.rows.length > 0) return json({ translated_text: cached.rows[0].translated_text, cached: true });
        return json({ translated_text: `[${source_lang ?? "ta"}→${target_lang}] ${text}`, cached: false });
      }

      // ─── Timeline ───────────────────────────────────────
      if (path === "/api/timeline" && request.method === "GET") {
        const category = url.searchParams.get("category");
        const result = category
          ? await db.execute("SELECT * FROM timeline_events WHERE category = ? ORDER BY date DESC LIMIT 200", [category])
          : await db.execute("SELECT * FROM timeline_events ORDER BY date DESC LIMIT 200");
        return json(result.rows);
      }

      if (path === "/api/timeline" && request.method === "POST") {
        const { title, date, date_precision, end_date, location, description, category, severity } = body as any;
        if (!title || !date) return error("title and date required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO timeline_events (id, title, date, date_precision, end_date, location, description, category, severity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, title, date, date_precision ?? "exact", end_date ?? null, location ?? null, description ?? null, category ?? null, severity ?? 1]);
        return json({ id }, 201);
      }

      // ─── Legal Research ─────────────────────────────────
      if (path === "/api/legal/docs" && request.method === "GET") {
        const result = await db.execute("SELECT id, title, source, summary, language, indexed_at FROM legal_docs ORDER BY indexed_at DESC LIMIT 50");
        return json(result.rows);
      }

      if (path === "/api/legal/conventions" && request.method === "GET") {
        const result = await db.execute("SELECT id, name, short_name, type, summary FROM conventions ORDER BY name");
        return json(result.rows);
      }

      // ─── Diaspora ───────────────────────────────────────
      if (path === "/api/diaspora/events" && request.method === "GET") {
        const result = await db.execute("SELECT * FROM events ORDER BY date DESC LIMIT 50");
        return json(result.rows);
      }

      if (path === "/api/diaspora/events" && request.method === "POST") {
        const { title, type, date, location, description, organizer } = body as any;
        if (!title || !type) return error("title and type required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO events (id, title, type, date, location, description, organizer) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, title, type, date ?? null, location ?? null, description ?? null, organizer ?? null]);
        return json({ id }, 201);
      }

      if (path === "/api/diaspora/volunteers" && request.method === "POST") {
        const { name, email, location, skills, event_id } = body as any;
        if (!email) return error("email required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO volunteers (id, name, email, location, skills, event_id) VALUES (?, ?, ?, ?, ?, ?)", [id, name ?? null, email, location ?? null, skills ?? null, event_id ?? null]);
        return json({ id }, 201);
      }

      // ─── Media Monitoring ───────────────────────────────
      if (path === "/api/media" && request.method === "GET") {
        const source = url.searchParams.get("source");
        const result = source
          ? await db.execute("SELECT * FROM media_mentions WHERE source = ? ORDER BY published_at DESC LIMIT 100", [source])
          : await db.execute("SELECT * FROM media_mentions ORDER BY published_at DESC LIMIT 100");
        return json(result.rows);
      }

      // ─── Oral History ───────────────────────────────────
      if (path === "/api/oral/testimonies" && request.method === "POST") {
        const { witness_name, age, location, language, transcript } = body as any;
        if (!witness_name || !transcript) return error("witness_name and transcript required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO testimonies (id, witness_name, age, location, language, transcript) VALUES (?, ?, ?, ?, ?, ?)", [id, witness_name, age ?? null, location ?? null, language ?? "ta", transcript]);
        return json({ id, status: "draft" }, 201);
      }

      if (path === "/api/oral/testimonies" && request.method === "GET") {
        const result = await db.execute("SELECT id, witness_name, age, location, language, status, created_at FROM testimonies ORDER BY created_at DESC LIMIT 100");
        return json(result.rows);
      }

      // ─── Narrative Analysis ─────────────────────────────
      if (path === "/api/narrative/analyze" && request.method === "POST") {
        const { type, query } = body as any;
        if (!type || !query) return error("type and query required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO analysis_runs (id, type, query, summary) VALUES (?, ?, ?, ?)", [id, type, query, `Analysis of "${query}" submitted for processing`]);
        return json({ id, message: "Analysis queued" }, 201);
      }

      // ─── Educational ────────────────────────────────────
      if (path === "/api/educational/explainers" && request.method === "GET") {
        const type = url.searchParams.get("type");
        const lang = url.searchParams.get("lang") ?? "ta";
        const result = type
          ? await db.execute("SELECT * FROM explainers WHERE type = ? AND language = ? ORDER BY published_at DESC", [type, lang])
          : await db.execute("SELECT * FROM explainers ORDER BY published_at DESC");
        return json(result.rows);
      }

      // ─── Memorial ───────────────────────────────────────
      if (path === "/api/memorial" && request.method === "POST") {
        const { victim_name, age, village, district, date_of_death, photo_url, biography } = body as any;
        if (!victim_name) return error("victim_name required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO memorials (id, victim_name, age, village, district, date_of_death, photo_url, biography) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, victim_name, age ?? null, village ?? null, district ?? null, date_of_death ?? null, photo_url ?? null, biography ?? null]);
        return json({ id }, 201);
      }

      if (path === "/api/memorial" && request.method === "GET") {
        const district = url.searchParams.get("district");
        const result = district
          ? await db.execute("SELECT * FROM memorials WHERE district = ? ORDER BY victim_name LIMIT 200", [district])
          : await db.execute("SELECT * FROM memorials ORDER BY victim_name LIMIT 200");
        return json(result.rows);
      }

      // ─── Policy Advocacy ────────────────────────────────
      if (path === "/api/policy/letters" && request.method === "POST") {
        const { title, recipient_type, recipient_name, body: letterBody } = body as any;
        if (!title || !recipient_type || !letterBody) return error("title, recipient_type, and body required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO letters (id, title, recipient_type, recipient_name, body) VALUES (?, ?, ?, ?, ?)", [id, title, recipient_type, recipient_name ?? null, letterBody]);
        return json({ id, status: "draft" }, 201);
      }

      // ─── OSINT ──────────────────────────────────────────
      if (path === "/api/osint/assets" && request.method === "POST") {
        const { type, url: assetUrl, coordinates, description } = body as any;
        if (!type || !assetUrl) return error("type and url required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO osint_assets (id, type, url, coordinates, description) VALUES (?, ?, ?, ?, ?)", [id, type, assetUrl, coordinates ?? null, description ?? null]);
        return json({ id }, 201);
      }

      if (path === "/api/osint/assets" && request.method === "GET") {
        const type = url.searchParams.get("type");
        const result = type
          ? await db.execute("SELECT * FROM osint_assets WHERE type = ? ORDER BY created_at DESC", [type])
          : await db.execute("SELECT * FROM osint_assets ORDER BY created_at DESC");
        return json(result.rows);
      }

      // ─── Counter-Hate ───────────────────────────────────
      if (path === "/api/counter-hate/report" && request.method === "POST") {
        const { url: reportUrl, platform, content, type, severity } = body as any;
        if (!reportUrl || !type) return error("url and type required");
        const id = crypto.randomUUID();
        await db.execute("INSERT INTO flagged_content (id, url, platform, content, type, severity) VALUES (?, ?, ?, ?, ?, ?)", [id, reportUrl, platform ?? null, content ?? null, type, severity ?? 1]);
        return json({ id, status: "reported" }, 201);
      }

      return json({ error: "Not found" }, 404);
    } catch (err: any) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  },
};

interface Env {
  TURSO_DB_URL: string;
  TURSO_DB_TOKEN: string;
  CORS_ORIGIN: string;
  APP_NAME: string;
}
