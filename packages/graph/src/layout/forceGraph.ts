import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type Simulation, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';

export type GraphNodeData = {
  id: string;
  name: string;
  type: string;
  weight?: number;
};

export type GraphLinkData = {
  source: string;
  target: string;
  weight?: number;
};

export type SimNode = SimulationNodeDatum & {
  id: string;
  name: string;
  type: string;
  weight: number;
};

export type SimLink = SimulationLinkDatum<SimNode> & {
  weight: number;
};

export function createForceLayout(
  nodes: GraphNodeData[],
  links: GraphLinkData[],
  options?: {
    width?: number;
    height?: number;
    linkDistance?: number;
    chargeStrength?: number;
  }
): { simulation: Simulation<SimNode, SimLink>; nodes: SimNode[]; links: SimLink[] } {
  const width = options?.width ?? 800;
  const height = options?.height ?? 600;
  const linkDistance = options?.linkDistance ?? 80;
  const chargeStrength = options?.chargeStrength ?? -200;

  const simNodes: SimNode[] = nodes.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type,
    weight: n.weight ?? 1,
  }));

  const simLinks: SimLink[] = links.map((l) => ({
    source: l.source,
    target: l.target,
    weight: l.weight ?? 1,
  }));

  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance((d) => linkDistance / Math.max(d.weight, 0.5))
    )
    .force('charge', forceManyBody<SimNode>().strength(chargeStrength))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide<SimNode>().radius(20));

  return { simulation, nodes: simNodes, links: simLinks };
}

export function stepLayout(
  simulation: Simulation<SimNode, SimLink>,
  iterations: number = 300
): Promise<SimNode[]> {
  return new Promise((resolve) => {
    const nodes = simulation.nodes();
    simulation.stop();
    for (let i = 0; i < iterations; i++) {
      simulation.tick();
    }
    resolve(nodes);
  });
}
