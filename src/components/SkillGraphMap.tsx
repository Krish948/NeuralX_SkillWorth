import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { SkillDependencyGraph, SkillGraphNodeStatus } from '@/lib/skill-graph';

type NodePosition = {
  x: number;
  y: number;
};

interface SkillGraphMapProps {
  graph: SkillDependencyGraph;
  selectedSkills?: string[];
  onToggleSkill?: (skill: string) => void;
}

const statusColor: Record<SkillGraphNodeStatus, string> = {
  owned: '#15803d',
  target: '#0f766e',
  ready: '#1d4ed8',
  blocked: '#b45309',
};

const statusLabel: Record<SkillGraphNodeStatus, string> = {
  owned: 'Owned',
  target: 'Target',
  ready: 'Ready',
  blocked: 'Blocked',
};

const statusDotClass: Record<SkillGraphNodeStatus, string> = {
  owned: 'bg-green-700',
  target: 'bg-teal-700',
  ready: 'bg-blue-700',
  blocked: 'bg-amber-700',
};

function statusBadgeVariant(status: SkillGraphNodeStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'owned') return 'default';
  if (status === 'blocked') return 'outline';
  return 'secondary';
}

export function SkillGraphMap({ graph, selectedSkills = [], onToggleSkill }: SkillGraphMapProps) {
  const width = 860;
  const height = 320;
  const paddingX = 70;
  const paddingY = 30;

  const { positions, nodesByTier } = useMemo(() => {
    const grouped = Array.from({ length: graph.maxTier + 1 }, (_, tier) =>
      graph.nodes.filter(node => node.tier === tier),
    );

    const map = new Map<string, NodePosition>();
    const tierSpan = graph.maxTier === 0 ? 1 : graph.maxTier;

    grouped.forEach((nodes, tier) => {
      const x = paddingX + (tier * (width - paddingX * 2)) / tierSpan;
      const step = height / (nodes.length + 1);
      nodes.forEach((node, index) => {
        map.set(node.id, {
          x,
          y: paddingY + step * (index + 1),
        });
      });
    });

    return {
      positions: map,
      nodesByTier: grouped,
    };
  }, [graph.maxTier, graph.nodes]);

  if (graph.nodes.length === 0) {
    return <p className="text-xs text-muted-foreground">No graph data yet. Add target skills to render dependencies.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-xl border border-border/60 bg-card/70 p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-[280px]">
          {graph.edges.map(edge => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x + 12}
                y1={from.y}
                x2={to.x - 12}
                y2={to.y}
                stroke="#94a3b8"
                strokeOpacity="0.8"
                strokeWidth="1.3"
              />
            );
          })}

          {graph.nodes.map(node => {
            const point = positions.get(node.id);
            if (!point) return null;
            const isSelected = selectedSkills.includes(node.skill);

            return (
              <g
                key={node.id}
                className={onToggleSkill ? 'cursor-pointer' : undefined}
                onClick={() => onToggleSkill?.(node.skill)}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isSelected ? 11 : 9}
                  fill={statusColor[node.status]}
                  stroke={isSelected ? '#0f172a' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={point.x + 14}
                  y={point.y + 4}
                  fontSize="11"
                  fill={isSelected ? '#020617' : '#0f172a'}
                  fontWeight={isSelected ? '700' : '600'}
                >
                  {node.skill}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        {(Object.keys(statusLabel) as SkillGraphNodeStatus[]).map(status => (
          <Badge key={status} variant={statusBadgeVariant(status)} className="gap-1.5">
            <span className={`inline-block h-2 w-2 rounded-full ${statusDotClass[status]}`} />
            {statusLabel[status]}
          </Badge>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {nodesByTier.map((nodes, tier) => (
          <div key={`tier-${tier}`} className="rounded-xl border border-border/60 p-2.5 bg-muted/20">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tier {tier}</p>
            <p className="text-xs mt-1">
              {nodes.length > 0 ? nodes.map(node => node.skill).join(', ') : 'No skills'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
