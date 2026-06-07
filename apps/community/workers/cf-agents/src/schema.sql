-- Evidence & Research
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  language TEXT DEFAULT 'ta',
  content TEXT,
  url TEXT,
  metadata JSON DEFAULT '{}',
  ingested_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  description TEXT,
  category TEXT,
  severity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS witnesses (
  id TEXT PRIMARY KEY,
  name TEXT,
  age INTEGER,
  location TEXT,
  testimony TEXT,
  incident_id TEXT REFERENCES incidents(id),
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  incident_id TEXT REFERENCES incidents(id),
  document_id TEXT REFERENCES documents(id),
  type TEXT CHECK(type IN ('satellite','photo','testimony','report','video')),
  url TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  source_url TEXT,
  status TEXT CHECK(status IN ('pending','verified','debunked','misleading')) DEFAULT 'pending',
  verdict TEXT,
  checked_at TEXT
);

CREATE TABLE IF NOT EXISTS osint_assets (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('geolocation','satellite','archive','social')),
  url TEXT,
  coordinates TEXT,
  description TEXT,
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Timeline
CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  date_precision TEXT CHECK(date_precision IN ('exact','month','year','range')) DEFAULT 'exact',
  end_date TEXT,
  location TEXT,
  description TEXT,
  category TEXT CHECK(category IN ('massacre','disappearance','displacement','war_crime','political','legal','other')),
  severity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Legal & Policy
CREATE TABLE IF NOT EXISTS legal_docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT CHECK(source IN ('un','icc','icj','national','ngo','other')),
  summary TEXT,
  full_text TEXT,
  url TEXT,
  language TEXT DEFAULT 'en',
  indexed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conventions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT CHECK(type IN ('genocide','human_rights','humanitarian','refugee','icc')),
  summary TEXT,
  articles JSON DEFAULT '[]',
  ratified_by JSON DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  recipient_type TEXT CHECK(recipient_type IN ('mp','un','ngo','government','media')),
  recipient_name TEXT,
  body TEXT,
  status TEXT CHECK(status IN ('draft','sent','archived')) DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Media
CREATE TABLE IF NOT EXISTS media_mentions (
  id TEXT PRIMARY KEY,
  title TEXT,
  source TEXT,
  url TEXT,
  published_at TEXT,
  language TEXT DEFAULT 'en',
  sentiment TEXT CHECK(sentiment IN ('positive','negative','neutral','mixed')),
  topics JSON DEFAULT '[]',
  fetched_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('narrative','sentiment','bias','framing')),
  query TEXT,
  summary TEXT,
  results JSON DEFAULT '{}',
  run_at TEXT DEFAULT (datetime('now'))
);

-- Community & Outreach
CREATE TABLE IF NOT EXISTS translations_cache (
  id TEXT PRIMARY KEY,
  source_text TEXT NOT NULL,
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('protest','vigil','petition','campaign','meeting','cultural')),
  date TEXT,
  location TEXT,
  description TEXT,
  organizer TEXT,
  volunteer_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS volunteers (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  location TEXT,
  skills TEXT,
  event_id TEXT REFERENCES events(id),
  registered_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS testimonies (
  id TEXT PRIMARY KEY,
  witness_name TEXT,
  age INTEGER,
  location TEXT,
  date_recorded TEXT,
  language TEXT DEFAULT 'ta',
  transcript TEXT,
  audio_url TEXT,
  video_url TEXT,
  consent_given INTEGER DEFAULT 0,
  status TEXT CHECK(status IN ('draft','reviewed','published','archived')) DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memorials (
  id TEXT PRIMARY KEY,
  victim_name TEXT NOT NULL,
  age INTEGER,
  village TEXT,
  district TEXT,
  date_of_death TEXT,
  photo_url TEXT,
  biography TEXT,
  family_notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS explainers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK(type IN ('article','faq','map','video','infographic')),
  content TEXT,
  language TEXT DEFAULT 'ta',
  tags JSON DEFAULT '[]',
  published_at TEXT DEFAULT (datetime('now'))
);

-- Safety
CREATE TABLE IF NOT EXISTS flagged_content (
  id TEXT PRIMARY KEY,
  url TEXT,
  platform TEXT,
  content TEXT,
  type TEXT CHECK(type IN ('hate_speech','disinformation','incitement','harassment')),
  severity INTEGER DEFAULT 1,
  status TEXT CHECK(status IN ('reported','reviewed','actioned','dismissed')) DEFAULT 'reported',
  reported_at TEXT DEFAULT (datetime('now'))
);
