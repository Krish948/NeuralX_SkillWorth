export interface SkillSalaryMapping {
  skill: string;
  salaryBoost: number; // additional salary per skill
  category: string;
}

export interface RoadmapStep {
  title: string;
  detail: string;
}

export const skillSalaryMap: Record<string, SkillSalaryMapping> = {
  'HTML': { skill: 'HTML', salaryBoost: 5000, category: 'frontend' },
  'CSS': { skill: 'CSS', salaryBoost: 5000, category: 'frontend' },
  'JavaScript': { skill: 'JavaScript', salaryBoost: 12000, category: 'frontend' },
  'TypeScript': { skill: 'TypeScript', salaryBoost: 15000, category: 'frontend' },
  'React': { skill: 'React', salaryBoost: 18000, category: 'frontend' },
  'Vue.js': { skill: 'Vue.js', salaryBoost: 14000, category: 'frontend' },
  'Angular': { skill: 'Angular', salaryBoost: 14000, category: 'frontend' },
  'Next.js': { skill: 'Next.js', salaryBoost: 16000, category: 'frontend' },
  'Node.js': { skill: 'Node.js', salaryBoost: 16000, category: 'backend' },
  'Express.js': { skill: 'Express.js', salaryBoost: 10000, category: 'backend' },
  'Python': { skill: 'Python', salaryBoost: 15000, category: 'backend' },
  'Django': { skill: 'Django', salaryBoost: 12000, category: 'backend' },
  'Java': { skill: 'Java', salaryBoost: 14000, category: 'backend' },
  'Spring Boot': { skill: 'Spring Boot', salaryBoost: 14000, category: 'backend' },
  'Go': { skill: 'Go', salaryBoost: 18000, category: 'backend' },
  'Rust': { skill: 'Rust', salaryBoost: 20000, category: 'backend' },
  'SQL': { skill: 'SQL', salaryBoost: 8000, category: 'database' },
  'PostgreSQL': { skill: 'PostgreSQL', salaryBoost: 10000, category: 'database' },
  'MongoDB': { skill: 'MongoDB', salaryBoost: 9000, category: 'database' },
  'Redis': { skill: 'Redis', salaryBoost: 8000, category: 'database' },
  'Docker': { skill: 'Docker', salaryBoost: 14000, category: 'devops' },
  'Kubernetes': { skill: 'Kubernetes', salaryBoost: 18000, category: 'devops' },
  'AWS': { skill: 'AWS', salaryBoost: 20000, category: 'cloud' },
  'Azure': { skill: 'Azure', salaryBoost: 18000, category: 'cloud' },
  'GCP': { skill: 'GCP', salaryBoost: 18000, category: 'cloud' },
  'Git': { skill: 'Git', salaryBoost: 3000, category: 'tools' },
  'CI/CD': { skill: 'CI/CD', salaryBoost: 12000, category: 'devops' },
  'GraphQL': { skill: 'GraphQL', salaryBoost: 12000, category: 'backend' },
  'REST API': { skill: 'REST API', salaryBoost: 8000, category: 'backend' },
  'Tailwind CSS': { skill: 'Tailwind CSS', salaryBoost: 6000, category: 'frontend' },
  'Figma': { skill: 'Figma', salaryBoost: 5000, category: 'design' },
  'UI/UX Design': { skill: 'UI/UX Design', salaryBoost: 10000, category: 'design' },
  'Machine Learning': { skill: 'Machine Learning', salaryBoost: 25000, category: 'data' },
  'TensorFlow': { skill: 'TensorFlow', salaryBoost: 20000, category: 'data' },
  'Data Analysis': { skill: 'Data Analysis', salaryBoost: 12000, category: 'data' },
  'Power BI': { skill: 'Power BI', salaryBoost: 8000, category: 'data' },
  'Cybersecurity': { skill: 'Cybersecurity', salaryBoost: 18000, category: 'security' },
  'Agile/Scrum': { skill: 'Agile/Scrum', salaryBoost: 6000, category: 'management' },
  'Communication': { skill: 'Communication', salaryBoost: 4000, category: 'soft' },
  'Leadership': { skill: 'Leadership', salaryBoost: 8000, category: 'soft' },
};

export const careerPaths: Record<string, { title: string; steps: string[]; requiredSkills: string[] }> = {
  'Frontend Developer': {
    title: 'Frontend Developer Path',
    steps: ['Learn HTML & CSS', 'Master JavaScript', 'Learn React/Vue', 'Add TypeScript', 'Learn Next.js', 'Senior Frontend Developer'],
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Next.js'],
  },
  'Backend Developer': {
    title: 'Backend Developer Path',
    steps: ['Learn Python or Node.js', 'Master SQL', 'Build REST APIs', 'Learn Docker', 'Add Cloud (AWS)', 'Senior Backend Developer'],
    requiredSkills: ['Node.js', 'SQL', 'REST API', 'Docker', 'AWS'],
  },
  'Full Stack Developer': {
    title: 'Full Stack Developer Path',
    steps: ['Frontend basics', 'JavaScript mastery', 'React + Node.js', 'Database skills', 'DevOps basics', 'Senior Full Stack'],
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'SQL', 'Docker'],
  },
  'Data Scientist': {
    title: 'Data Scientist Path',
    steps: ['Learn Python', 'Statistics & Math', 'Data Analysis', 'Machine Learning', 'Deep Learning', 'Senior Data Scientist'],
    requiredSkills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'TensorFlow'],
  },
  'DevOps Engineer': {
    title: 'DevOps Engineer Path',
    steps: ['Linux basics', 'Learn Git & CI/CD', 'Docker & containers', 'Kubernetes', 'Cloud platforms', 'Senior DevOps'],
    requiredSkills: ['Git', 'CI/CD', 'Docker', 'Kubernetes', 'AWS'],
  },
};

export function calculateSalaryFromSkills(skillNames: string[]): { min: number; max: number; estimated: number } {
  const baseSalary = 35000;
  let totalBoost = 0;
  skillNames.forEach(name => {
    const mapping = skillSalaryMap[name];
    if (mapping) totalBoost += mapping.salaryBoost;
  });
  const estimated = baseSalary + totalBoost;
  return {
    min: Math.round(estimated * 0.8),
    max: Math.round(estimated * 1.2),
    estimated,
  };
}

export function getSkillGaps(userSkills: string[], jobRequiredSkills: string[]): string[] {
  return jobRequiredSkills.filter(s => !userSkills.includes(s));
}

export function getJobMatchScore(userSkills: string[], jobRequiredSkills: string[]): number {
  if (jobRequiredSkills.length === 0) return 0;
  const matched = jobRequiredSkills.filter(s => userSkills.includes(s)).length;
  return Math.round((matched / jobRequiredSkills.length) * 100);
}

type JobLike = {
  role: string;
  required_skills: string[];
};

export function getRecommendedNextSteps(
  userSkills: string[],
  topJobs: JobLike[],
  hasFinancePlan: boolean,
): RoadmapStep[] {
  const steps: RoadmapStep[] = [];
  const primaryJob = topJobs[0];

  if (userSkills.length === 0) {
    const starterSkills = Object.entries(skillSalaryMap)
      .sort((a, b) => b[1].salaryBoost - a[1].salaryBoost)
      .slice(0, 3)
      .map(([name]) => name);

    steps.push({
      title: 'Add your first skills',
      detail: `Start with ${starterSkills.join(', ')} to build a useful baseline profile.`,
    });
    steps.push({
      title: 'Pick a target role',
      detail: 'Review job matches and choose one direction to optimize for.',
    });
    if (!hasFinancePlan) {
      steps.push({
        title: 'Create a financial baseline',
        detail: 'Add income, expenses, and a savings goal so progress is measurable.',
      });
    }
    return steps;
  }

  if (primaryJob) {
    const missingSkills = getSkillGaps(userSkills, primaryJob.required_skills).slice(0, 3);
    if (missingSkills.length > 0) {
      steps.push({
        title: `Close ${primaryJob.role} gaps`,
        detail: `Focus on ${missingSkills.join(', ')} to raise your match score.`,
      });
    } else {
      steps.push({
        title: `You are aligned for ${primaryJob.role}`,
        detail: 'Keep sharpening complementary skills and apply with confidence.',
      });
    }
  }

  const strongestMissingSkill = Object.entries(skillSalaryMap)
    .filter(([name]) => !userSkills.includes(name))
    .sort((a, b) => b[1].salaryBoost - a[1].salaryBoost)[0]?.[0];

  if (strongestMissingSkill) {
    steps.push({
      title: 'Add a high-value skill',
      detail: `Learning ${strongestMissingSkill} could increase salary estimates and job matches.`,
    });
  }

  if (!hasFinancePlan) {
    steps.push({
      title: 'Set a budget plan',
      detail: 'Track income, expenses, and a savings target to connect career growth to money goals.',
    });
  }

  if (steps.length === 0) {
    steps.push({
      title: 'Keep building momentum',
      detail: 'Add more skills and revisit recommendations as your profile changes.',
    });
  }

  return steps.slice(0, 3);
}
