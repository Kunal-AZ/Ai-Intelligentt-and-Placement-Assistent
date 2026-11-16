export interface RoleRequirement {
  skill: string;
  category: 'FOUNDATIONAL' | 'CORE';
}

export interface RoleProfile {
  role: string;
  requirements: RoleRequirement[];
}

export const roleProfiles: RoleProfile[] = [
  { role: 'Software Engineer', requirements: [
    { skill: 'JavaScript', category: 'FOUNDATIONAL' }, { skill: 'TypeScript', category: 'CORE' },
    { skill: 'Data Structures', category: 'CORE' }, { skill: 'Algorithms', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' }, { skill: 'REST APIs', category: 'CORE' },
    { skill: 'Testing', category: 'CORE' }, { skill: 'Cloud Deployment', category: 'CORE' },
  ] },
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
  { role: 'Full-Stack Developer', requirements: [
    { skill: 'JavaScript', category: 'FOUNDATIONAL' },
    { skill: 'React', category: 'CORE' },
    { skill: 'Node.js', category: 'CORE' },
    { skill: 'SQL', category: 'CORE' },
    { skill: 'REST APIs', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'Mobile Developer', requirements: [
    { skill: 'JavaScript', category: 'FOUNDATIONAL' },
    { skill: 'React Native', category: 'CORE' },
    { skill: 'Mobile UI', category: 'CORE' },
    { skill: 'REST APIs', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'DevOps Engineer', requirements: [
    { skill: 'Linux', category: 'FOUNDATIONAL' },
    { skill: 'Docker', category: 'CORE' },
    { skill: 'CI/CD', category: 'CORE' },
    { skill: 'Cloud Deployment', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'Cybersecurity Analyst', requirements: [
    { skill: 'Networking', category: 'FOUNDATIONAL' },
    { skill: 'Linux', category: 'FOUNDATIONAL' },
    { skill: 'Security Fundamentals', category: 'CORE' },
    { skill: 'Python', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
  { role: 'Data Scientist', requirements: [
    { skill: 'Python', category: 'FOUNDATIONAL' },
    { skill: 'SQL', category: 'CORE' },
    { skill: 'Statistics', category: 'CORE' },
    { skill: 'Machine Learning', category: 'CORE' },
    { skill: 'Data Visualization', category: 'CORE' },
  ] },
  { role: 'AI Engineer', requirements: [
    { skill: 'Python', category: 'FOUNDATIONAL' },
    { skill: 'Machine Learning', category: 'CORE' },
    { skill: 'LLMs', category: 'CORE' },
    { skill: 'REST APIs', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' },
  ] },
];

export function getRoleProfile(role: string): RoleProfile | undefined {
  const selected = roleProfiles.find((profile) => profile.role.toLocaleLowerCase() === role.trim().toLocaleLowerCase());
  // The platform accepts the broader technology-role catalog. These baseline
  // requirements keep gap analysis useful even before a specialist catalog is added.
  return selected ?? { role: role.trim(), requirements: [
    { skill: 'Data Structures', category: 'CORE' }, { skill: 'Algorithms', category: 'CORE' },
    { skill: 'Git', category: 'FOUNDATIONAL' }, { skill: 'Testing', category: 'CORE' },
    { skill: 'Communication', category: 'FOUNDATIONAL' },
  ] };
}
