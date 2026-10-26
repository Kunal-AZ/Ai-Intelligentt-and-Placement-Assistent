import type { SkillSignal } from './skill-gap.agent.js';
const canonical = (value: string) => value.trim().toLocaleLowerCase();
export function analyzeJobMatch(job: { requiredSkills: string[]; preferredSkills: string[] }, skillSignals: SkillSignal[], resumeSkills: string[]) {
  const evidenceBySkill = new Map(skillSignals.map((skill) => [skill.canonicalName, skill.evidence.map((item) => item.source)]));
  for (const skill of resumeSkills) { const key = canonical(skill); evidenceBySkill.set(key, [...new Set([...(evidenceBySkill.get(key) ?? []), 'RESUME_ANALYSIS'])]); }
  const assess = (skills: string[]) => skills.map((skill) => ({ skill, evidenceSources: evidenceBySkill.get(canonical(skill)) ?? [] }));
  const required = assess(job.requiredSkills); const preferred = assess(job.preferredSkills);
  const missingRequirements = required.filter((item) => !item.evidenceSources.length).map((item) => item.skill);
  const missingPreferred = preferred.filter((item) => !item.evidenceSources.length).map((item) => item.skill);
  return { requiredSkillCoverage: { required: required.length, evidenced: required.filter((item) => item.evidenceSources.length).length }, preferredSkillCoverage: { preferred: preferred.length, evidenced: preferred.filter((item) => item.evidenceSources.length).length }, existingRequirements: [...required, ...preferred].filter((item) => item.evidenceSources.length), missingRequirements, preparationRecommendations: [...missingRequirements.map((skill) => `Build verifiable evidence for required skill: ${skill}.`), ...missingPreferred.map((skill) => `If time permits, build evidence for preferred skill: ${skill}.`)] };
}
