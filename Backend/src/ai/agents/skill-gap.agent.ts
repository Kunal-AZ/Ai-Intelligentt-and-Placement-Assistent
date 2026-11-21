import { getRoleProfile } from '../role-profiles.js';

export type SkillSignal = {
  canonicalName: string;
  displayName: string;
  evidence: Array<{ source: string; proficiency?: string }>;
};

const canonical = (value: string) => value.trim().toLocaleLowerCase();

export function analyzeSkillGap(role: string, skillSignals: SkillSignal[]) {
  const roleProfile = getRoleProfile(role);
  if (!roleProfile) return undefined;

  const byName = new Map(skillSignals.map((skill) => [skill.canonicalName, skill]));
  const requirements = roleProfile.requirements.map((requirement, index) => {
    const candidate = byName.get(canonical(requirement.skill));
    const skill = candidate?.evidence.length ? candidate : undefined;
    const onlyBeginnerSelfReport = skill?.evidence.length === 1 && skill.evidence[0].source === 'USER_DECLARED' && skill.evidence[0].proficiency === 'BEGINNER';
    return {
      skill: requirement.skill,
      category: requirement.category,
      status: skill ? (onlyBeginnerSelfReport ? 'NEEDS_REINFORCEMENT' : 'PRESENT') : 'MISSING',
      evidenceSources: skill ? [...new Set(skill.evidence.map((item) => item.source))] : [],
      learningPriority: skill ? undefined : { tier: requirement.category === 'CORE' ? 'HIGH' : 'MEDIUM', order: index + 1 },
    };
  });

  return {
    role: roleProfile.role,
    methodology: {
      type: 'EVIDENCE_COVERAGE',
      description: 'A requirement is present only when the student has recorded evidence for that skill. Beginner-only self-reports are flagged for reinforcement. No employment probability or arbitrary percentage is generated.',
      requiredSkillCount: requirements.length,
      evidencedSkillCount: requirements.filter((item) => item.status !== 'MISSING').length,
    },
    requirements,
  };
}
