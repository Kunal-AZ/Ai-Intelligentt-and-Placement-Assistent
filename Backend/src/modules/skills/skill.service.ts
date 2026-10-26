import { SkillEvidence } from './skill-evidence.model.js';
import { Skill } from './skill.model.js';
import type { SkillSignal } from '../../ai/agents/skill-gap.agent.js';

export const canonicalSkillName = (name: string) => name.trim().toLocaleLowerCase();

export async function getSkillSignals(userId: string): Promise<SkillSignal[]> {
  const [skills, evidence] = await Promise.all([
    Skill.find({ userId }).lean(),
    SkillEvidence.find({ userId }).lean(),
  ]);
  const evidenceBySkill = new Map<string, Array<{ source: string; proficiency?: string }>>();
  for (const item of evidence) {
    const key = item.skillId.toString();
    const items = evidenceBySkill.get(key) ?? [];
    items.push({ source: item.source, proficiency: item.proficiency });
    evidenceBySkill.set(key, items);
  }
  return skills.map((skill) => ({
    canonicalName: skill.canonicalName,
    displayName: skill.displayName,
    evidence: evidenceBySkill.get(skill._id.toString()) ?? [],
  }));
}

export async function saveDeclaredSkills(
  userId: string,
  skills: Array<{ name: string; proficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; summary?: string }>,
) {
  const saved = [];
  for (const entry of skills) {
    const canonicalName = canonicalSkillName(entry.name);
    const skill = await Skill.findOneAndUpdate(
      { userId, canonicalName },
      { $setOnInsert: { userId, canonicalName }, $set: { displayName: entry.name.trim() } },
      { new: true, upsert: true, runValidators: true },
    );
    await SkillEvidence.findOneAndUpdate(
      { userId, skillId: skill._id, source: 'USER_DECLARED', sourceRef: 'self' },
      { $set: { proficiency: entry.proficiency, summary: entry.summary } },
      { new: true, upsert: true, runValidators: true },
    );
    saved.push(skill);
  }
  return saved;
}
