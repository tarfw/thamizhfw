import type { Ionicons } from "@expo/vector-icons";

export type AppEntry = {
  slug: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  category: "built" | "agent";
};

export const APPS: AppEntry[] = [
  { slug: "agarathi",        name: "Agarathi",           description: "Tamil dictionary powered by Sorkuvai — search any word for definitions, meanings and more.",                              icon: "book",     route: "/agarathi",         category: "built" },
  { slug: "tamil-tokenizer", name: "Tamil Tokenizer",    description: "Split Tamil text into tokens, analyze syllables, and explore word structure.",                                             icon: "text",     route: "/tamil-tokenizer",  category: "built" },
  { slug: "blood",           name: "Blood",              description: "Blood donor registry — find donors, request blood, and manage your donations.",                                            icon: "water",    route: "/blood",            category: "built" },
  { slug: "archive",         name: "Archive Agent",      description: "Collects speeches, reports, testimonies, UN docs, and news archives. Creates searchable timelines and evidence maps.",      icon: "archive-outline",            route: "/agents/archive",         category: "agent" },
  { slug: "human-rights",    name: "Human Rights Evidence Agent", description: "Extracts names, dates, locations, and incidents from reports. Cross-links witness statements and satellite imagery.", icon: "finger-print-outline",       route: "/agents/human-rights",    category: "agent" },
  { slug: "fact-check",      name: "Fact-Check Agent",   description: "Verifies viral claims, fake photos, and propaganda. Essential for maintaining credibility.",                                icon: "checkmark-circle-outline",   route: "/agents/fact-check",      category: "agent" },
  { slug: "translation",     name: "Translation Agent",  description: "Tamil ↔ English ↔ Global translation. Makes documents globally accessible.",                                               icon: "language-outline",           route: "/agents/translation",     category: "agent" },
  { slug: "timeline",        name: "Timeline Intelligence Agent", description: "Builds interactive timelines of massacres, disappearances, displacement, and war crimes allegations.",            icon: "time-outline",               route: "/agents/timeline",        category: "agent" },
  { slug: "legal-research",  name: "Legal Research Agent", description: "Summarizes UN conventions, ICC precedents, genocide law, and transitional justice models.",                                icon: "scale-outline",              route: "/agents/legal-research",  category: "agent" },
  { slug: "diaspora",        name: "Diaspora Coordination", description: "Helps organize events, petitions, campaigns, and volunteers across the global Tamil diaspora.",                           icon: "globe-outline",              route: "/agents/diaspora",        category: "agent" },
  { slug: "media-monitoring", name: "Media Monitoring Agent", description: "Tracks global news, parliamentary debates, UN discussions, sanctions, and resolutions.",                                icon: "tv-outline",                 route: "/agents/media-monitoring", category: "agent" },
  { slug: "oral-history",    name: "Oral History Agent", description: "Records survivor testimonies in a structured format before they are lost forever.",                                         icon: "mic-outline",                route: "/agents/oral-history",    category: "agent" },
  { slug: "narrative",       name: "Narrative Analysis Agent", description: "Analyzes how media and governments framed the conflict over decades.",                                                  icon: "analytics-outline",          route: "/agents/narrative",       category: "agent" },
  { slug: "educational",     name: "Educational Agent",  description: "Creates explainers, maps, short videos, and FAQs for younger generations.",                                                icon: "school-outline",             route: "/agents/educational",     category: "agent" },
  { slug: "memorial",        name: "Memorial Agent",     description: "Digital remembrance wall with victims, villages, photos, and histories.",                                                   icon: "heart-outline",              route: "/agents/memorial",        category: "agent" },
  { slug: "policy",          name: "Policy Advocacy Agent", description: "Drafts letters to MPs, UN bodies, NGOs, and human rights organizations.",                                                icon: "document-text-outline",      route: "/agents/policy",          category: "agent" },
  { slug: "osint",           name: "OSINT Agent",        description: "Open-Source Intelligence — geolocation, satellite verification, and archive recovery.",                                      icon: "search-outline",             route: "/agents/osint",           category: "agent" },
  { slug: "counter-hate",    name: "Counter-Hate Agent", description: "Detects incitement, ethnic hate speech, and misinformation online targeting Tamil communities.",                            icon: "shield-outline",             route: "/agents/counter-hate",    category: "agent" },
];

export function getAppBySlug(slug: string): AppEntry | undefined {
  return APPS.find((a) => a.slug === slug);
}
