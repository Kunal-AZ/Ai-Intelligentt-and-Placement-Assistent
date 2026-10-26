import { analyzeSkillGap, type SkillSignal } from './skill-gap.agent.js';

type SkillGapAnalysis = NonNullable<ReturnType<typeof analyzeSkillGap>>;

export function generateCareerPaths(targetRoles: string[], skillSignals: SkillSignal[]) {
  return targetRoles
    .map((targetRole) => analyzeSkillGap(targetRole, skillSignals))
    .filter((analysis): analysis is SkillGapAnalysis => analysis !== undefined)
    .map((analysis) => ({
      role: analysis.role,
      evidence: [
        { source: 'CAREER_INTEREST', detail: `The student selected ${analysis.role} as a target role.` },
        ...analysis.requirements
          .filter((requirement) => requirement.status !== 'MISSING')
          .map((requirement) => ({ source: 'SKILL_EVIDENCE', detail: `${requirement.skill} has recorded student evidence.` })),
      ],
      missingSkills: analysis.requirements.filter((requirement) => requirement.status === 'MISSING').map((requirement) => requirement.skill),
      methodology: analysis.methodology,
    }));
