import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface SkillItem {
  id: string;
  name: string;
  category: 'Backend' | 'Frontend' | 'Database' | 'Systems' | 'DevOps' | 'AI/ML';
  level: 'Resume mention' | 'Foundational' | 'Competent' | 'Advanced' | 'Production';
  evidenceSource: string;
}

interface RoleRequirement {
  roleId: string;
  roleName: string;
  avgLpa: string;
  requiredSkills: { name: string; priority: 'CRITICAL' | 'IMPORTANT'; matched: boolean }[];
}

const ROLES_CATALOG: RoleRequirement[] = [
  {
    roleId: 'Backend Developer',
    roleName: 'Backend Developer',
    avgLpa: 'Role requirements',
    requiredSkills: [
      ...['JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'SQL', 'MongoDB', 'REST APIs', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false })),
    ],
  },
  { roleId: 'Software Engineer', roleName: 'Software Engineer', avgLpa: 'Role requirements', requiredSkills: [...['Data Structures', 'Algorithms', 'Git', 'Testing', 'REST APIs'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'Full-Stack Developer', roleName: 'Full-Stack Developer', avgLpa: 'Role requirements', requiredSkills: [...['JavaScript', 'React', 'Node.js', 'SQL', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'Mobile Developer', roleName: 'Mobile Developer', avgLpa: 'Role requirements', requiredSkills: [...['JavaScript', 'React Native', 'Mobile UI', 'REST APIs', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'DevOps Engineer', roleName: 'DevOps Engineer', avgLpa: 'Role requirements', requiredSkills: [...['Linux', 'Docker', 'CI/CD', 'Cloud Deployment', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'Cybersecurity Analyst', roleName: 'Cybersecurity Analyst', avgLpa: 'Role requirements', requiredSkills: [...['Networking', 'Linux', 'Security Fundamentals', 'Python', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'Data Scientist', roleName: 'Data Scientist', avgLpa: 'Role requirements', requiredSkills: [...['Python', 'SQL', 'Statistics', 'Machine Learning', 'Data Visualization'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  { roleId: 'AI Engineer', roleName: 'AI Engineer', avgLpa: 'Role requirements', requiredSkills: [...['Python', 'Machine Learning', 'LLMs', 'APIs', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
  {
    roleId: 'Frontend Developer', roleName: 'Frontend Developer', avgLpa: 'Role requirements',
    requiredSkills: [
      ...['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'REST APIs', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false })),
    ],
  },
  { roleId: 'Data Analyst', roleName: 'Data Analyst', avgLpa: 'Role requirements', requiredSkills: [...['SQL', 'Python', 'Excel', 'Statistics', 'Data Visualization', 'Git'].map((name) => ({ name, priority: 'CRITICAL' as const, matched: false }))] },
];

export function SkillEvidencePage() {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('Backend Developer');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillItem['category']>('Backend');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillItem['level']>('Advanced');
  const [newSkillEvidence, setNewSkillEvidence] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const result = await api<{ skills: Array<{ _id: string; displayName: string }>; evidence: Array<{ skillId: string; source: string; proficiency?: string; summary?: string }> }>('/skills');
        const evidenceBySkill = new Map(result.evidence.map((item) => [item.skillId, item]));
        setSkills(result.skills.map((skill) => {
          const evidence = evidenceBySkill.get(skill._id);
          const resumeOnly = evidence?.source === 'RESUME' && !evidence.proficiency;
          return { id: skill._id, name: skill.displayName, category: 'Backend', level: resumeOnly ? 'Resume mention' : evidence?.proficiency === 'ADVANCED' ? 'Advanced' : evidence?.proficiency === 'INTERMEDIATE' ? 'Competent' : 'Foundational', evidenceSource: evidence?.summary || evidence?.source || 'Recorded evidence' };
        }));
      } catch {
        setSkills([]);
      }
    }
    load();
  }, []);

  const activeRole = ROLES_CATALOG.find((r) => r.roleId === selectedRole) ?? ROLES_CATALOG[0];
  const normalizedSkills = new Set(skills.map((skill) => skill.name.toLocaleLowerCase().replace(/\./g, '')));
  const requirements = activeRole.requiredSkills.map((requirement) => ({ ...requirement, matched: normalizedSkills.has(requirement.name.toLocaleLowerCase().replace(/\./g, '')) }));
  const matchedCount = requirements.filter((s) => s.matched).length;
  const coveragePct = Math.round((matchedCount / requirements.length) * 100);

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const added: SkillItem = {
      id: crypto.randomUUID(),
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillLevel,
      evidenceSource: newSkillEvidence.trim() || 'Self-verified commit',
    };

    try {
      await api('/skills', { method: 'PUT', body: JSON.stringify({ skills: [{ name: added.name, proficiency: newSkillLevel === 'Advanced' || newSkillLevel === 'Production' ? 'ADVANCED' : newSkillLevel === 'Competent' ? 'INTERMEDIATE' : 'BEGINNER', summary: added.evidenceSource }] }) });
      setSkills([added, ...skills]);
    } catch { return; }
    setNewSkillName('');
    setNewSkillEvidence('');
    setIsAddModalOpen(false);
  }

  function handleDeleteSkill(id: string) {
    setSkills(skills.filter((s) => s.id !== id));
  }

  return (
    <div className="skills-evidence-page flex flex-col gap-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-success">{skills.length} Competencies</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Skill Evidence &amp; Gaps</h1>
        </div>

        <button
          type="button"
          className="btn-primary text-xs py-2 px-3.5"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Skill
        </button>
      </div>

      {/* ── Visual Role Match & Requirements Bar ────────────────── */}
      <div className="card-hero p-6 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-select font-bold text-sm bg-[var(--bg-surface)] py-2 max-w-xs"
            >
              {ROLES_CATALOG.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleName}
                </option>
              ))}
            </select>
            <span className="badge badge-mono text-xs">{activeRole.avgLpa}</span>
          </div>

          {/* Visual Coverage Bar */}
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-500"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
            <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
              {coveragePct}% Match
            </span>
          </div>
        </div>

        {/* Requirements Grid (Visual Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {requirements.map((req) => (
            <div
              key={req.name}
              className={`p-3 rounded-lg border flex items-center justify-between gap-2 text-xs transition-all ${
                req.matched
                  ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)]'
                  : 'bg-[var(--status-warning-bg)] border-[var(--status-warning-border)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={req.matched ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}>
                  {req.matched ? '✓' : '▲'}
                </span>
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[170px]">
                  {req.name}
                </span>
              </div>
              <span className={`badge text-[9px] ${req.matched ? 'badge-success' : 'badge-warning'}`}>
                {req.matched ? 'RECORDED' : 'GAP'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Verified Skills List (Compact & Visual) ─────────────── */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs">
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Evidence Ledger ({skills.length})
          </span>
          <span className="text-[var(--text-muted)] font-mono">Accepted Proof Trails</span>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="py-2.5 flex items-center justify-between gap-3 text-xs group"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[10px]">
                  {skill.category[0]}
                </span>
                <div>
                  <span className="font-bold text-[var(--text-primary)]">{skill.name}</span>
                  <span className="text-[var(--text-muted)] ml-2 font-mono text-[10px]">
                    {skill.evidenceSource}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="badge badge-mono text-[9px]">{skill.level}</span>
                <button
                  type="button"
                  className="btn-ghost text-[10px] text-[var(--status-danger)] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteSkill(skill.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Skill Modal ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Record Skill</h3>
              <button type="button" className="btn-ghost p-1" onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="p-4 flex flex-col gap-3 text-xs">
              <div className="form-group">
                <label className="form-label">Skill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kafka, Docker, GraphQL"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={newSkillCategory}
                    onChange={(e) => setNewSkillCategory(e.target.value as SkillItem['category'])}
                    className="form-select text-xs"
                  >
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Database">Database</option>
                    <option value="Systems">Systems</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Level</label>
                  <select
                    value={newSkillLevel}
                    onChange={(e) => setNewSkillLevel(e.target.value as SkillItem['level'])}
                    className="form-select text-xs"
                  >
                    <option value="Foundational">Foundational</option>
                    <option value="Competent">Competent</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Evidence Source</label>
                <input
                  type="text"
                  placeholder="GitHub repo, commit, project"
                  value={newSkillEvidence}
                  onChange={(e) => setNewSkillEvidence(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  className="btn-secondary text-xs py-1.5"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-1.5">
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
