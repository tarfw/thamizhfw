export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  category: string;
  location: string;
  description: string;
  severity: number;
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
  severity: number;
  evidenceCount: number;
  witnessCount: number;
}

export interface Memorial {
  id: string;
  victimName: string;
  age: number;
  village: string;
  district: string;
  dateOfDeath: string;
  biography: string;
}

export interface Testimony {
  id: string;
  witnessName: string;
  age: number;
  location: string;
  transcript: string;
  dateRecorded: string;
  status: string;
}

export interface Convention {
  id: string;
  name: string;
  shortName: string;
  type: string;
  summary: string;
  articles: string[];
}

export interface LegalDoc {
  id: string;
  title: string;
  source: string;
  summary: string;
  date: string;
}

export interface MediaMention {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: string;
  summary: string;
}
