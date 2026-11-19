import { Router } from 'express';
import { analyzeJobMatch } from '../../ai/agents/job-match.agent.js';
import { AppError } from '../../utils/app-error.js';
import { requireAuthentication, requireRole } from '../auth/auth.middleware.js';
import { ResumeAnalysis } from '../resume/resume-analysis.model.js';
import { requireResumeAnalysis } from '../resume/resume-readiness.js';
import { getSkillSignals } from '../skills/skill.service.js';
import { Company } from './company.model.js';
import { Job } from './job.model.js';
import { JobMatch } from './job-match.model.js';
import { createCompanySchema, createJobSchema, liveJobsQuerySchema, matchJobSchema } from './job.schemas.js';
import { getLiveJobs } from './live-job.service.js';

export const jobRouter = Router();
jobRouter.use(requireAuthentication);
jobRouter.get('/live', async (request, response, next) => {
  try {
    const input = liveJobsQuerySchema.parse(request.query);
    const [live, analysis, signals] = await Promise.all([
      getLiveJobs(input.query, input.country),
      ResumeAnalysis.findOne({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean(),
      getSkillSignals(request.auth!.userId),
    ]);
    response.status(200).json({ success: true, data: {
      ...live,
      jobs: live.jobs.map((job) => ({ ...job, matchPreview: analyzeJobMatch(job, signals, analysis?.analysis.skills ?? []) })),
    } });
  } catch (error) { next(error); }
});
jobRouter.get('/', async (request, response, next) => {
  try {
    const [jobs, analysis, signals] = await Promise.all([
      Job.find({ isActive: true }).sort({ createdAt: -1 }).populate('companyId', 'name website industry').lean(),
      ResumeAnalysis.findOne({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean(),
      getSkillSignals(request.auth!.userId),
    ]);
    // Previews let the openings list be ranked from the candidate's current
    // profile/resume evidence without requiring a separate click per job.
    const jobsWithPreviews = jobs.map((job) => ({
      ...job,
      matchPreview: analyzeJobMatch(job, signals, analysis?.analysis.skills ?? []),
    })).sort((left, right) => {
      const leftCoverage = left.matchPreview.requiredSkillCoverage;
      const rightCoverage = right.matchPreview.requiredSkillCoverage;
      return (rightCoverage.required ? rightCoverage.evidenced / rightCoverage.required : 1) - (leftCoverage.required ? leftCoverage.evidenced / leftCoverage.required : 1);
    });
    response.status(200).json({ success: true, data: { jobs: jobsWithPreviews } });
  } catch (error) { next(error); }
});
jobRouter.post('/companies', requireRole('ADMIN'), async (request, response, next) => { try { response.status(201).json({ success: true, data: { company: await Company.create(createCompanySchema.parse(request.body)) } }); } catch (error) { next(error); } });
jobRouter.post('/', requireRole('ADMIN'), async (request, response, next) => { try { const input = createJobSchema.parse(request.body); const company = await Company.exists({ _id: input.companyId }); if (!company) throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company was not found.'); response.status(201).json({ success: true, data: { job: await Job.create({ ...input, createdBy: request.auth!.userId }) } }); } catch (error) { next(error); } });
jobRouter.post('/match', async (request, response, next) => {
  try {
    await requireResumeAnalysis(request.auth!.userId);
    const { jobId } = matchJobSchema.parse(request.body); const job = await Job.findOne({ _id: jobId, isActive: true }).lean();
    if (!job) throw new AppError(404, 'JOB_NOT_FOUND', 'Active job was not found.');
    const analysis = await ResumeAnalysis.findOne({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).lean();
    const match = analyzeJobMatch(job, await getSkillSignals(request.auth!.userId), analysis?.analysis.skills ?? []);
    const stored = await JobMatch.findOneAndUpdate({ userId: request.auth!.userId, jobId: job._id }, { $set: match }, { new: true, upsert: true, runValidators: true });
    response.status(200).json({ success: true, data: { jobId: job._id, match: stored, methodology: 'Counts required and preferred skills with recorded evidence; this is not an employment prediction.' } });
  } catch (error) { next(error); }
});
jobRouter.get('/matches', async (request, response, next) => { try { await requireResumeAnalysis(request.auth!.userId); response.status(200).json({ success: true, data: { matches: await JobMatch.find({ userId: request.auth!.userId }).sort({ updatedAt: -1 }).populate('jobId', 'title companyId').lean() } }); } catch (error) { next(error); } });
