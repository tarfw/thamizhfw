import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTheme, Card, Badge, Timeline } from '@tamilfw/ui';
import { useLocalSearchParams } from 'expo-router';
import type { Entity, Connection, Article, Document } from '@tamilfw/core/journalism';

export default function EntityDetail() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getStorage } = await import('@tamilfw/core');
        const storage = getStorage();
        const e = await storage.getEntityById(params.id);
        if (!e) {
          setLoading(false);
          return;
        }
        setEntity(e);
        const [conns, arts, docs] = await Promise.all([
          storage.getEntityConnections(params.id, 2),
          storage.getEntityArticles(params.id),
          storage.getEntityDocuments(params.id),
        ]);
        setConnections(conns);
        setArticles(arts);
        setDocuments(docs);
      } catch (err) {
        console.warn('Failed to load entity:', err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) load();
  }, [params.id]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (!entity) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>Entity not found</Text>
      </View>
    );
  }

  const entityColor = (theme.colors as any).entity?.[entity.type] || theme.colors.fgMuted;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 40 }}
      >
        <Pressable
          onPress={() => {
            import('expo-router').then(({ router }) => router.back());
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}
        >
          <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>←</Text>
          <Text style={{ color: theme.colors.fgMuted, fontSize: 12 }}>Back</Text>
        </Pressable>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: entityColor + '30',
              borderWidth: 3,
              borderColor: entityColor,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: entityColor, fontSize: 32, fontWeight: '700' }}>
              {entity.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Badge label={entity.type} variant="entity" entityType={entity.type} size="md" />
          <Text
            style={{
              color: theme.colors.fg,
              fontSize: 24,
              fontWeight: '800',
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            {entity.name}
          </Text>
          {entity.aliases && entity.aliases.length > 0 && (
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
                fontFamily: 'SpaceMono',
              }}
            >
              aka {entity.aliases.join(', ')}
            </Text>
          )}
        </View>

        {entity.description && (
          <Card variant="bordered" padding={16} style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
              DESCRIPTION
            </Text>
            <Text style={{ color: theme.colors.fg, fontSize: 14, lineHeight: 20 }}>
              {entity.description}
            </Text>
          </Card>
        )}

        <Card variant="bordered" padding={16} style={{ marginBottom: 16 }}>
          <Text
            style={{
              color: theme.colors.fgDim,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            CONNECTIONS ({connections.length})
          </Text>
          {connections.length === 0 ? (
            <Text style={{ color: theme.colors.fgDim, fontSize: 12 }}>No connections yet</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {connections.slice(0, 10).map((conn) => (
                <View
                  key={conn.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.fgMuted,
                      fontSize: 11,
                      fontFamily: 'SpaceMono',
                    }}
                  >
                    {conn.relationship}
                  </Text>
                  <Text style={{ color: theme.colors.fgDim, fontSize: 11 }}>→</Text>
                  <Pressable
                    onPress={() => {
                      const otherId = conn.sourceId === entity.id ? conn.targetId : conn.sourceId;
                      import('expo-router').then(({ router }) => router.push(`/entity/${otherId}`));
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.accent,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {conn.relationship} →
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </Card>

        {articles.length > 0 && (
          <Card variant="bordered" padding={16} style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              MENTIONED IN ({articles.length} articles)
            </Text>
            <View style={{ gap: 8 }}>
              {articles.slice(0, 5).map((article) => (
                <Pressable
                  key={article.id}
                  onPress={() => {
                    import('expo-router').then(({ router }) => router.push(`/article/${article.id}`));
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.fg,
                      fontSize: 13,
                      fontWeight: '500',
                    }}
                    numberOfLines={2}
                  >
                    {article.title}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.fgDim,
                      fontSize: 10,
                      marginTop: 2,
                      fontFamily: 'SpaceMono',
                    }}
                  >
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'draft'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {documents.length > 0 && (
          <Card variant="bordered" padding={16}>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              DOCUMENTS ({documents.length})
            </Text>
            <View style={{ gap: 6 }}>
              {documents.map((doc) => (
                <Text
                  key={doc.id}
                  style={{ color: theme.colors.fgMuted, fontSize: 12 }}
                  numberOfLines={1}
                >
                  📄 {doc.title}
                </Text>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}