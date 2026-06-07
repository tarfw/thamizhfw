import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme, Badge } from '@tamilfw/ui';
import { GraphCanvas } from '@tamilfw/graph';
import { useRouter } from 'expo-router';
import type { GraphData } from '@tamilfw/core/journalism';

const { width, height } = Dimensions.get('window');

export default function FullGraph() {
  const theme = useTheme();
  const router = useRouter();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const { getStorage } = await import('@tamilfw/core');
        const storage = getStorage();
        const graph = await storage.getGraphData();
        setGraphData(graph);
      } catch (err) {
        console.warn('Failed to load full graph:', err);
        setGraphData({ nodes: [], edges: [], clusters: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const TYPES = ['all', 'person', 'organization', 'location', 'event', 'document'];

  const filteredNodes = graphData?.nodes.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  }) || [];

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = graphData?.edges.filter((e) => {
    if (filterType === 'all') return true;
    return filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target);
  }) || [];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: 60,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.colors.bg + 'F0',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>←</Text>
          <Text style={{ color: theme.colors.fgMuted, fontSize: 12 }}>Back</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: theme.colors.accent, fontSize: 14 }}>⬢</Text>
          <Text
            style={{
              color: theme.colors.fg,
              fontSize: 14,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >
            FULL GRAPH
          </Text>
        </View>
        <Badge label={`${filteredNodes.length}N ${filteredEdges.length}E`} variant="info" size="sm" />
      </View>

      <View
        style={{
          position: 'absolute',
          top: 110,
          left: 0,
          right: 0,
          zIndex: 9,
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 4,
          paddingHorizontal: 16,
        }}
      >
        {TYPES.map((t) => (
          <Pressable key={t} onPress={() => setFilterType(t)}>
            <Badge
              label={t}
              variant={filterType === t ? 'entity' : 'default'}
              entityType={t === 'all' ? undefined : (t as any)}
            />
          </Pressable>
        ))}
      </View>

      {filteredNodes.length > 0 ? (
        <View style={{ marginTop: 160 }}>
          <GraphCanvas
            nodes={filteredNodes.map((n) => ({
              id: n.id,
              name: n.label,
              type: n.type,
              color: n.color,
              size: n.size,
            }))}
            edges={filteredEdges.map((e) => ({
              source: e.source,
              target: e.target,
              color: e.color,
              width: e.width,
              style: e.style,
            }))}
            width={width}
            height={height - 180}
            onNodePress={(node) => router.push(`/entity/${node.id}`)}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 100,
          }}
        >
          <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>No nodes to display</Text>
          <Text
            style={{
              color: theme.colors.fgDim,
              fontSize: 11,
              fontFamily: 'SpaceMono',
              marginTop: 8,
            }}
          >
            Run db:seed to populate
          </Text>
        </View>
      )}
    </View>
  );
}