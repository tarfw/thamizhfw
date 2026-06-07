import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useTheme, Card, Badge } from '@tamilfw/ui';
import { useLocalSearchParams } from 'expo-router';
import type { Article, Entity } from '@tamilfw/core/journalism';

export default function ArticleDetail() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getStorage } = await import('@tamilfw/core');
        const storage = getStorage();
        const a = await storage.getArticleById(params.id);
        if (!a) {
          setLoading(false);
          return;
        }
        setArticle(a);
        if (a.entities) {
          const loaded = await Promise.all(
            a.entities.map((ref) => storage.getEntityById(ref.id))
          );
          setEntities(loaded.filter((e): e is Entity => e !== null));
        }
      } catch (err) {
        console.warn('Failed to load article:', err);
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

  if (!article) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>Article not found</Text>
      </View>
    );
  }

  const formatDate = (ts: number | null) => {
    if (!ts) return 'Unpublished';
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {article.category && <Badge label={article.category} variant="info" />}
          <Badge
            label={article.status}
            variant={article.status === 'published' ? 'success' : 'warning'}
          />
          <Text style={{ color: theme.colors.fgDim, fontSize: 11, alignSelf: 'center' }}>
            {formatDate(article.publishedAt)}
          </Text>
        </View>

        <Text
          style={{
            color: theme.colors.fg,
            fontSize: 24,
            fontWeight: '800',
            lineHeight: 32,
            marginBottom: 12,
          }}
        >
          {article.title}
        </Text>

        {article.excerpt && (
          <Text
            style={{
              color: theme.colors.fgMuted,
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 20,
              fontStyle: 'italic',
            }}
          >
            {article.excerpt}
          </Text>
        )}

        <Text
          style={{
            color: theme.colors.fg,
            fontSize: 15,
            lineHeight: 24,
            marginBottom: 24,
          }}
        >
          {article.body}
        </Text>

        {article.sourceUrl && (
          <Pressable
            onPress={() => Linking.openURL(article.sourceUrl!)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: theme.colors.accent, fontSize: 12 }}>↗</Text>
            <Text style={{ color: theme.colors.accent, fontSize: 12, fontFamily: 'SpaceMono' }}>
              {article.sourceUrl}
            </Text>
          </Pressable>
        )}

        {entities.length > 0 && (
          <Card variant="bordered" padding={16}>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 12,
              }}
            >
              LINKED ENTITIES ({entities.length})
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {entities.map((entity) => (
                <Pressable
                  key={entity.id}
                  onPress={() => {
                    import('expo-router').then(({ router }) => router.push(`/entity/${entity.id}`));
                  }}
                >
                  <Badge
                    label={entity.name}
                    variant="entity"
                    entityType={entity.type}
                  />
                </Pressable>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}