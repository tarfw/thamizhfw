export type ArticleStatus = 'draft' | 'published' | 'archived';
export type EntityType = 'person' | 'organization' | 'location' | 'event' | 'document';
export type RelationshipType = 
  | 'works_for' 
  | 'owns' 
  | 'funds' 
  | 'member_of' 
  | 'located_in' 
  | 'participated_in' 
  | 'reported_on' 
  | 'cited_in' 
  | 'related_to';

export interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  excerpt: string;
  status: ArticleStatus;
  category: string;
  tags: string[];
  publishedAt: number | null;
  authorId: string;
  sourceUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  entities?: EntityRef[];
  documents?: DocumentRef[];
  seo?: ArticleSEO;
}

export interface ArticleSEO {
  metaDescription: string;
  ogImage?: string;
  structuredData: ArticleSchema;
}

export interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'NewsArticle';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  mainEntityOfPage: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  connections?: Connection[];
  documents?: DocumentRef[];
  articles?: ArticleRef[];
}

export interface EntityRef {
  id: string;
  type: EntityType;
  name: string;
  relevance: number;
  context?: string;
}

export interface ArticleRef {
  id: string;
  slug: string;
  title: string;
  publishedAt: number;
  relevance: number;
}

export interface DocumentRef {
  id: string;
  title: string;
  type: string;
  mimeType: string;
  sizeBytes: number;
  pages?: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  strength: number;
  evidence: Evidence[];
  createdAt: number;
}

export interface Evidence {
  type: 'document' | 'article' | 'quote' | 'url';
  referenceId: string;
  snippet: string;
  url?: string;
}

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'text' | 'email' | 'video' | 'audio';
  uri: string;
  mimeType: string;
  sizeBytes: number;
  pages: number | null;
  ocrText: string | null;
  entityIds: string[];
  articleId: string | null;
  annotations: Annotation[];
  createdAt: number;
  updatedAt: number;
}

export interface Annotation {
  id: string;
  documentId: string;
  entityId: string | null;
  pageNumber: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  note: string;
  createdBy: string;
  createdAt: number;
}

export interface Note {
  id: string;
  entityId: string | null;
  articleId: string | null;
  content: string;
  tags: string[];
  isPrivate: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ListParams {
  limit: number;
  offset: number;
  category?: string;
  status?: ArticleStatus;
  authorId?: string;
  entityId?: string;
  tag?: string;
  dateFrom?: number;
  dateTo?: number;
  sortBy?: 'publishedAt' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilters {
  query: string;
  category?: string;
  entityType?: EntityType;
  entityId?: string;
  dateFrom?: number;
  dateTo?: number;
  authorId?: string;
  tags?: string[];
  limit: number;
  offset: number;
}

export interface SearchResult {
  articles: Article[];
  entities: Entity[];
  documents: Document[];
  total: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  categories: Record<string, number>;
  entityTypes: Record<EntityType, number>;
  authors: Record<string, number>;
  tags: Record<string, number>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
}

export interface GraphNode {
  id: string;
  type: EntityType;
  name: string;
  label: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
  data: Entity;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: RelationshipType;
  strength: number;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface GraphCluster {
  id: string;
  nodes: string[];
  label: string;
  type: EntityType;
  centerX: number;
  centerY: number;
  radius: number;
}