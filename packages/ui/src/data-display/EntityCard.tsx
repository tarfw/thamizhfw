import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card, Badge } from '../primitives';
import { useTheme } from '../theme';
import type { Entity } from '@tamilfw/core/journalism';

type EntityCardProps = {
  entity: Entity;
  onPress?: (entity: Entity) => void;
  showConnections?: boolean;
  connectionCount?: number;
};

export function EntityCard({ entity, onPress, showConnections = true, connectionCount = 0 }: EntityCardProps) {
  const theme = useTheme();
  
  const entityColor = (theme.colors as any).entity?.[entity.type] || theme.colors.fgMuted;
  
  return (
    <Pressable onPress={() => onPress?.(entity)}>
      <Card variant="bordered" padding={12}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: entityColor + '30',
              borderWidth: 2,
              borderColor: entityColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: entityColor, fontSize: 16, fontWeight: '700' }}>
              {entity.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Text
                numberOfLines={1}
                style={{
                  color: theme.colors.fg,
                  fontSize: 14,
                  fontWeight: '600',
                  flex: 1,
                }}
              >
                {entity.name}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Badge label={entity.type} variant="entity" entityType={entity.type} size="sm" />
              {showConnections && connectionCount > 0 && (
                <Text style={{ color: theme.colors.fgDim, fontSize: 11 }}>
                  {connectionCount} connection{connectionCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            {entity.aliases && entity.aliases.length > 0 && (
              <Text style={{ color: theme.colors.fgDim, fontSize: 10, marginTop: 2 }}>
                aka {entity.aliases.slice(0, 3).join(', ')}
                {entity.aliases.length > 3 ? '...' : ''}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
