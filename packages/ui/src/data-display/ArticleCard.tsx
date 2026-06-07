import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card, Badge } from '../primitives';
import { useTheme } from '../theme';
import type { Article } from '@tamilfw/core/journalism';

type ArticleCardProps = {
  article: Article;
  onPress?: (article: Article) => void;
  compact?: boolean;
};

export function ArticleCard({ article, onPress, compact = false }: ArticleCardProps) {
  const theme = useTheme();
  
  const formatDate = (ts: number | null) => {
    if (!ts) return 'Draft';
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Pressable onPress={() => onPress?.(article)}>
      <Card variant="bordered" padding={compact ? 12 : 16}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {article.category && <Badge label={article.category} variant="info" />}
            <Badge
              label={article.status}
              variant={article.status === 'published' ? 'success' : article.status === 'draft' ? 'warning' : 'default'}
            />
          </View>
          <Text style={{ color: theme.colors.fgDim, fontSize: 11 }}>
            {formatDate(article.publishedAt)}
          </Text>
        </View>
        
        <Text
          numberOfLines={2}
          style={{
            color: theme.colors.fg,
            fontSize: compact ? 14 : 16,
            fontWeight: '700',
            marginBottom: 6,
          }}
        >
          {article.title}
        </Text>
        
        {!compact && article.excerpt && (
          <Text
            numberOfLines={2}
            style={{
              color: theme.colors.fgMuted,
              fontSize: 13,
              lineHeight: 18,
              marginBottom: 8,
            }}
          >
            {article.excerpt}
          </Text>
        )}
        
        {article.entities && article.entities.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {article.entities.slice(0, 4).map((entity) => (
              <Badge
                key={entity.id}
                label={entity.name}
                variant="entity"
                entityType={entity.type}
              />
            ))}
            {article.entities.length > 4 && (
              <Text style={{ color: theme.colors.fgDim, fontSize: 10, alignSelf: 'center' }}>
                +{article.entities.length - 4} more
              </Text>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
