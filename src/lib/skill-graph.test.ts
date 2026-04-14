import { describe, expect, it } from 'vitest';
import {
  buildSkillDependencyGraph,
  buildSkillGraphSignals,
  getAdjacentSkills,
  getMissingPrerequisites,
  getRoleClusterInsights,
} from '@/lib/skill-graph';
import type { JobRow } from '@/hooks/useJobs';

const jobs: JobRow[] = [
  {
    id: 'job-1',
    role: 'Frontend Developer',
    required_skills: ['React', 'TypeScript', 'Next.js'],
    salary_min: 60000,
    salary_max: 120000,
    category: 'frontend',
  },
  {
    id: 'job-2',
    role: 'Full Stack Developer',
    required_skills: ['React', 'Node.js', 'SQL', 'Docker'],
    salary_min: 70000,
    salary_max: 140000,
    category: 'fullstack',
  },
];

describe('skill-graph', () => {
  it('detects missing prerequisites for dependency chains', () => {
    expect(getMissingPrerequisites('Next.js', ['React'])).toEqual(['TypeScript']);
  });

  it('returns adjacent skills for exploration', () => {
    const adjacent = getAdjacentSkills('React');
    expect(adjacent).toContain('Next.js');
    expect(adjacent.length).toBeGreaterThan(0);
  });

  it('builds dependency signals for recommendation scoring', () => {
    const signals = buildSkillGraphSignals(['HTML', 'CSS', 'JavaScript', 'React'], 'Next.js', jobs);

    expect(signals.missingPrerequisites).toEqual(['TypeScript']);
    expect(signals.roleClusters.length).toBeGreaterThan(0);
  });

  it('computes role cluster completion from user skills', () => {
    const clusters = getRoleClusterInsights(['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript']);

    expect(clusters[0].completion).toBeGreaterThan(0);
    expect(clusters[0].missingSkills.length).toBeGreaterThan(0);
  });

  it('builds a compact dependency graph with edges and statuses', () => {
    const graph = buildSkillDependencyGraph(['HTML', 'CSS', 'JavaScript', 'React'], ['Next.js', 'Node.js']);

    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    const nextNode = graph.nodes.find(node => node.skill === 'Next.js');
    expect(nextNode?.status).toBe('blocked');

    const typeScriptNode = graph.nodes.find(node => node.skill === 'TypeScript');
    expect(typeScriptNode?.status).toBe('ready');
  });
});
