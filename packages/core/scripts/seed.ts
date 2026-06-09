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
    // ── Women Violence ────────────────────────────────────────────
    {
      slug: 'domestic-violence-tn-rise-2025',
      title: 'Domestic Violence Cases in Tamil Nadu Rise 22% in 2025, NCRB Data Shows',
      body: 'The National Crime Records Bureau has released its annual report for 2025, showing a 22% increase in registered domestic violence cases in Tamil Nadu compared to the previous year. A total of 38,742 complaints were filed under the Protection of Women from Domestic Violence Act, 2005. Chennai accounted for 8,200 cases, followed by Coimbatore (5,400) and Madurai (4,100). Women\'s rights activists attribute the rise to increased awareness and reporting mechanisms, particularly through the Tamil Nadu government\'s All-Women Police Stations, but also point to a deep-rooted crisis. "The rise doesn\'t mean violence is increasing — it means more women are coming forward to report," said advocate Priya Chandrasekaran of the Tamil Nadu Women\'s Collective. "But it also reveals the sheer scale of the problem that remains hidden." The state government has announced the establishment of 50 new One-Stop Crisis Centres in rural districts to provide legal aid, counselling, and shelter.',
      excerpt: 'NCRB data reveals 38,742 domestic violence complaints filed in Tamil Nadu in 2025, a 22% increase over the previous year.',
      status: 'published',
      category: 'women-violence',
      tags: ['domestic-violence', 'ncrb', 'chennai', 'coimbatore', 'legal-aid'],
      publishedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      authorId: 'investigative-team',
      sourceUrl: null,
      metadata: { readingTime: 6 },
    },
    {
      slug: 'salem-acid-attack-survivor-justice',
      title: 'Salem: 19-Year-Old Survivor of Acid Attack Fights for Justice 18 Months On',
      body: 'On a humid August evening in 2024, 19-year-old Meena (name changed) was walking home from her part-time job at a textile unit in Salem when a rejected suitor threw acid on her face and arms. Eighteen months later, she has undergone seven reconstructive surgeries at the Government Stanley Medical College in Chennai. The accused was granted bail within four months and has not been seen in the locality since. The Tamil Nadu government\'s promised compensation of ₹5 lakh under the Tamil Nadu Victim Compensation Scheme remains unpaid. "Every time I look in the mirror, I relive that night," Meena told Thamizhi. "But I refuse to hide. I want every girl in this district to know that shame belongs to the perpetrator, not the survivor." The Salem District Legal Services Authority has issued a notice to the state to expedite the compensation. Women\'s rights organisations have launched a crowdfunding campaign to support Meena\'s medical expenses.',
      excerpt: 'An acid attack survivor from Salem continues to fight for justice 18 months after the assault, with compensation still unpaid.',
      status: 'published',
      category: 'women-violence',
      tags: ['acid-attack', 'salem', 'survivor-justice', 'compensation', 'violence-against-women'],
      publishedAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: null,
      metadata: { readingTime: 7 },
    },
    {
      slug: 'tn-all-women-police-stations-impact',
      title: 'How Tamil Nadu\'s All-Women Police Stations Are Transforming Complaint Reporting',
      body: 'Tamil Nadu operates the largest network of All-Women Police Stations (AWPS) in India — 220 stations across all 38 districts. A study conducted by the Madras Institute of Development Studies in collaboration with the state police department has found that districts with an AWPS within 10 km of village panchayats have seen a 65% increase in first information reports (FIRs) for gender-based crimes compared to non-AWPS districts. However, the study also flagged critical gaps: counsellors are present in only 40% of AWPS, and forensic evidence collection kits are unavailable in over half the stations. "The infrastructure is there, but the human resources are not," said Dr. Lakshmi Narayanan, the study\'s lead author. "A police station run entirely by women is a powerful symbol, but without trained counsellors and forensic support, the quality of investigations suffers." The state home department has told Thamizhi that it is recruiting 500 additional women constables and 50 forensic experts for exclusive deployment at AWPS.',
      excerpt: 'Study finds 65% rise in FIRs for gender-based crimes in districts with all-women police stations, but flags critical resource gaps.',
      status: 'published',
      category: 'women-violence',
      tags: ['police', 'women-safety', 'awps', 'reform', 'investigation'],
      publishedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
      authorId: 'investigative-team',
      sourceUrl: null,
      metadata: { readingTime: 8 },
    },
    {
      slug: 'chennai-helpline-marital-rape-2025',
      title: 'Chennai NGO Helpline Receives 12,000 Calls in 2025 — Most from Marital Rape Survivors',
      body: 'Sahaaya, a Chennai-based women\'s helpline that has operated since 2012, received 12,047 distress calls in 2025 — the highest annual number in its history. Of these, 56% explicitly described experiences that meet the medical definition of marital rape. India\'s legal framework still exempts non-consensual sex within marriage from criminal prosecution under Exception 2 to Section 375 of the Indian Penal Code, a colonial-era provision that the Supreme Court is currently reviewing in a batch of petitions. "Women are calling us in the middle of the night, whispering, terrified," said Sahaaya director Sunitha Krishnan. "They don\'t know that what is happening to them is a crime in 150 other countries. They believe it is their duty." The Tamil Nadu Commission for Women has submitted a recommendation to the state government to pass a resolution in the state assembly urging the Centre to criminalize marital rape, a move that would follow similar resolutions by Kerala and Maharashtra.',
      excerpt: '56% of 12,047 helpline calls in 2025 were from marital rape survivors, highlighting the gap in India\'s rape laws.',
      status: 'published',
      category: 'women-violence',
      tags: ['marital-rape', 'helpline', 'chennai', 'legal-reform', 'supreme-court'],
      publishedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
      authorId: 'editor1',
      sourceUrl: null,
      metadata: { readingTime: 7 },
    },
    {
      slug: 'tirunelveli-human-trafficking-bust',
      title: 'Human Trafficking Ring Busted in Tirunelveli — 14 Women Rescued, 6 Arrested',
      body: 'In a pre-dawn operation coordinated by the Tirunelveli District Police, the Anti-Human Trafficking Unit, and the NGO ARIVAL, 14 women and girls — including three minors aged 15 to 17 — were rescued from a network of safe houses used for forced labour and commercial sexual exploitation. Six individuals were arrested, including the alleged kingpin who had been operating the network across the Tamil Nadu-Kerala border for over seven years. The survivors, hailing from marginalised Dalit and Adivasi communities in Tirunelveli and Tenkasi districts, had been lured with promises of jobs in textile units and domestic work. "These are not isolated incidents. Trafficking follows the pattern of economic vulnerability," said Inspector Priya Devi of the Tirunelveli Anti-Human Trafficking Unit. The rescued women have been placed in protective custody, and the state women\'s welfare department has initiated rehabilitation under the Ujjawala scheme for trafficking survivors.',
      excerpt: '14 women and girls rescued in coordinated anti-trafficking operation across Tirunelveli and Kanyakumari districts.',
      status: 'published',
      category: 'women-violence',
      tags: ['human-trafficking', 'tirunelveli', 'rescue', 'ujjawala', 'dalit-rights'],
      publishedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
      authorId: 'investigative-team',
      sourceUrl: null,
      metadata: { readingTime: 6 },
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