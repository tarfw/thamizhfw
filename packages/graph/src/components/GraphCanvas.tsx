import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '@tamilfw/ui';
import { createForceLayout, stepLayout, type SimNode, type SimLink } from '../layout/forceGraph';

type GraphNode = {
  id: string;
  name: string;
  type: string;
  color?: string;
  size?: number;
};

type GraphEdge = {
  source: string;
  target: string;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
};

type GraphCanvasProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  onNodePress?: (node: GraphNode) => void;
  onBackgroundPress?: () => void;
  selectedNodeId?: string;
};

const DEFAULT_COLORS: Record<string, string> = {
  person: '#3B82F6',
  organization: '#8B5CF6',
  location: '#10B981',
  event: '#F59E0B',
  document: '#EC4899',
};

export function GraphCanvas({
  nodes,
  edges,
  width,
  height,
  onNodePress,
  onBackgroundPress,
  selectedNodeId,
}: GraphCanvasProps) {
  const theme = useTheme();
  const [layout, setLayout] = useState<{ nodes: SimNode[]; links: SimLink[] } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const lastPan = useRef({ x: 0, y: 0 });
  const lastDistance = useRef<number | null>(null);

  useEffect(() => {
    if (nodes.length === 0) {
      setLayout(null);
      return;
    }
    const result = createForceLayout(
      nodes.map((n) => ({ id: n.id, name: n.name, type: n.type, weight: n.size || 1 })),
      edges.map((e) => ({ source: e.source, target: e.target, weight: e.width || 1 })),
      { width, height }
    );
    stepLayout(result.simulation, 200).then(() => {
      setLayout({ nodes: result.nodes, links: result.links });
    });
  }, [nodes, edges, width, height]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    layout?.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layout]);

  const handlePanStart = (e: any) => {
    lastPan.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
  };

  const handlePanMove = (e: any) => {
    const dx = e.nativeEvent.locationX - lastPan.current.x;
    const dy = e.nativeEvent.locationY - lastPan.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastPan.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
  };

  const handleTap = (e: any) => {
    if (onBackgroundPress && (!e.nativeEvent.target || e.nativeEvent.target === 'background')) {
      onBackgroundPress();
    }
  };

  if (nodes.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>No nodes to display</Text>
      </View>
    );
  }

  if (!layout) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: theme.colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.colors.fgMuted, fontSize: 14 }}>Loading graph...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: theme.colors.bg,
        overflow: 'hidden',
        position: 'relative',
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handlePanStart}
      onResponderMove={handlePanMove}
      onResponderRelease={handleTap}
    >
      <View
        style={{
          position: 'absolute',
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale },
          ],
        }}
      >
        {layout.links.map((link, idx) => {
          const s = link.source as SimNode;
          const t = link.target as SimNode;
          if (typeof s.x !== 'number' || typeof t.x !== 'number') return null;
          const sx = (s.x ?? 0) + width / 2;
          const sy = (s.y ?? 0) + height / 2;
          const tx = (t.x ?? 0) + width / 2;
          const ty = (t.y ?? 0) + height / 2;
          const length = Math.sqrt(Math.pow(tx - sx, 2) + Math.pow(ty - sy, 2));
          const angle = Math.atan2(ty - sy, tx - sx) * (180 / Math.PI);
          return (
            <View
              key={`edge-${idx}`}
              style={{
                position: 'absolute',
                left: sx,
                top: sy,
                width: length,
                height: 1,
                backgroundColor: theme.colors.border,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: '0% 50%',
                opacity: 0.4,
              }}
            />
          );
        })}

        {layout.nodes.map((node) => {
          const data = nodes.find((n) => n.id === node.id);
          if (!data || typeof node.x !== 'number') return null;
          const color = data.color || DEFAULT_COLORS[data.type] || theme.colors.fgMuted;
          const size = data.size || 24;
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNode === node.id;
          return (
            <Pressable
              key={node.id}
              onPress={() => onNodePress?.(data)}
              onHoverIn={() => setHoveredNode(node.id)}
              onHoverOut={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: (node.x ?? 0) + width / 2 - size / 2,
                top: (node.y ?? 0) + height / 2 - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color + '40',
                borderWidth: isSelected ? 3 : 2,
                borderColor: isSelected ? theme.colors.accent || theme.colors.fg : color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: theme.colors.fg, fontSize: 10, fontWeight: '700' }}>
                {data.name.charAt(0).toUpperCase()}
              </Text>
              {(isHovered || isSelected) && (
                <View
                  style={{
                    position: 'absolute',
                    top: size + 4,
                    backgroundColor: theme.colors.bgElevated,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text style={{ color: theme.colors.fg, fontSize: 10, fontWeight: '600' }}>
                    {data.name}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Pressable
          onPress={() => setScale((s) => Math.min(s + 0.2, 3))}
          style={{
            width: 32,
            height: 32,
            backgroundColor: theme.colors.bgElevated,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.fg, fontSize: 16, fontWeight: '700' }}>+</Text>
        </Pressable>
        <Pressable
          onPress={() => setScale((s) => Math.max(s - 0.2, 0.5))}
          style={{
            width: 32,
            height: 32,
            backgroundColor: theme.colors.bgElevated,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.fg, fontSize: 16, fontWeight: '700' }}>−</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setPan({ x: 0, y: 0 });
            setScale(1);
          }}
          style={{
            width: 32,
            height: 32,
            backgroundColor: theme.colors.bgElevated,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.fg, fontSize: 9, fontWeight: '700' }}>RESET</Text>
        </Pressable>
      </View>
    </View>
  );
}
