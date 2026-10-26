import { Router } from 'express';
import { analyzeSkillGap } from '../../ai/agents/skill-gap.agent.js';
import { getRoleProfile } from '../../ai/role-profiles.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Profile } from '../profile/profile.model.js';
import { getSkillSignals } from './skill.service.js';

export const skillGapRouter = Router();
skillGapRouter.use(requireAuthentication);

skillGapRouter.get('/', async (request, response, next) => {
  try {
    const requestedRole = typeof request.query.role === 'string' ? request.query.role : undefined;
    const profile = requestedRole ? undefined : await Profile.findOne({ userId: request.auth!.userId }).lean();
    const roles = requestedRole ? [requestedRole] : profile?.targetRoles ?? [];
    if (!roles.length) throw new AppError(400, 'TARGET_ROLE_REQUIRED', 'Select a target role in your profile or provide a role query parameter.');
    const signals = await getSkillSignals(request.auth!.userId);
    const gaps = roles.map((role) => analyzeSkillGap(role, signals)).filter(Boolean);
    if (!gaps.length && requestedRole && !getRoleProfile(requestedRole)) throw new AppError(404, 'ROLE_NOT_SUPPORTED', 'This role is not yet supported by the transparent requirement catalog.');
    response.status(200).json({ success: true, data: { gaps } });
  } catch (error) { next(error); }
});
