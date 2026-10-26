import { Router } from 'express';
import { generateCareerPaths } from '../../ai/agents/career.agent.js';
import { getRoleProfile } from '../../ai/role-profiles.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Profile } from '../profile/profile.model.js';
import { getSkillSignals } from '../skills/skill.service.js';
import { Recommendation } from './recommendation.model.js';

export const recommendationRouter = Router();
recommendationRouter.use(requireAuthentication);

recommendationRouter.get('/careers', async (request, response, next) => {
  try {
    const recommendations = await Recommendation.find({ userId: request.auth!.userId, type: 'CAREER_PATH', status: 'ACTIVE' })
      .sort({ generatedAt: -1 })
      .lean();
    response.status(200).json({ success: true, data: { recommendations } });
  } catch (error) { next(error); }
});

recommendationRouter.post('/careers/analyze', async (request, response, next) => {
  try {
    const profile = await Profile.findOne({ userId: request.auth!.userId }).lean();
    const careerPaths = generateCareerPaths(profile?.targetRoles ?? [], await getSkillSignals(request.auth!.userId));
    const generatedAt = new Date();
    const recommendations = await Promise.all(careerPaths.map(async (careerPath) => Recommendation.findOneAndUpdate(
      { userId: request.auth!.userId, type: 'CAREER_PATH', role: careerPath.role },
      { $set: { evidence: careerPath.evidence, missingSkills: careerPath.missingSkills, status: 'ACTIVE', generatedAt } },
      { new: true, upsert: true, runValidators: true },
    )));
    response.status(200).json({ success: true, data: { recommendations, unsupportedTargetRoles: (profile?.targetRoles ?? []).filter((role) => !getRoleProfile(role)) } });
  } catch (error) { next(error); }
});
