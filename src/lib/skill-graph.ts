import { skillSalaryMap } from '@/data/skillsMapping';
import type { JobRow } from '@/hooks/useJobs';

export interface SkillGraphSignals {
  missingPrerequisites: string[];
  unlockedSkills: string[];
  adjacentSkills: string[];
  roleClusters: string[];
  dependencyScore: number;
}

export interface RoleClusterInsight {
  id: string;
  label: string;
  matchedSkills: string[];
  missingSkills: string[];
  completion: number;
}

export type SkillGraphNodeStatus = 'owned' | 'target' | 'ready' | 'blocked';

export interface SkillDependencyGraphNode {
  id: string;
  skill: string;
  tier: number;
  status: SkillGraphNodeStatus;
  prerequisites: string[];
}

export interface SkillDependencyGraphEdge {
  from: string;
  to: string;
}

export interface SkillDependencyGraph {
  nodes: SkillDependencyGraphNode[];
  edges: SkillDependencyGraphEdge[];
  maxTier: number;
}

type RoleClusterDefinition = {
  label: string;
  roles: string[];
  anchorSkills: string[];
};

const prerequisiteMap: Record<string, string[]> = {
  'TypeScript': ['JavaScript'],
  'React': ['JavaScript', 'HTML', 'CSS'],
  'Next.js': ['React', 'TypeScript'],
  'Vue.js': ['JavaScript', 'HTML', 'CSS'],
  'Angular': ['TypeScript', 'HTML', 'CSS'],
  'Tailwind CSS': ['CSS'],
  'Node.js': ['JavaScript'],
  'Express.js': ['Node.js'],
  'REST API': ['Node.js'],
  'GraphQL': ['REST API'],
  'Django': ['Python'],
  'Spring Boot': ['Java'],
  'Kubernetes': ['Docker'],
  'CI/CD': ['Git'],
  'AWS': ['Docker'],
  'Azure': ['Docker'],
  'GCP': ['Docker'],
  'PostgreSQL': ['SQL'],
  'MongoDB': ['Node.js'],
  'Redis': ['Node.js'],
  'Machine Learning': ['Python', 'Data Analysis'],
  'TensorFlow': ['Machine Learning'],
  'Power BI': ['Data Analysis'],
};

const adjacencyMap: Record<string, string[]> = {
  'HTML': ['CSS', 'JavaScript', 'UI/UX Design'],
  'CSS': ['HTML', 'Tailwind CSS', 'UI/UX Design'],
  'JavaScript': ['TypeScript', 'React', 'Node.js'],
  'TypeScript': ['JavaScript', 'React', 'Next.js'],
  'React': ['TypeScript', 'Next.js', 'GraphQL'],
  'Next.js': ['React', 'TypeScript', 'Tailwind CSS'],
  'Node.js': ['Express.js', 'REST API', 'MongoDB'],
  'Express.js': ['Node.js', 'REST API', 'SQL'],
  'Python': ['Django', 'Data Analysis', 'Machine Learning'],
  'Django': ['Python', 'SQL', 'REST API'],
  'Java': ['Spring Boot', 'SQL', 'Docker'],
  'Spring Boot': ['Java', 'Docker', 'CI/CD'],
  'SQL': ['PostgreSQL', 'Data Analysis', 'REST API'],
  'Docker': ['Kubernetes', 'CI/CD', 'AWS'],
  'Kubernetes': ['Docker', 'AWS', 'Azure'],
  'AWS': ['Docker', 'CI/CD', 'Kubernetes'],
  'Azure': ['Docker', 'CI/CD', 'Kubernetes'],
  'Machine Learning': ['TensorFlow', 'Data Analysis', 'Python'],
};

const roleClusterMap: Record<string, RoleClusterDefinition> = {
  'frontend-engineering': {
    label: 'Frontend Engineering',
    roles: ['Frontend Developer', 'UI Engineer', 'Product Engineer'],
    anchorSkills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js'],
  },
  'backend-platform': {
    label: 'Backend Platform',
    roles: ['Backend Developer', 'Platform Engineer', 'API Engineer'],
    anchorSkills: ['Node.js', 'Express.js', 'REST API', 'SQL', 'Docker', 'AWS'],
  },
  'fullstack-product': {
    label: 'Full Stack Product',
    roles: ['Full Stack Developer', 'Software Engineer'],
    anchorSkills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Docker'],
  },
  'cloud-devops': {
    label: 'Cloud and DevOps',
    roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer'],
    anchorSkills: ['Git', 'CI/CD', 'Docker', 'Kubernetes', 'AWS', 'Azure'],
  },
  'data-ai': {
    label: 'Data and AI',
    roles: ['Data Scientist', 'ML Engineer', 'Data Analyst'],
    anchorSkills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'TensorFlow', 'Power BI'],
  },
};

function unique(items: string[]): string[] {
  return Array.from(new Set(items));
}

function getCategoryAdjacentSkills(skill: string): string[] {
  const category = skillSalaryMap[skill]?.category;
  if (!category) return [];

  return Object.keys(skillSalaryMap).filter(candidate => candidate !== skill && skillSalaryMap[candidate].category === category);
}

export function getSkillPrerequisites(skill: string): string[] {
  return prerequisiteMap[skill] || [];
}

export function getMissingPrerequisites(skill: string, userSkills: string[]): string[] {
  const userSet = new Set(userSkills);
  return getSkillPrerequisites(skill).filter(prerequisite => !userSet.has(prerequisite));
}

export function getAdjacentSkills(skill: string): string[] {
  const explicitAdjacent = adjacencyMap[skill] || [];
  const categoryAdjacent = getCategoryAdjacentSkills(skill).slice(0, 4);
  return unique([...explicitAdjacent, ...categoryAdjacent]).slice(0, 6);
}

export function getRoleClusterInsights(userSkills: string[]): RoleClusterInsight[] {
  const userSet = new Set(userSkills);

  return Object.entries(roleClusterMap)
    .map(([id, cluster]) => {
      const matchedSkills = cluster.anchorSkills.filter(skill => userSet.has(skill));
      const missingSkills = cluster.anchorSkills.filter(skill => !userSet.has(skill));
      const completion = Math.round((matchedSkills.length / cluster.anchorSkills.length) * 100);

      return {
        id,
        label: cluster.label,
        matchedSkills,
        missingSkills,
        completion,
      };
    })
    .sort((a, b) => b.completion - a.completion || a.label.localeCompare(b.label));
}

function getNodeStatus(params: {
  skill: string;
  userSkills: string[];
  seedSet: Set<string>;
}): SkillGraphNodeStatus {
  const { skill, userSkills, seedSet } = params;
  const userSet = new Set(userSkills);
  if (userSet.has(skill)) return 'owned';

  const missingPrerequisites = getMissingPrerequisites(skill, userSkills);
  if (missingPrerequisites.length > 0) return 'blocked';
  if (seedSet.has(skill)) return 'target';
  return 'ready';
}

export function buildSkillDependencyGraph(userSkills: string[], seedSkills: string[]): SkillDependencyGraph {
  const validSeeds = unique(seedSkills).filter(skill => Boolean(skillSalaryMap[skill]));
  const seedSet = new Set(validSeeds);
  const nodeSet = new Set<string>();
  const visited = new Set<string>();

  const collectWithPrerequisites = (skill: string) => {
    if (visited.has(skill)) return;
    visited.add(skill);
    nodeSet.add(skill);
    getSkillPrerequisites(skill).forEach(prerequisite => {
      if (!skillSalaryMap[prerequisite]) return;
      collectWithPrerequisites(prerequisite);
    });
  };

  validSeeds.forEach(collectWithPrerequisites);

  if (nodeSet.size === 0) {
    return {
      nodes: [],
      edges: [],
      maxTier: 0,
    };
  }

  const memoTier = new Map<string, number>();
  const getTier = (skill: string): number => {
    const cached = memoTier.get(skill);
    if (cached !== undefined) return cached;

    const prerequisites = getSkillPrerequisites(skill).filter(prerequisite => nodeSet.has(prerequisite));
    if (prerequisites.length === 0) {
      memoTier.set(skill, 0);
      return 0;
    }

    const tier = Math.max(...prerequisites.map(getTier)) + 1;
    memoTier.set(skill, tier);
    return tier;
  };

  const nodes = Array.from(nodeSet)
    .map(skill => ({
      id: skill.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      skill,
      tier: getTier(skill),
      status: getNodeStatus({ skill, userSkills, seedSet }),
      prerequisites: getSkillPrerequisites(skill).filter(prerequisite => nodeSet.has(prerequisite)),
    }))
    .sort((a, b) => a.tier - b.tier || a.skill.localeCompare(b.skill));

  const idBySkill = new Map(nodes.map(node => [node.skill, node.id]));
  const edges: SkillDependencyGraphEdge[] = [];

  nodes.forEach(node => {
    node.prerequisites.forEach(prerequisite => {
      const from = idBySkill.get(prerequisite);
      if (!from) return;
      edges.push({ from, to: node.id });
    });
  });

  const maxTier = nodes.reduce((max, node) => Math.max(max, node.tier), 0);

  return {
    nodes,
    edges,
    maxTier,
  };
}

function getRoleClustersForSkill(skill: string): string[] {
  return Object.values(roleClusterMap)
    .filter(cluster => cluster.anchorSkills.includes(skill))
    .map(cluster => cluster.label);
}

function countRoleDependencyCoverage(jobs: JobRow[], userSkills: string[], skill: string): number {
  return jobs.reduce((count, job) => {
    if (!job.required_skills.includes(skill)) return count;

    const otherRequired = job.required_skills.filter(requiredSkill => requiredSkill !== skill);
    const matchedOtherRequired = otherRequired.filter(requiredSkill => userSkills.includes(requiredSkill)).length;
    const dependencyCoverage = otherRequired.length === 0
      ? 1
      : matchedOtherRequired / otherRequired.length;

    return dependencyCoverage >= 0.5 ? count + 1 : count;
  }, 0);
}

export function buildSkillGraphSignals(userSkills: string[], skill: string, jobs: JobRow[]): SkillGraphSignals {
  const userSet = new Set(userSkills);
  const missingPrerequisites = getMissingPrerequisites(skill, userSkills);
  const adjacentSkills = getAdjacentSkills(skill).filter(adjacent => !userSet.has(adjacent)).slice(0, 4);

  const unlockedSkills = Object.entries(prerequisiteMap)
    .filter(([candidateSkill, prerequisites]) => {
      if (candidateSkill === skill || userSet.has(candidateSkill)) return false;
      if (!prerequisites.includes(skill)) return false;

      return prerequisites.every(prerequisite => prerequisite === skill || userSet.has(prerequisite));
    })
    .map(([candidateSkill]) => candidateSkill)
    .slice(0, 4);

  const roleClusters = getRoleClustersForSkill(skill);
  const roleDependencyCoverage = countRoleDependencyCoverage(jobs, userSkills, skill);

  const dependencyScore =
    unlockedSkills.length * 6 +
    roleClusters.length * 4 +
    roleDependencyCoverage * 3 +
    adjacentSkills.length * 2 -
    missingPrerequisites.length * 5;

  return {
    missingPrerequisites,
    unlockedSkills,
    adjacentSkills,
    roleClusters,
    dependencyScore,
  };
}
