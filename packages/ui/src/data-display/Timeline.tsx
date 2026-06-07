import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  date: number;
  type?: 'event' | 'article' | 'note';
  meta?: string;
};

type TimelineProps = {
  items: TimelineItem[];
  style?: ViewStyle;
};

export function Timeline({ items, style }: TimelineProps) {
  const theme = useTheme();
  
  const sorted = [...items].sort((a, b) => b.date - a.date);
  
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeColor = (type?: TimelineItem['type']) => {
    switch (type) {
      case 'event': return (theme.colors as any).entity?.event || '#F59E0B';
      case 'article': return (theme.colors as any).entity?.document || '#EC4899';
      case 'note': return (theme.colors as any).entity?.location || '#10B981';
      default: return theme.colors.fgMuted;
    }
  };

  return (
    <View style={[{ paddingLeft: 8 }, style]}>
      {sorted.map((item, idx) => {
        const isLast = idx === sorted.length - 1;
        const color = getTypeColor(item.type);
        return (
          <View key={item.id} style={{ flexDirection: 'row', paddingVertical: 8 }}>
            <View style={{ alignItems: 'center', marginRight: 12, width: 16 }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: color,
                  borderWidth: 2,
                  borderColor: theme.colors.bg,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    backgroundColor: theme.colors.border,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 8 }}>
              <Text style={{ color: theme.colors.fg, fontSize: 13, fontWeight: '600' }}>
                {item.title}
              </Text>
              <Text style={{ color: theme.colors.fgDim, fontSize: 11, marginTop: 2 }}>
                {formatDate(item.date)}{item.meta ? ` • ${item.meta}` : ''}
              </Text>
              {item.description && (
                <Text
                  style={{ color: theme.colors.fgMuted, fontSize: 12, marginTop: 4, lineHeight: 16 }}
                  numberOfLines={3}
                >
                  {item.description}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
