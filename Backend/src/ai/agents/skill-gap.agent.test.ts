import { describe, expect, it } from 'vitest';
import { analyzeSkillGap } from './skill-gap.agent.js';

describe('skill gap evidence lifecycle', () => {
  it('treats a retained skill identity with deleted evidence as missing', () => {
    const result = analyzeSkillGap('Backend Developer', [{ canonicalName: 'node.js', displayName: 'Node.js', evidence: [] }]);
    expect(result).toBeDefined();
    expect(result!.methodology.evidencedSkillCount).toBe(0);
    expect(result!.requirements.every(item => item.status === 'MISSING')).toBe(true);
  });
});
