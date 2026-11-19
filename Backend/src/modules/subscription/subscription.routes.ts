import { Router } from 'express';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { User } from '../auth/user.model.js';
import { AppError } from '../../utils/app-error.js';

const plans = {
  FREE: { name: 'Free', features: ['One resume analysis', 'Basic job matching', 'Text mock interviews', 'Application tracker'] },
  PLUS: { name: 'Plus', features: ['Everything in Free', 'Unlimited resume analyses', 'Voice mock interviews', 'Personalized roadmaps', 'Advanced job gap insights'] },
  PRO: { name: 'Pro', features: ['Everything in Plus', 'Priority AI processing', 'Full interview analytics', 'Premium career coaching', 'Early access to new tools'] },
} as const;

export const subscriptionRouter = Router();
subscriptionRouter.use(requireAuthentication);
subscriptionRouter.get('/', async (request, response, next) => { try {
  const user = await User.findById(request.auth!.userId).select('plan').lean();
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
  const plan = user.plan ?? 'FREE';
  response.status(200).json({ success: true, data: { currentPlan: plan, plans } });
} catch (error) { next(error); } });
