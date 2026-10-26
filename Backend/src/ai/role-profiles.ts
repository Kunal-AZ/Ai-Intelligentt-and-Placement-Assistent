export interface RoleRequirement {
  skill: string;
  category: 'FOUNDATIONAL' | 'CORE';
}

export interface RoleProfile {
  role: string;
  requirements: RoleRequirement[];
}

export const roleProfiles: RoleProfile[] = [
  { role: 'Backend Developer', requirements: [
    { skill: 'JavaScript', category: 'FOUNDATIONAL' }, { skill: 'TypeScript', category: 'CORE' },
    { skill: 'Node.js', category: 'CORE' }, { skill: 'Express.js', category: 'CORE' },
    { skill: 'SQL', category: 'CORE' }, { skill: 'MongoDB', category: 'CORE' },
    { skill: 'REST APIs', category: 'CORE' }, { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'Frontend Developer', requirements: [
    { skill: 'JavaScript', category: 'FOUNDATIONAL' }, { skill: 'TypeScript', category: 'CORE' },
    { skill: 'React', category: 'CORE' }, { skill: 'HTML', category: 'FOUNDATIONAL' },
    { skill: 'CSS', category: 'FOUNDATIONAL' }, { skill: 'REST APIs', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'Data Analyst', requirements: [
    { skill: 'SQL', category: 'CORE' }, { skill: 'Python', category: 'CORE' },
    { skill: 'Excel', category: 'FOUNDATIONAL' }, { skill: 'Statistics', category: 'CORE' },
    { skill: 'Data Visualization', category: 'CORE' }, { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
];

export function getRoleProfile(role: string): RoleProfile | undefined {
  return roleProfiles.find((profile) => profile.role.toLocaleLowerCase() === role.trim().toLocaleLowerCase());
}
