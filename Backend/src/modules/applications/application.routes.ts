import { Router } from 'express';
import { requireAuthentication } from '../auth/auth.middleware.js';
import { AppError } from '../../utils/app-error.js';
import { Application } from './application.model.js';
import { applicationIdSchema, createApplicationSchema, updateApplicationSchema } from './application.schemas.js';

export const applicationRouter = Router();
applicationRouter.use(requireAuthentication);

applicationRouter.get('/', async (request, response, next) => { try {
  const applications = await Application.find({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean();
  response.status(200).json({ success: true, data: { applications } });
} catch (error) { next(error); } });

applicationRouter.post('/', async (request, response, next) => { try {
  const input = createApplicationSchema.parse(request.body);
  const application = await Application.create({ userId: request.auth!.userId, ...input, appliedAt: input.appliedAt ?? (input.status === 'APPLIED' ? new Date() : undefined) });
  response.status(201).json({ success: true, data: { application } });
} catch (error) { next(error); } });

applicationRouter.patch('/:id', async (request, response, next) => { try {
  const id = applicationIdSchema.parse(request.params.id); const input = updateApplicationSchema.parse(request.body);
  const application = await Application.findOneAndUpdate({ _id: id, userId: request.auth!.userId }, { $set: { ...input, ...(input.status === 'APPLIED' && !input.appliedAt ? { appliedAt: new Date() } : {}) } }, { new: true, runValidators: true }).lean();
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application was not found.');
  response.status(200).json({ success: true, data: { application } });
} catch (error) { next(error); } });

applicationRouter.delete('/:id', async (request, response, next) => { try {
  const id = applicationIdSchema.parse(request.params.id);
  const application = await Application.findOneAndDelete({ _id: id, userId: request.auth!.userId }).lean();
  if (!application) throw new AppError(404, 'APPLICATION_NOT_FOUND', 'Application was not found.');
  response.status(204).send();
} catch (error) { next(error); } });
