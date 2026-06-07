import type {
  Article,
  Entity,
  Connection,
  Document,
  Note,
  ListParams,
  SearchFilters,
  SearchResult,
  GraphData,
  EntityRef,
  ArticleRef,
  DocumentRef,
  ArticleStatus,
  EntityType,
  RelationshipType,
} from './types';

export interface JournalismStorage {
  // Articles
  createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article>;
  getArticleById(id: string): Promise<Article | null>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  listArticles(params: ListParams): Promise<{ articles: Article[]; total: number }>;
  searchArticles(filters: SearchFilters): Promise<SearchResult>;
  publishArticle(id: string): Promise<Article>;
  archiveArticle(id: string): Promise<Article>;

  // Entities
  createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity>;
  getEntityById(id: string): Promise<Entity | null>;
  getEntityByName(name: string, type?: EntityType): Promise<Entity | null>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  deleteEntity(id: string): Promise<void>;
  listEntities(params: ListParams): Promise<{ entities: Entity[]; total: number }>;
  searchEntities(query: string, type?: EntityType, limit?: number): Promise<Entity[]>;
  getEntityConnections(entityId: string, depth?: number): Promise<Connection[]>;
  getEntityArticles(entityId: string, params?: ListParams): Promise<Article[]>;
  getEntityDocuments(entityId: string): Promise<Document[]>;

  // Connections
  createConnection(connection: Omit<Connection, 'id' | 'createdAt'>): Promise<Connection>;
  getConnectionById(id: string): Promise<Connection | null>;
  updateConnection(id: string, updates: Partial<Connection>): Promise<Connection>;
  deleteConnection(id: string): Promise<void>;
  listConnections(sourceId?: string, targetId?: string): Promise<Connection[]>;
  getGraphData(entityId?: string, depth?: number): Promise<GraphData>;
  findPath(sourceId: string, targetId: string, maxDepth?: number): Promise<Connection[]>;

  // Documents
  createDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document>;
  getDocumentById(id: string): Promise<Document | null>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;
  listDocuments(params: ListParams): Promise<{ documents: Document[]; total: number }>;
  getDocumentsByArticle(articleId: string): Promise<Document[]>;
  getDocumentsByEntity(entityId: string): Promise<Document[]>;

  // Notes
  createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note>;
  getNoteById(id: string): Promise<Note | null>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  listNotes(params: ListParams & { entityId?: string; articleId?: string }): Promise<Note[]>;

  // Cross-entity linking
  linkArticleEntity(articleId: string, entityId: string, relevance?: number, context?: string): Promise<void>;
  unlinkArticleEntity(articleId: string, entityId: string): Promise<void>;
  linkDocumentEntity(documentId: string, entityId: string): Promise<void>;
  unlinkDocumentEntity(documentId: string, entityId: string): Promise<void>;

  // Bulk operations
  bulkCreateArticles(articles: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Article[]>;
  bulkCreateEntities(entities: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Entity[]>;
  bulkCreateConnections(connections: Omit<Connection, 'id' | 'createdAt'>[]): Promise<Connection[]>;

  // Health & maintenance
  healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'down'; latency: number }>;
  runMigrations(): Promise<void>;
}

export interface StorageConfig {
  url: string;
  authToken: string;
  encryptionKey?: string;
}