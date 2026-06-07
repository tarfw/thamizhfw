import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { useTheme, Card, Badge, EntityCard } from '@tamilfw/ui';
import { GraphCanvas } from '@tamilfw/graph';
import type { GraphData, Entity, Connection } from '@tamilfw/core/journalism';

const { width } = Dimensions.get('window');
const GRAPH_WIDTH = width;
const GRAPH_HEIGHT = 320;

export default function InvestigateTab() {
  const theme = useTheme();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadGraph = async () => {
    try {
      const { getStorage } = await import('@tamilfw/core');
      const storage = getStorage();
      const [graph, entityList] = await Promise.all([
        storage.getGraphData(),
        storage.listEntities({ limit: 50, offset: 0 }),
      ]);
      setGraphData(graph);
      setEntities(entityList.entities);
    } catch (err) {
      console.warn('Failed to load graph:', err);
      setGraphData({ nodes: [], edges: [], clusters: [] });
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, []);

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

  const filteredNodes = graphData?.nodes.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  }) || [];

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = graphData?.edges.filter((e) => {
    if (filterType === 'all') return true;
    return filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target);
  }) || [];

  const TYPES = ['all', 'person', 'organization', 'location', 'event', 'document'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: theme.colors.bg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                color: theme.colors.fg,
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: 1,
                marginBottom: 4,
              }}
            >
              INVESTIGATE
            </Text>
            <Text style={{ color: theme.colors.fgDim, fontSize: 12 }}>
              {filteredNodes.length} nodes • {filteredEdges.length} edges
            </Text>
          </View>
          <Pressable
            onPress={() => {
              import('expo-router').then(({ router }) => router.push('/graph'));
            }}
          >
            <Badge label="EXPAND" variant="info" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 6 }}
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
      </ScrollView>

      <Card variant="default" padding={0} style={{ marginHorizontal: 16, marginBottom: 12, overflow: 'hidden' }}>
        {filteredNodes.length > 0 ? (
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
            width={GRAPH_WIDTH - 32}
            height={GRAPH_HEIGHT}
            selectedNodeId={selectedNode?.id}
            onNodePress={(node) => {
              const entity = entities.find((e) => e.id === node.id);
              if (entity) setSelectedNode(entity);
            }}
            onBackgroundPress={() => setSelectedNode(null)}
          />
        ) : (
          <View
            style={{
              width: GRAPH_WIDTH - 32,
              height: GRAPH_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: theme.colors.fgMuted, fontSize: 13, textAlign: 'center' }}>
              No entities yet
            </Text>
            <Text
              style={{
                color: theme.colors.fgDim,
                fontSize: 11,
                textAlign: 'center',
                marginTop: 6,
                fontFamily: 'SpaceMono',
              }}
            >
              Run db:seed to populate
            </Text>
          </View>
        )}
      </Card>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {selectedNode ? (
          <Card variant="bordered" padding={16}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Badge
                label={selectedNode.type}
                variant="entity"
                entityType={selectedNode.type}
              />
              <Pressable onPress={() => setSelectedNode(null)}>
                <Text style={{ color: theme.colors.fgMuted, fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>
            <Text style={{ color: theme.colors.fg, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
              {selectedNode.name}
            </Text>
            {selectedNode.description && (
              <Text style={{ color: theme.colors.fgMuted, fontSize: 13, lineHeight: 18, marginBottom: 8 }}>
                {selectedNode.description}
              </Text>
            )}
            {selectedNode.aliases && selectedNode.aliases.length > 0 && (
              <Text style={{ color: theme.colors.fgDim, fontSize: 11, fontFamily: 'SpaceMono' }}>
                aka {selectedNode.aliases.join(', ')}
              </Text>
            )}
          </Card>
        ) : (
          <Text style={{ color: theme.colors.fgDim, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
            Tap a node to inspect • Drag to pan • Pinch to zoom
          </Text>
        )}
      </View>
    </View>
  );
}