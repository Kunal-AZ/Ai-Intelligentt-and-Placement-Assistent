import { Router } from 'express';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Profile } from './profile.model.js';
import { User } from '../auth/user.model.js';
import { updateProfileSchema } from './profile.schemas.js';

export const profileRouter = Router();
profileRouter.use(requireAuthentication);

profileRouter.get('/', async (request, response, next) => {
  try {
    const profile = await Profile.findOne({ userId: request.auth!.userId }).lean();
    if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile was not found.');
    const user = await User.findById(request.auth!.userId).select('email').lean();
    response.status(200).json({ success: true, data: { profile: { ...profile, email: user?.email } } });
  } catch (error) { next(error); }
});

profileRouter.put('/', async (request, response, next) => {
  try {
    const updates = updateProfileSchema.parse(request.body);
    const profile = await Profile.findOneAndUpdate(
      { userId: request.auth!.userId },
      { $set: updates },
      { new: true, runValidators: true },
    ).lean();
    if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile was not found.');
    response.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
});
