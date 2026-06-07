import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { useTheme, ArticleCard, Card, Badge } from '@tamilfw/ui';
import type { Article, ListParams } from '@tamilfw/core/journalism';

const CATEGORIES = ['all', 'politics', 'investigative', 'local', 'economy', 'environment'];

export default function FeedTab() {
  const theme = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');

  const loadArticles = async () => {
    try {
      const params: ListParams = {
        limit: 20,
        offset: 0,
        status: 'published',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      };
      if (category !== 'all') {
        params.category = category;
      }
      const { getStorage } = await import('@tamilfw/core');
      const storage = getStorage();
      const { articles: data } = await storage.listArticles(params);
      setArticles(data);
    } catch (err) {
      console.warn('Failed to load articles (DB may not be seeded yet):', err);
      setArticles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [category]);

  const onRefresh = () => {
    setRefreshing(true);
    loadArticles();
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: theme.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            color: theme.colors.fg,
            fontSize: 20,
            fontWeight: '700',
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          FEED
        </Text>
        <Text style={{ color: theme.colors.fgDim, fontSize: 12 }}>
          {articles.length} article{articles.length !== 1 ? 's' : ''} • last 30 days
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable key={cat} onPress={() => setCategory(cat)}>
            <Badge
              label={cat}
              variant={category === cat ? 'info' : 'default'}
            />
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {articles.length === 0 ? (
          <Card variant="bordered" padding={24}>
            <Text style={{ color: theme.colors.fgMuted, fontSize: 14, textAlign: 'center' }}>
              No articles yet. Run the seed script to populate data.
            </Text>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 11,
                textAlign: 'center',
                marginTop: 8,
                fontFamily: 'SpaceMono',
              }}
            >
              cd packages/core && npm run db:seed
            </Text>
          </Card>
        ) : (
          articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPress={(a) => {
                import('expo-router').then(({ router }) => {
                  router.push(`/article/${a.id}`);
                });
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}