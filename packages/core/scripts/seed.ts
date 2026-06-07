import { config } from 'dotenv';
config();

import { TursoJournalismStorage } from '../src/journalism/turso-storage';

const url = process.env.TURSO_DATABASE_URL || process.env.EXPO_PUBLIC_TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const storage = new TursoJournalismStorage({ url, authToken });

async function main() {
  console.log('Seeding journalism database...');

  await storage.runMigrations();
  console.log('✓ Migrations applied');

  // Entities
  const entities = await storage.bulkCreateEntities([
    { type: 'person', name: 'M.K. Stalin', aliases: ['Stalin', 'Chief Minister'], description: 'Chief Minister of Tamil Nadu, DMK leader', metadata: { party: 'DMK', role: 'CM' } },
    { type: 'person', name: 'Udhayanidhi Stalin', aliases: ['Udhay'], description: 'Minister for Youth Welfare and Sports Development', metadata: { party: 'DMK' } },
    { type: 'person', name: 'Edappadi K. Palaniswami', aliases: ['EPS', 'Palaniswami'], description: 'Former Chief Minister, AIADMK leader', metadata: { party: 'AIADMK' } },
    { type: 'person', name: 'O. Panneerselvam', aliases: ['OPS'], description: 'Former Chief Minister, AIADMK leader', metadata: { party: 'AIADMK' } },
    { type: 'person', name: 'K. Annamalai', aliases: ['Annamalai'], description: 'Tamil Nadu BJP President', metadata: { party: 'BJP' } },
    { type: 'organization', name: 'DMK', aliases: ['Dravida Munnetra Kazhagam'], description: 'Dravidian political party in Tamil Nadu', metadata: { founded: 1949 } },
    { type: 'organization', name: 'AIADMK', aliases: ['All India Anna Dravida Munnetra Kazhagam'], description: 'Dravidian political party in Tamil Nadu', metadata: { founded: 1972 } },
    { type: 'organization', name: 'BJP Tamil Nadu', aliases: ['Bharatiya Janata Party TN'], description: 'Tamil Nadu state unit of BJP', metadata: {} },
    { type: 'organization', name: 'Greater Chennai Corporation', aliases: ['GCC', 'Chennai Corporation'], description: 'Municipal body governing Chennai', metadata: {} },
    { type: 'location', name: 'Chennai', aliases: ['Madras'], description: 'Capital of Tamil Nadu', metadata: { type: 'city' } },
    { type: 'location', name: 'Coimbatore', aliases: [], description: 'Major industrial city in Tamil Nadu', metadata: { type: 'city' } },
    { type: 'location', name: 'Madurai', aliases: [], description: 'Cultural capital of Tamil Nadu', metadata: { type: 'city' } },
    { type: 'event', name: 'Kalaignar Magalir Urimai Thittam', aliases: ['Women\'s Rights Scheme'], description: 'Monthly financial assistance scheme for women heads of families in Tamil Nadu', metadata: { launched: '2023' } },
    { type: 'event', name: 'Pudhumai Penn Scheme', aliases: [], description: 'Education assistance scheme for girls in government schools', metadata: { launched: '2022' } },
    { type: 'event', name: 'Chennai Water Crisis 2026', aliases: [], description: 'Acute water shortage affecting Chennai in May 2026', metadata: { severity: 'high' } },
  ]);
  console.log(`✓ Created ${entities.length} entities`);

  // Articles (May 2026 - last month)
  const articles = await storage.bulkCreateArticles([
    {
      slug: 'chennai-water-crisis-2026',
      title: 'Chennai Water Crisis Deepens as Reservoir Levels Hit 20%',
      body: 'The water crisis in Chennai has reached critical levels with the four main reservoirs supplying the city recording only 20% of their capacity. Greater Chennai Corporation officials have announced water rationing across all zones...\n\nThe crisis has been compounded by failed monsoon predictions and inadequate infrastructure investments over the past decade. Residents in southern suburbs like Pallavaram and Tambaram are receiving water only once every four days...\n\nActivists have pointed to the lack of long-term planning and the failure to implement rainwater harvesting mandates effectively.',
      excerpt: 'Reservoirs at 20% capacity as city implements emergency water rationing across all zones.',
      status: 'published',
      category: 'environment',
      tags: ['water', 'chennai', 'crisis', 'infrastructure'],
      publishedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: 'https://example.gov.in/water-report-2026.pdf',
      metadata: { readingTime: 8 },
    },
    {
      slug: 'kalaignar-scheme-expansion-2026',
      title: 'Tamil Nadu Expands Kalaignar Women\'s Scheme to Cover 1.5 Crore Families',
      body: 'In a significant welfare expansion, the Tamil Nadu government has announced that the Kalaignar Magalir Urimai Thittam will now cover 1.5 crore families, up from 1.16 crore previously...\n\nChief Minister M.K. Stalin unveiled the expansion at a public event in Madurai, stating that the monthly transfer of ₹1,000 has been credited to bank accounts of eligible beneficiaries...\n\nOpposition leader Edappadi K. Palaniswami criticized the scheme as a "vote-buying tactic" ahead of upcoming local body elections.',
      excerpt: 'Government expands women\'s financial assistance scheme to reach 1.5 crore families statewide.',
      status: 'published',
      category: 'politics',
      tags: ['welfare', 'women', 'scheme', 'election'],
      publishedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: 'https://example.gov.in/kalaignar-scheme.pdf',
      metadata: {},
    },
    {
      slug: 'coimbatore-industrial-corridor-investigation',
      title: 'Investigation: Land Acquisition Irregularities in Coimbatore Industrial Corridor',
      body: 'A three-month investigation by Thamizhi has uncovered systematic irregularities in the acquisition of agricultural land for the Coimbatore-Salem Industrial Corridor...\n\nDocuments obtained under the Right to Information Act show that 2,300 acres of land were acquired at rates 40% below the market value, with several officials allegedly receiving kickbacks...\n\nThe Greater Chennai Corporation and state industries department have not responded to requests for comment. Affected farmers have formed a coordination committee demanding compensation and a CBI inquiry.',
      excerpt: 'Systematic under-compensation of farmers in Coimbatore-Salem industrial corridor exposed.',
      status: 'published',
      category: 'investigative',
      tags: ['land', 'corruption', 'coimbatore', 'investigation'],
      publishedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
      authorId: 'investigative-team',
      sourceUrl: null,
      metadata: { investigation: true, duration: '3 months' },
    },
    {
      slug: 'aiadmk-leadership-crisis-2026',
      title: 'AIADMK Leadership Crisis Deepens as EPS-OPS Factionalism Returns',
      body: 'The AIADMK is once again grappling with internal factionalism as the EPS and OPS camps have issued contradictory statements on alliance negotiations for upcoming elections...\n\nFormer Chief Minister Edappadi K. Palaniswami has called for a united front with the BJP, while O. Panneerselvam\'s faction has expressed reservations about ceding too many seats...\n\nPolitical analysts suggest that the unresolved leadership question continues to weaken the party\'s prospects against the ruling DMK.',
      excerpt: 'EPS and OPS camps issue contradictory statements on alliance strategy.',
      status: 'published',
      category: 'politics',
      tags: ['aiadmk', 'politics', 'alliance', 'bjp'],
      publishedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: null,
      metadata: {},
    },
    {
      slug: 'pudhumai-penn-scheme-impact',
      title: 'Pudhumai Penn Scheme: How Education Assistance Changed Lives in Rural Tamil Nadu',
      body: 'Five years after its launch, the Pudhumai Penn Scheme has emerged as one of the most successful educational interventions in Tamil Nadu, with enrollment of girls in government schools rising by 35%...\n\nThe scheme provides ₹1,000 monthly to girls studying in classes 6 to 12 in government schools, conditional on 75% attendance. An independent evaluation by the Madras Institute of Development Studies found that dropout rates among adolescent girls have fallen by half...\n\nMinister Udhayanidhi Stalin, who championed the scheme, attributes its success to direct benefit transfer and the elimination of middlemen.',
      excerpt: 'Independent study shows 35% rise in girls\' enrollment in government schools since scheme launch.',
      status: 'published',
      category: 'local',
      tags: ['education', 'girls', 'welfare', 'scheme'],
      publishedAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: 'https://example.org/pudhumai-evaluation.pdf',
      metadata: {},
    },
  ]);
  console.log(`✓ Created ${articles.length} articles`);

  // Link articles to entities
  const entityMap = new Map(entities.map((e) => [e.name, e.id]));
  for (const article of articles) {
    const title = article.title.toLowerCase() + ' ' + article.body.toLowerCase();
    for (const [name, id] of entityMap) {
      if (title.includes(name.toLowerCase())) {
        await storage.linkArticleEntity(article.id, id, 0.8, `Mentioned in: ${article.title}`);
      }
    }
  }
  console.log('✓ Linked articles to entities');

  // Connections
  const getId = (name: string) => entityMap.get(name)!;
  await storage.bulkCreateConnections([
    { sourceId: getId('M.K. Stalin'), targetId: getId('DMK'), relationship: 'member_of', strength: 1.0, evidence: [] },
    { sourceId: getId('Udhayanidhi Stalin'), targetId: getId('DMK'), relationship: 'member_of', strength: 1.0, evidence: [] },
    { sourceId: getId('Udhayanidhi Stalin'), targetId: getId('M.K. Stalin'), relationship: 'related_to', strength: 0.9, evidence: [] },
    { sourceId: getId('Edappadi K. Palaniswami'), targetId: getId('AIADMK'), relationship: 'member_of', strength: 1.0, evidence: [] },
    { sourceId: getId('O. Panneerselvam'), targetId: getId('AIADMK'), relationship: 'member_of', strength: 1.0, evidence: [] },
    { sourceId: getId('K. Annamalai'), targetId: getId('BJP Tamil Nadu'), relationship: 'works_for', strength: 1.0, evidence: [] },
    { sourceId: getId('BJP Tamil Nadu'), targetId: getId('AIADMK'), relationship: 'related_to', strength: 0.6, evidence: [] },
    { sourceId: getId('Greater Chennai Corporation'), targetId: getId('Chennai'), relationship: 'located_in', strength: 1.0, evidence: [] },
    { sourceId: getId('Kalaignar Magalir Urimai Thittam'), targetId: getId('M.K. Stalin'), relationship: 'participated_in', strength: 0.9, evidence: [] },
    { sourceId: getId('Kalaignar Magalir Urimai Thittam'), targetId: getId('DMK'), relationship: 'participated_in', strength: 0.9, evidence: [] },
    { sourceId: getId('Pudhumai Penn Scheme'), targetId: getId('Udhayanidhi Stalin'), relationship: 'participated_in', strength: 0.9, evidence: [] },
    { sourceId: getId('Pudhumai Penn Scheme'), targetId: getId('DMK'), relationship: 'participated_in', strength: 0.9, evidence: [] },
    { sourceId: getId('Chennai Water Crisis 2026'), targetId: getId('Chennai'), relationship: 'located_in', strength: 1.0, evidence: [] },
    { sourceId: getId('Chennai Water Crisis 2026'), targetId: getId('Greater Chennai Corporation'), relationship: 'related_to', strength: 0.8, evidence: [] },
  ]);
  console.log('✓ Created connections');

  console.log('✅ Seed complete!');
  await storage.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});