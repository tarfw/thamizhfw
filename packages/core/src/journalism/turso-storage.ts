import { createClient, type Client } from '@libsql/client';
import type { JournalismStorage, StorageConfig } from './storage';
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
  GraphNode,
  GraphEdge,
  GraphCluster,
  EntityType,
  ArticleStatus,
} from './types';

const ID = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
const now = () => Date.now();

export class TursoJournalismStorage implements JournalismStorage {
  private client: Client;
  private initialized = false;

  constructor(config: StorageConfig) {
    this.client = createClient({
      url: config.url,
      authToken: config.authToken,
    });
  }

  private async ensureInit() {
    if (this.initialized) return;
    await this.runMigrations();
    this.initialized = true;
  }

  async runMigrations(): Promise<void> {
    const statements = [
      `CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        category TEXT,
        tags TEXT NOT NULL DEFAULT '[]',
        published_at INTEGER,
        author_id TEXT,
        source_url TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC) WHERE status = 'published'`,
      `CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category, published_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status, updated_at DESC)`,
      `CREATE TABLE IF NOT EXISTS entities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        aliases TEXT NOT NULL DEFAULT '[]',
        description TEXT,
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`,
      `CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`,
      `CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        pages INTEGER,
        ocr_text TEXT,
        entity_ids TEXT NOT NULL DEFAULT '[]',
        article_id TEXT,
        annotations TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_documents_article ON documents(article_id)`,
      `CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        relationship TEXT NOT NULL,
        strength REAL NOT NULL DEFAULT 1.0,
        evidence TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (source_id) REFERENCES entities(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES entities(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source_id)`,
      `CREATE INDEX IF NOT EXISTS idx_connections_target ON connections(target_id)`,
      `CREATE TABLE IF NOT EXISTS article_entities (
        article_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        relevance REAL NOT NULL DEFAULT 1.0,
        context TEXT,
        PRIMARY KEY (article_id, entity_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        entity_id TEXT,
        article_id TEXT,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        is_private INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(entity_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notes_article ON notes(article_id)`,
    ];

    for (const sql of statements) {
      await this.client.execute(sql);
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'down'; latency: number }> {
    const start = Date.now();
    try {
      await this.client.execute('SELECT 1');
      return { status: 'ok', latency: Date.now() - start };
    } catch {
      return { status: 'down', latency: Date.now() - start };
    }
  }

  // ==================== ARTICLES ====================
  async createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
    await this.ensureInit();
    const id = ID();
    const ts = now();
    await this.client.execute({
      sql: `INSERT INTO articles (id, slug, title, body, excerpt, status, category, tags, published_at, author_id, source_url, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        article.slug,
        article.title,
        article.body,
        article.excerpt,
        article.status,
        article.category,
        JSON.stringify(article.tags),
        article.publishedAt,
        article.authorId,
        article.sourceUrl,
        JSON.stringify(article.metadata),
        ts,
        ts,
      ],
    });
    return this.getArticleById(id) as Promise<Article>;
  }

  async getArticleById(id: string): Promise<Article | null> {
    await this.ensureInit();
    const result = await this.client.execute({
      sql: 'SELECT * FROM articles WHERE id = ?',
      args: [id],
    });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapArticleRow(row as Record<string, unknown>);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    await this.ensureInit();
    const result = await this.client.execute({
      sql: 'SELECT * FROM articles WHERE slug = ?',
      args: [slug],
    });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapArticleRow(row as Record<string, unknown>);
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
    await this.ensureInit();
    const ts = now();
    const fields: string[] = ['updated_at = ?'];
    const values: unknown[] = [ts];

    if (updates.slug !== undefined) { fields.push('slug = ?'); values.push(updates.slug); }
    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.body !== undefined) { fields.push('body = ?'); values.push(updates.body); }
    if (updates.excerpt !== undefined) { fields.push('excerpt = ?'); values.push(updates.excerpt); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.category !== undefined) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    if (updates.publishedAt !== undefined) { fields.push('published_at = ?'); values.push(updates.publishedAt); }
    if (updates.authorId !== undefined) { fields.push('author_id = ?'); values.push(updates.authorId); }
    if (updates.sourceUrl !== undefined) { fields.push('source_url = ?'); values.push(updates.sourceUrl); }
    if (updates.metadata !== undefined) { fields.push('metadata = ?'); values.push(JSON.stringify(updates.metadata)); }

    values.push(id);
    await this.client.execute({
      sql: `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`,
      args: values as (string | number | null)[],
    });
    return this.getArticleById(id) as Promise<Article>;
  }

  async deleteArticle(id: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({ sql: 'DELETE FROM articles WHERE id = ?', args: [id] });
  }

  async listArticles(params: ListParams): Promise<{ articles: Article[]; total: number }> {
    await this.ensureInit();
    const conditions: string[] = [];
    const args: unknown[] = [];

    if (params.status) { conditions.push('status = ?'); args.push(params.status); }
    if (params.category) { conditions.push('category = ?'); args.push(params.category); }
    if (params.authorId) { conditions.push('author_id = ?'); args.push(params.authorId); }
    if (params.dateFrom) { conditions.push('published_at >= ?'); args.push(params.dateFrom); }
    if (params.dateTo) { conditions.push('published_at <= ?'); args.push(params.dateTo); }
    if (params.entityId) {
      conditions.push('id IN (SELECT article_id FROM article_entities WHERE entity_id = ?)');
      args.push(params.entityId);
    }
    if (params.tag) {
      conditions.push('tags LIKE ?');
      args.push(`%"${params.tag}"%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortBy = params.sortBy || 'publishedAt';
    const sortOrder = params.sortOrder || 'desc';
    const dbSortBy = sortBy === 'publishedAt' ? 'published_at' : sortBy === 'createdAt' ? 'created_at' : 'updated_at';

    const countResult = await this.client.execute(`SELECT COUNT(*) as count FROM articles ${where}`, args as (string | number | null)[]);
    const total = Number(countResult.rows[0]?.count ?? 0);

    const dataResult = await this.client.execute({
      sql: `SELECT * FROM articles ${where} ORDER BY ${dbSortBy} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`,
      args: [...args, params.limit, params.offset],
    });

    const articles = dataResult.rows.map((row) => this.mapArticleRow(row as Record<string, unknown>));
    return { articles, total };
  }

  async searchArticles(filters: SearchFilters): Promise<SearchResult> {
    await this.ensureInit();
    const query = filters.query.trim();
    if (!query) {
      return { articles: [], entities: [], documents: [], total: 0, facets: { categories: {}, entityTypes: {} as Record<EntityType, number>, authors: {}, tags: {} } };
    }

    const searchPattern = `%${query}%`;
    const articleConditions: string[] = ['(title LIKE ? OR body LIKE ? OR excerpt LIKE ?)'];
    const articleArgs: unknown[] = [searchPattern, searchPattern, searchPattern];
    if (filters.category) { articleConditions.push('category = ?'); articleArgs.push(filters.category); }
    if (filters.dateFrom) { articleConditions.push('published_at >= ?'); articleArgs.push(filters.dateFrom); }
    if (filters.dateTo) { articleConditions.push('published_at <= ?'); articleArgs.push(filters.dateTo); }
    if (filters.authorId) { articleConditions.push('author_id = ?'); articleArgs.push(filters.authorId); }
    if (filters.tags && filters.tags.length) {
      const tagConds = filters.tags.map(() => 'tags LIKE ?').join(' OR ');
      articleConditions.push(`(${tagConds})`);
      filters.tags.forEach((t) => articleArgs.push(`%"${t}"%`));
    }

    const articleWhere = articleConditions.join(' AND ');
    const articleResult = await this.client.execute({
      sql: `SELECT * FROM articles WHERE ${articleWhere} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      args: [...articleArgs, filters.limit, filters.offset],
    });
    const articles = articleResult.rows.map((row) => this.mapArticleRow(row as Record<string, unknown>));

    const entityResult = await this.client.execute({
      sql: 'SELECT * FROM entities WHERE (name LIKE ? OR aliases LIKE ?) ORDER BY name LIMIT ?',
      args: [searchPattern, searchPattern, filters.limit],
    });
    const entities = entityResult.rows.map((row) => this.mapEntityRow(row as Record<string, unknown>));

    return {
      articles,
      entities,
      documents: [],
      total: articles.length,
      facets: { categories: {}, entityTypes: {} as Record<EntityType, number>, authors: {}, tags: {} },
    };
  }

  async publishArticle(id: string): Promise<Article> {
    return this.updateArticle(id, { status: 'published' as ArticleStatus, publishedAt: now() });
  }

  async archiveArticle(id: string): Promise<Article> {
    return this.updateArticle(id, { status: 'archived' as ArticleStatus });
  }

  // ==================== ENTITIES ====================
  async createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
    await this.ensureInit();
    const id = ID();
    const ts = now();
    await this.client.execute({
      sql: `INSERT INTO entities (id, type, name, aliases, description, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, entity.type, entity.name, JSON.stringify(entity.aliases), entity.description, JSON.stringify(entity.metadata), ts, ts],
    });
    return this.getEntityById(id) as Promise<Entity>;
  }

  async getEntityById(id: string): Promise<Entity | null> {
    await this.ensureInit();
    const result = await this.client.execute({ sql: 'SELECT * FROM entities WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapEntityRow(row as Record<string, unknown>);
  }

  async getEntityByName(name: string, type?: EntityType): Promise<Entity | null> {
    await this.ensureInit();
    const sql = type
      ? 'SELECT * FROM entities WHERE name = ? AND type = ? LIMIT 1'
      : 'SELECT * FROM entities WHERE name = ? LIMIT 1';
    const args = type ? [name, type] : [name];
    const result = await this.client.execute({ sql, args });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapEntityRow(row as Record<string, unknown>);
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity> {
    await this.ensureInit();
    const ts = now();
    const fields: string[] = ['updated_at = ?'];
    const values: unknown[] = [ts];

    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.aliases !== undefined) { fields.push('aliases = ?'); values.push(JSON.stringify(updates.aliases)); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.metadata !== undefined) { fields.push('metadata = ?'); values.push(JSON.stringify(updates.metadata)); }

    values.push(id);
    await this.client.execute({
      sql: `UPDATE entities SET ${fields.join(', ')} WHERE id = ?`,
      args: values as (string | number | null)[],
    });
    return this.getEntityById(id) as Promise<Entity>;
  }

  async deleteEntity(id: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({ sql: 'DELETE FROM entities WHERE id = ?', args: [id] });
  }

  async listEntities(params: ListParams): Promise<{ entities: Entity[]; total: number }> {
    await this.ensureInit();
    const countResult = await this.client.execute('SELECT COUNT(*) as count FROM entities');
    const total = Number(countResult.rows[0]?.count ?? 0);

    const result = await this.client.execute({
      sql: 'SELECT * FROM entities ORDER BY name LIMIT ? OFFSET ?',
      args: [params.limit, params.offset],
    });
    const entities = result.rows.map((row) => this.mapEntityRow(row as Record<string, unknown>));
    return { entities, total };
  }

  async searchEntities(query: string, type?: EntityType, limit = 20): Promise<Entity[]> {
    await this.ensureInit();
    const pattern = `%${query}%`;
    const sql = type
      ? 'SELECT * FROM entities WHERE (name LIKE ? OR aliases LIKE ?) AND type = ? ORDER BY name LIMIT ?'
      : 'SELECT * FROM entities WHERE (name LIKE ? OR aliases LIKE ?) ORDER BY name LIMIT ?';
    const args = type ? [pattern, pattern, type, limit] : [pattern, pattern, limit];
    const result = await this.client.execute({ sql, args });
    return result.rows.map((row) => this.mapEntityRow(row as Record<string, unknown>));
  }

  async getEntityConnections(entityId: string, depth = 1): Promise<Connection[]> {
    await this.ensureInit();
    if (depth <= 1) {
      const result = await this.client.execute({
        sql: 'SELECT * FROM connections WHERE source_id = ? OR target_id = ?',
        args: [entityId, entityId],
      });
      return result.rows.map((row) => this.mapConnectionRow(row as Record<string, unknown>));
    }
    const result = await this.client.execute({
      sql: `WITH RECURSIVE conn(entity_id, depth) AS (
        SELECT ?, 0
        UNION
        SELECT CASE WHEN c.source_id = conn.entity_id THEN c.target_id ELSE c.source_id END, conn.depth + 1
        FROM connections c JOIN conn ON (c.source_id = conn.entity_id OR c.target_id = conn.entity_id)
        WHERE conn.depth < ?
      )
      SELECT DISTINCT c.* FROM connections c
      WHERE c.source_id IN (SELECT entity_id FROM conn) OR c.target_id IN (SELECT entity_id FROM conn)`,
      args: [entityId, depth],
    });
    return result.rows.map((row) => this.mapConnectionRow(row as Record<string, unknown>));
  }

  async getEntityArticles(entityId: string, params?: ListParams): Promise<Article[]> {
    await this.ensureInit();
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;
    const result = await this.client.execute({
      sql: `SELECT a.* FROM articles a INNER JOIN article_entities ae ON a.id = ae.article_id
            WHERE ae.entity_id = ? ORDER BY a.published_at DESC LIMIT ? OFFSET ?`,
      args: [entityId, limit, offset],
    });
    return result.rows.map((row) => this.mapArticleRow(row as Record<string, unknown>));
  }

  async getEntityDocuments(entityId: string): Promise<Document[]> {
    await this.ensureInit();
    const result = await this.client.execute({
      sql: `SELECT * FROM documents WHERE entity_ids LIKE ? ORDER BY created_at DESC`,
      args: [`%"${entityId}"%`],
    });
    return result.rows.map((row) => this.mapDocumentRow(row as Record<string, unknown>));
  }

  // ==================== CONNECTIONS ====================
  async createConnection(connection: Omit<Connection, 'id' | 'createdAt'>): Promise<Connection> {
    await this.ensureInit();
    const id = ID();
    const ts = now();
    await this.client.execute({
      sql: `INSERT INTO connections (id, source_id, target_id, relationship, strength, evidence, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, connection.sourceId, connection.targetId, connection.relationship, connection.strength, JSON.stringify(connection.evidence), ts],
    });
    return this.getConnectionById(id) as Promise<Connection>;
  }

  async getConnectionById(id: string): Promise<Connection | null> {
    await this.ensureInit();
    const result = await this.client.execute({ sql: 'SELECT * FROM connections WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapConnectionRow(row as Record<string, unknown>);
  }

  async updateConnection(id: string, updates: Partial<Connection>): Promise<Connection> {
    await this.ensureInit();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.relationship !== undefined) { fields.push('relationship = ?'); values.push(updates.relationship); }
    if (updates.strength !== undefined) { fields.push('strength = ?'); values.push(updates.strength); }
    if (updates.evidence !== undefined) { fields.push('evidence = ?'); values.push(JSON.stringify(updates.evidence)); }

    if (fields.length === 0) return this.getConnectionById(id) as Promise<Connection>;
    values.push(id);
    await this.client.execute({
      sql: `UPDATE connections SET ${fields.join(', ')} WHERE id = ?`,
      args: values as (string | number | null)[],
    });
    return this.getConnectionById(id) as Promise<Connection>;
  }

  async deleteConnection(id: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({ sql: 'DELETE FROM connections WHERE id = ?', args: [id] });
  }

  async listConnections(sourceId?: string, targetId?: string): Promise<Connection[]> {
    await this.ensureInit();
    let sql = 'SELECT * FROM connections WHERE 1=1';
    const args: unknown[] = [];
    if (sourceId) { sql += ' AND source_id = ?'; args.push(sourceId); }
    if (targetId) { sql += ' AND target_id = ?'; args.push(targetId); }
    const result = await this.client.execute({ sql, args });
    return result.rows.map((row) => this.mapConnectionRow(row as Record<string, unknown>));
  }

  async getGraphData(entityId?: string, depth = 2): Promise<GraphData> {
    await this.ensureInit();
    let entityResult;
    let connectionResult;

    if (entityId) {
      const allEntityIds = new Set<string>([entityId]);
      let currentLevel = new Set<string>([entityId]);
      for (let i = 0; i < depth; i++) {
        const result = await this.client.execute({
          sql: 'SELECT source_id, target_id FROM connections WHERE source_id IN (...) OR target_id IN (...)',
          args: [Array.from(currentLevel), Array.from(currentLevel)],
        });
        const nextLevel = new Set<string>();
        result.rows.forEach((row) => {
          const src = row.source_id as string;
          const tgt = row.target_id as string;
          allEntityIds.add(src);
          allEntityIds.add(tgt);
          if (currentLevel.has(src)) nextLevel.add(tgt);
          if (currentLevel.has(tgt)) nextLevel.add(src);
        });
        currentLevel = nextLevel;
      }

      const entityIdsList = Array.from(allEntityIds);
      const placeholders = entityIdsList.map(() => '?').join(',');
      entityResult = await this.client.execute({
        sql: `SELECT * FROM entities WHERE id IN (${placeholders})`,
        args: entityIdsList,
      });
      connectionResult = await this.client.execute({
        sql: `SELECT * FROM connections WHERE source_id IN (${placeholders}) AND target_id IN (${placeholders})`,
        args: [...entityIdsList, ...entityIdsList],
      });
    } else {
      entityResult = await this.client.execute('SELECT * FROM entities LIMIT 200');
      connectionResult = await this.client.execute('SELECT * FROM connections LIMIT 1000');
    }

    const nodes: GraphNode[] = entityResult.rows.map((row, idx) => {
      const e = this.mapEntityRow(row as Record<string, unknown>);
      return {
        id: e.id,
        type: e.type,
        name: e.name,
        label: e.name,
        size: 20,
        color: this.getEntityColor(e.type),
        x: Math.cos((idx * 2 * Math.PI) / entityResult.rows.length) * 200,
        y: Math.sin((idx * 2 * Math.PI) / entityResult.rows.length) * 200,
        data: e,
      };
    });

    const edges: GraphEdge[] = connectionResult.rows.map((row) => {
      const c = this.mapConnectionRow(row as Record<string, unknown>);
      return {
        id: c.id,
        source: c.sourceId,
        target: c.targetId,
        relationship: c.relationship,
        strength: c.strength,
        color: '#6B7280',
        width: Math.max(1, c.strength * 3),
        style: this.getRelationshipStyle(c.relationship),
      };
    });

    const clusters = this.buildClusters(nodes);
    return { nodes, edges, clusters };
  }

  async findPath(sourceId: string, targetId: string, maxDepth = 5): Promise<Connection[]> {
    await this.ensureInit();
    const visited = new Set<string>([sourceId]);
    const queue: { id: string; path: Connection[] }[] = [{ id: sourceId, path: [] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;
      if (id === targetId) return path;
      if (path.length >= maxDepth) continue;

      const result = await this.client.execute({
        sql: 'SELECT * FROM connections WHERE source_id = ? OR target_id = ?',
        args: [id, id],
      });
      for (const row of result.rows) {
        const c = this.mapConnectionRow(row as Record<string, unknown>);
        const next = c.sourceId === id ? c.targetId : c.sourceId;
        if (!visited.has(next)) {
          visited.add(next);
          queue.push({ id: next, path: [...path, c] });
        }
      }
    }
    return [];
  }

  // ==================== DOCUMENTS ====================
  async createDocument(document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    await this.ensureInit();
    const id = ID();
    const ts = now();
    await this.client.execute({
      sql: `INSERT INTO documents (id, title, type, uri, mime_type, size_bytes, pages, ocr_text, entity_ids, article_id, annotations, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, document.title, document.type, document.uri, document.mimeType, document.sizeBytes, document.pages, document.ocrText, JSON.stringify(document.entityIds), document.articleId, JSON.stringify(document.annotations), ts, ts],
    });
    return this.getDocumentById(id) as Promise<Document>;
  }

  async getDocumentById(id: string): Promise<Document | null> {
    await this.ensureInit();
    const result = await this.client.execute({ sql: 'SELECT * FROM documents WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapDocumentRow(row as Record<string, unknown>);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    await this.ensureInit();
    const ts = now();
    const fields: string[] = ['updated_at = ?'];
    const values: unknown[] = [ts];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.type !== undefined) { fields.push('type = ?'); values.push(updates.type); }
    if (updates.uri !== undefined) { fields.push('uri = ?'); values.push(updates.uri); }
    if (updates.mimeType !== undefined) { fields.push('mime_type = ?'); values.push(updates.mimeType); }
    if (updates.sizeBytes !== undefined) { fields.push('size_bytes = ?'); values.push(updates.sizeBytes); }
    if (updates.pages !== undefined) { fields.push('pages = ?'); values.push(updates.pages); }
    if (updates.ocrText !== undefined) { fields.push('ocr_text = ?'); values.push(updates.ocrText); }
    if (updates.entityIds !== undefined) { fields.push('entity_ids = ?'); values.push(JSON.stringify(updates.entityIds)); }
    if (updates.articleId !== undefined) { fields.push('article_id = ?'); values.push(updates.articleId); }
    if (updates.annotations !== undefined) { fields.push('annotations = ?'); values.push(JSON.stringify(updates.annotations)); }

    values.push(id);
    await this.client.execute({
      sql: `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`,
      args: values as (string | number | null)[],
    });
    return this.getDocumentById(id) as Promise<Document>;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({ sql: 'DELETE FROM documents WHERE id = ?', args: [id] });
  }

  async listDocuments(params: ListParams): Promise<{ documents: Document[]; total: number }> {
    await this.ensureInit();
    const countResult = await this.client.execute('SELECT COUNT(*) as count FROM documents');
    const total = Number(countResult.rows[0]?.count ?? 0);
    const result = await this.client.execute({
      sql: 'SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?',
      args: [params.limit, params.offset],
    });
    const documents = result.rows.map((row) => this.mapDocumentRow(row as Record<string, unknown>));
    return { documents, total };
  }

  async getDocumentsByArticle(articleId: string): Promise<Document[]> {
    await this.ensureInit();
    const result = await this.client.execute({ sql: 'SELECT * FROM documents WHERE article_id = ?', args: [articleId] });
    return result.rows.map((row) => this.mapDocumentRow(row as Record<string, unknown>));
  }

  async getDocumentsByEntity(entityId: string): Promise<Document[]> {
    return this.getEntityDocuments(entityId);
  }

  // ==================== NOTES ====================
  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    await this.ensureInit();
    const id = ID();
    const ts = now();
    await this.client.execute({
      sql: `INSERT INTO notes (id, entity_id, article_id, content, tags, is_private, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, note.entityId, note.articleId, note.content, JSON.stringify(note.tags), note.isPrivate ? 1 : 0, note.createdBy, ts, ts],
    });
    return this.getNoteById(id) as Promise<Note>;
  }

  async getNoteById(id: string): Promise<Note | null> {
    await this.ensureInit();
    const result = await this.client.execute({ sql: 'SELECT * FROM notes WHERE id = ?', args: [id] });
    const row = result.rows[0];
    if (!row) return null;
    return this.mapNoteRow(row as Record<string, unknown>);
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    await this.ensureInit();
    const ts = now();
    const fields: string[] = ['updated_at = ?'];
    const values: unknown[] = [ts];

    if (updates.content !== undefined) { fields.push('content = ?'); values.push(updates.content); }
    if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
    if (updates.entityId !== undefined) { fields.push('entity_id = ?'); values.push(updates.entityId); }
    if (updates.articleId !== undefined) { fields.push('article_id = ?'); values.push(updates.articleId); }
    if (updates.isPrivate !== undefined) { fields.push('is_private = ?'); values.push(updates.isPrivate ? 1 : 0); }

    values.push(id);
    await this.client.execute({
      sql: `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
      args: values as (string | number | null)[],
    });
    return this.getNoteById(id) as Promise<Note>;
  }

  async deleteNote(id: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({ sql: 'DELETE FROM notes WHERE id = ?', args: [id] });
  }

  async listNotes(params: ListParams & { entityId?: string; articleId?: string }): Promise<Note[]> {
    await this.ensureInit();
    let sql = 'SELECT * FROM notes WHERE 1=1';
    const args: unknown[] = [];
    if (params.entityId) { sql += ' AND entity_id = ?'; args.push(params.entityId); }
    if (params.articleId) { sql += ' AND article_id = ?'; args.push(params.articleId); }
    sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
    args.push(params.limit, params.offset);
    const result = await this.client.execute({ sql, args });
    return result.rows.map((row) => this.mapNoteRow(row as Record<string, unknown>));
  }

  // ==================== LINKING ====================
  async linkArticleEntity(articleId: string, entityId: string, relevance = 1.0, context?: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({
      sql: `INSERT OR REPLACE INTO article_entities (article_id, entity_id, relevance, context) VALUES (?, ?, ?, ?)`,
      args: [articleId, entityId, relevance, context || null],
    });
  }

  async unlinkArticleEntity(articleId: string, entityId: string): Promise<void> {
    await this.ensureInit();
    await this.client.execute({
      sql: 'DELETE FROM article_entities WHERE article_id = ? AND entity_id = ?',
      args: [articleId, entityId],
    });
  }

  async linkDocumentEntity(documentId: string, entityId: string): Promise<void> {
    await this.ensureInit();
    const doc = await this.getDocumentById(documentId);
    if (!doc) return;
    if (!doc.entityIds.includes(entityId)) {
      const newIds = [...doc.entityIds, entityId];
      await this.updateDocument(documentId, { entityIds: newIds });
    }
  }

  async unlinkDocumentEntity(documentId: string, entityId: string): Promise<void> {
    await this.ensureInit();
    const doc = await this.getDocumentById(documentId);
    if (!doc) return;
    const newIds = doc.entityIds.filter((id) => id !== entityId);
    await this.updateDocument(documentId, { entityIds: newIds });
  }

  // ==================== BULK ====================
  async bulkCreateArticles(articles: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Article[]> {
    const results: Article[] = [];
    for (const article of articles) {
      results.push(await this.createArticle(article));
    }
    return results;
  }

  async bulkCreateEntities(entities: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Entity[]> {
    const results: Entity[] = [];
    for (const entity of entities) {
      results.push(await this.createEntity(entity));
    }
    return results;
  }

  async bulkCreateConnections(connections: Omit<Connection, 'id' | 'createdAt'>[]): Promise<Connection[]> {
    const results: Connection[] = [];
    for (const conn of connections) {
      results.push(await this.createConnection(conn));
    }
    return results;
  }

  // ==================== HELPERS ====================
  private mapArticleRow(row: Record<string, unknown>): Article {
    return {
      id: row.id as string,
      slug: row.slug as string,
      title: row.title as string,
      body: row.body as string,
      excerpt: row.excerpt as string,
      status: row.status as ArticleStatus,
      category: (row.category as string) || '',
      tags: JSON.parse((row.tags as string) || '[]'),
      publishedAt: (row.published_at as number) || null,
      authorId: (row.author_id as string) || '',
      sourceUrl: (row.source_url as string) || null,
      metadata: JSON.parse((row.metadata as string) || '{}'),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  private mapEntityRow(row: Record<string, unknown>): Entity {
    return {
      id: row.id as string,
      type: row.type as EntityType,
      name: row.name as string,
      aliases: JSON.parse((row.aliases as string) || '[]'),
      description: (row.description as string) || null,
      metadata: JSON.parse((row.metadata as string) || '{}'),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  private mapConnectionRow(row: Record<string, unknown>): Connection {
    return {
      id: row.id as string,
      sourceId: row.source_id as string,
      targetId: row.target_id as string,
      relationship: row.relationship as Connection['relationship'],
      strength: (row.strength as number) || 1.0,
      evidence: JSON.parse((row.evidence as string) || '[]'),
      createdAt: row.created_at as number,
    };
  }

  private mapDocumentRow(row: Record<string, unknown>): Document {
    return {
      id: row.id as string,
      title: row.title as string,
      type: row.type as Document['type'],
      uri: row.uri as string,
      mimeType: row.mime_type as string,
      sizeBytes: row.size_bytes as number,
      pages: (row.pages as number) || null,
      ocrText: (row.ocr_text as string) || null,
      entityIds: JSON.parse((row.entity_ids as string) || '[]'),
      articleId: (row.article_id as string) || null,
      annotations: JSON.parse((row.annotations as string) || '[]'),
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  private mapNoteRow(row: Record<string, unknown>): Note {
    return {
      id: row.id as string,
      entityId: (row.entity_id as string) || null,
      articleId: (row.article_id as string) || null,
      content: row.content as string,
      tags: JSON.parse((row.tags as string) || '[]'),
      isPrivate: Boolean(row.is_private),
      createdBy: row.created_by as string,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }

  private getEntityColor(type: EntityType): string {
    const colors: Record<EntityType, string> = {
      person: '#3B82F6',
      organization: '#8B5CF6',
      location: '#10B981',
      event: '#F59E0B',
      document: '#EC4899',
    };
    return colors[type] || '#6B7280';
  }

  private getRelationshipStyle(relationship: string): 'solid' | 'dashed' | 'dotted' {
    if (relationship === 'works_for' || relationship === 'member_of') return 'solid';
    if (relationship === 'located_in' || relationship === 'participated_in') return 'dashed';
    return 'dotted';
  }

  private buildClusters(nodes: GraphNode[]): GraphCluster[] {
    const typeMap = new Map<EntityType, string[]>();
    nodes.forEach((node) => {
      if (!typeMap.has(node.type)) typeMap.set(node.type, []);
      typeMap.get(node.type)!.push(node.id);
    });
    const clusters: GraphCluster[] = [];
    typeMap.forEach((nodeIds, type) => {
      const centerX = nodeIds.reduce((sum, id) => sum + (nodes.find((n) => n.id === id)?.x || 0), 0) / nodeIds.length;
      const centerY = nodeIds.reduce((sum, id) => sum + (nodes.find((n) => n.id === id)?.y || 0), 0) / nodeIds.length;
      clusters.push({
        id: `cluster_${type}`,
        nodes: nodeIds,
        label: type,
        type,
        centerX,
        centerY,
        radius: 100,
      });
    });
    return clusters;
  }

  async close(): Promise<void> {
    this.client.close();
  }
}
