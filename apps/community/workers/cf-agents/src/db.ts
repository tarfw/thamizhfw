export function getDb(env: { TURSO_DB_URL?: string; TURSO_DB_TOKEN?: string }) {
  const url = env.TURSO_DB_URL;
  const token = env.TURSO_DB_TOKEN;
  if (!url || !token) {
    throw new Error("TURSO_DB_URL and TURSO_DB_TOKEN must be set");
  }
  const httpUrl = url.replace("libsql://", "https://");

  function toValue(v: any) {
    if (v === null || v === undefined) return { type: "null" };
    return { type: "text", value: String(v) };
  }

  async function query(sql: string, args: any[] = []) {
    const body = { stmt: { sql, args: args.map(toValue) } };
    const res = await fetch(`${httpUrl}/v1/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Turso error (${res.status}): ${text}`);
    }
    const json: any = await res.json();
    const rows = json?.result?.rows ?? [];
    const cols = json?.result?.cols ?? [];
    return {
      rows: rows.map((row: any[]) => {
        const obj: any = {};
        row.forEach((val: any, i: number) => {
          obj[cols[i]?.name ?? `col${i}`] = val?.value ?? val;
        });
        return obj;
      }),
    };
  }

  return {
    execute: (input: any, args?: any[]) => {
      if (typeof input === "string") return query(input, args ?? []);
      return query(input.sql, input.args ?? []);
    },
  };
}
