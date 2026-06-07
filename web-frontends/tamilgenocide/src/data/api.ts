import type { TimelineEvent, Incident, Memorial, Testimony, Convention, LegalDoc, MediaMention } from "./types";

const TURSO_URL = typeof import.meta !== 'undefined'
  ? import.meta.env.PUBLIC_TURSO_DB_URL?.replace("libsql://", "https://") + "/v2/pipeline"
  : "";
const TURSO_TOKEN = typeof import.meta !== 'undefined' ? import.meta.env.PUBLIC_TURSO_DB_TOKEN : "";

interface TursoRow { cols: { name: string; decltype: string }[]; rows: { type: string; value: unknown }[][] }

async function query(sql: string): Promise<TursoRow> {
  const res = await fetch(TURSO_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TURSO_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql } }] }),
  });
  if (!res.ok) throw new Error(`Turso error ${res.status}`);
  const json = await res.json();
  const result = json.results?.[0]?.response?.result;
  if (!result) {
    const errMsg = json.results?.[0]?.error?.message || "Turso returned no result";
    throw new Error(errMsg);
  }
  return { cols: result.cols, rows: result.rows };
}

function mapRow<T>(row: TursoRow, mapper: (cols: string[], vals: unknown[]) => T): T[] {
  const colNames = row.cols.map((c) => c.name);
  return row.rows.map((r) => mapper(colNames, r.map((cell) => cell.value)));
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  const data = await query("SELECT * FROM timeline_events ORDER BY date");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    date: vals[cols.indexOf("date")] as string || "",
    title: vals[cols.indexOf("title")] as string,
    category: vals[cols.indexOf("category")] as string || "other",
    location: vals[cols.indexOf("location")] as string || "",
    description: vals[cols.indexOf("description")] as string || "",
    severity: Number(vals[cols.indexOf("severity")] ?? 1),
  }));
}

export async function getIncidents(): Promise<Incident[]> {
  const data = await query("SELECT * FROM incidents ORDER BY created_at DESC");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    title: vals[cols.indexOf("title")] as string,
    date: vals[cols.indexOf("date")] as string || "",
    location: vals[cols.indexOf("location")] as string || "",
    description: vals[cols.indexOf("description")] as string || "",
    category: vals[cols.indexOf("category")] as string || "",
    severity: Number(vals[cols.indexOf("severity")] ?? 1),
    evidenceCount: 0,
    witnessCount: 0,
  }));
}

export async function getMemorials(): Promise<Memorial[]> {
  const data = await query("SELECT * FROM memorials ORDER BY victim_name");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    victimName: vals[cols.indexOf("victim_name")] as string ?? "",
    age: Number(vals[cols.indexOf("age")] ?? 0),
    village: vals[cols.indexOf("village")] as string ?? "",
    district: vals[cols.indexOf("district")] as string ?? "",
    dateOfDeath: vals[cols.indexOf("date_of_death")] as string ?? "",
    biography: vals[cols.indexOf("biography")] as string ?? "",
  }));
}

export async function getTestimonies(): Promise<Testimony[]> {
  const data = await query("SELECT * FROM testimonies WHERE status != 'archived'");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    witnessName: vals[cols.indexOf("witness_name")] as string ?? "",
    age: Number(vals[cols.indexOf("age")] ?? 0),
    location: vals[cols.indexOf("location")] as string ?? "",
    transcript: vals[cols.indexOf("transcript")] as string ?? "",
    dateRecorded: vals[cols.indexOf("date_recorded")] as string ?? "",
    status: vals[cols.indexOf("status")] as string ?? "draft",
  }));
}

export async function getConventions(): Promise<Convention[]> {
  const data = await query("SELECT * FROM conventions");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    name: vals[cols.indexOf("name")] as string,
    shortName: vals[cols.indexOf("short_name")] as string ?? "",
    type: vals[cols.indexOf("type")] as string ?? "",
    summary: vals[cols.indexOf("summary")] as string ?? "",
    articles: [],
  }));
}

export async function getLegalDocs(): Promise<LegalDoc[]> {
  const data = await query("SELECT * FROM legal_docs");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    title: vals[cols.indexOf("title")] as string,
    source: vals[cols.indexOf("source")] as string ?? "",
    summary: vals[cols.indexOf("summary")] as string ?? "",
    date: vals[cols.indexOf("indexed_at")] as string ?? "",
  }));
}

export async function getMediaMentions(): Promise<MediaMention[]> {
  const data = await query("SELECT * FROM media_mentions ORDER BY published_at DESC");
  return mapRow(data, (cols, vals) => ({
    id: vals[cols.indexOf("id")] as string,
    title: vals[cols.indexOf("title")] as string ?? "",
    source: vals[cols.indexOf("source")] as string ?? "",
    url: vals[cols.indexOf("url")] as string ?? "",
    publishedAt: vals[cols.indexOf("published_at")] as string ?? "",
    sentiment: vals[cols.indexOf("sentiment")] as string ?? "neutral",
    summary: "",
  }));
}
