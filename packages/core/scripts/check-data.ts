import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');
config({ path: envPath });

import { TursoJournalismStorage } from '../src/journalism/turso-storage';

const url = process.env.TURSO_DATABASE_URL || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const storage = new TursoJournalismStorage({ url, authToken });

async function main() {
  await storage.runMigrations();
  
  const count = await storage.listArticles({ limit: 100, offset: 0, status: 'published' });
  console.log('Published articles:', count.total);
  console.log('Article slugs & categories:');
  count.articles.forEach(a => console.log(`  - ${a.slug} (${a.category})`));
  
  const wv = count.articles.filter(a => a.category === 'women-violence');
  console.log(`\nWomen-violence articles: ${wv.length}`);
  wv.forEach(a => console.log(`  - ${a.slug}: ${a.title}`));
  
  await storage.close();
}

main().catch(err => { console.error('Failed:', err); process.exit(1); });
