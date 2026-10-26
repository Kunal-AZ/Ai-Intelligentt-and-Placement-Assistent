import { Router } from 'express';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { SkillEvidence } from './skill-evidence.model.js';
import { updateSkillsSchema } from './skill.schemas.js';
import { saveDeclaredSkills } from './skill.service.js';
import { Skill } from './skill.model.js';

export const skillRouter = Router();
skillRouter.use(requireAuthentication);

skillRouter.get('/', async (request, response, next) => {
  try {
    const [skills, evidence] = await Promise.all([Skill.find({ userId: request.auth!.userId }).lean(), SkillEvidence.find({ userId: request.auth!.userId }).lean()]);
    response.status(200).json({ success: true, data: { skills, evidence } });
  } catch (error) { next(error); }
});

skillRouter.put('/', async (request, response, next) => {
  try {
    const input = updateSkillsSchema.parse(request.body);
    const skills = await saveDeclaredSkills(request.auth!.userId, input.skills);
    response.status(200).json({ success: true, data: { skills } });
  } catch (error) { next(error); }
});

