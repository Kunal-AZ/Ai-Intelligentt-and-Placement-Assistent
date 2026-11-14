import { AppError } from '../../utils/app-error.js';
import { Resume } from './resume.model.js';

/** Further recommendations are meaningful only after the candidate's resume
 * has been analysed and its claimed skills have been added to their evidence. */
export async function requireResumeAnalysis(userId: string): Promise<void> {
  const analysis = await Resume.exists({ userId, analysisStatus: 'READY' });
  if (!analysis) {
    throw new AppError(409, 'RESUME_ANALYSIS_REQUIRED', 'Complete resume analysis before requesting personalised recommendations.');
  }
}
