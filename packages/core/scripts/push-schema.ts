import { config } from 'dotenv';
config();

import { TursoJournalismStorage } from '../src/journalism/turso-storage';

const url = process.env.TURSO_DATABASE_URL || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  console.error('Set them in .env or pass as environment variables');
  process.exit(1);
}

const storage = new TursoJournalismStorage({ url, authToken });

async function main() {
  console.log('Pushing schema to Turso...');
  await storage.runMigrations();
  const health = await storage.healthCheck();
  console.log(`✓ Schema applied. Health: ${health.status} (${health.latency}ms)`);
  await storage.close();
}

main().catch((err) => {
  console.error('Failed to push schema:', err);
  process.exit(1);
});