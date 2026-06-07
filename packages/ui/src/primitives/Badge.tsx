import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import type { EntityType } from '@tamilfw/core/journalism';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'entity';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  entityType?: EntityType;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

export function Badge({ label, variant = 'default', entityType, size = 'sm', style }: BadgeProps) {
  const theme = useTheme();
  
  const isEntity = variant === 'entity' && entityType;
  const entityColors = isEntity ? (theme.colors as any).entity?.[entityType as EntityType] : null;
  
  const variantMap: Record<BadgeVariant, { bg: string; fg: string }> = {
    default: { bg: theme.colors.bgHover, fg: theme.colors.fg },
    success: { bg: (theme.colors as any).status?.success || '#10B981', fg: '#FFFFFF' },
    warning: { bg: (theme.colors as any).status?.warning || '#F59E0B', fg: '#000000' },
    danger: { bg: (theme.colors as any).status?.danger || '#EF4444', fg: '#FFFFFF' },
    info: { bg: (theme.colors as any).status?.info || '#3B82F6', fg: '#FFFFFF' },
    entity: { bg: entityColors ? entityColors + '30' : theme.colors.bgHover, fg: entityColors || theme.colors.fg },
  };

  const colors = variantMap[variant];
  const sizeMap = { sm: { px: 6, py: 2, fontSize: 10 }, md: { px: 8, py: 4, fontSize: 12 } };
  const s = sizeMap[size];

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: theme.radius.sm,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.fg,
          fontSize: s.fontSize,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
