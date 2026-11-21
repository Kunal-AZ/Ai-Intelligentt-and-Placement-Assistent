import { Router } from 'express';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { Profile } from './profile.model.js';
import { User } from '../auth/user.model.js';
import { updateProfileSchema } from './profile.schemas.js';
import { findUniversity, searchUniversities, universityCountries } from './university-catalog.js';

export const profileRouter = Router();
profileRouter.use(requireAuthentication);
// Do not expose metadata from the retired document-review flow on older records.
const studentProfileProjection = '-academicRevision -academicStatus -academicFileKey -academicFileName -academicSubmittedAt -academicReviewedAt -academicReviewedBy -academicReviewNote';

profileRouter.get('/universities', (request, response) => {
  const country = typeof request.query.country === 'string' ? request.query.country : '';
  const query = typeof request.query.q === 'string' ? request.query.q.slice(0, 160) : '';
  response.json({ success: true, data: { countries: universityCountries, universities: searchUniversities(country, query) } });
});

profileRouter.get('/', async (request, response, next) => {
  try {
    const profile = await Profile.findOne({ userId: request.auth!.userId }).select(studentProfileProjection).lean();
    if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile was not found.');
    const user = await User.findById(request.auth!.userId).select('email').lean();
    response.status(200).json({ success: true, data: { profile: { ...profile, email: user?.email } } });
  } catch (error) { next(error); }
});

profileRouter.put('/', async (request, response, next) => {
  try {
    const updates = updateProfileSchema.parse(request.body);
    const university = updates.universityId ? findUniversity(updates.universityId) : undefined;
    const canonical = { ...updates, ...(university ? { college: university.name, universityCountry: university.country } : {}) };
    const customInstitution = !university && (updates.college !== undefined || updates.universityCountry !== undefined);
    const profile = await Profile.findOneAndUpdate(
      { userId: request.auth!.userId },
      { $set: canonical, ...(customInstitution ? { $unset: { universityId: 1, ...(updates.universityCountry === undefined ? { universityCountry: 1 } : {}) } } : {}) },
      { new: true, runValidators: true },
    ).select(studentProfileProjection).lean();
    if (!profile) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile was not found.');
    response.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
});
