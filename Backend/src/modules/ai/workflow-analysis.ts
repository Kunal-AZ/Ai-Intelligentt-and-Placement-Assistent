import { z } from 'zod';
import { resumeAnalysisSchema } from '@placement-assistant/validation';

const textList = z.array(z.string()).default([]);
export const workflowResultSchema = z.object({
  workflow_status: z.enum(['completed', 'completed_with_warnings']),
  final_report: z.object({
    resume_analysis: z.object({
      summary: z.string().trim().min(1),
      extracted_skills: z.array(z.string().trim().min(1).max(100)).max(60),
      strengths: textList,
      improvement_areas: textList,
      roadmap: z.array(z.object({ topic: z.string(), description: z.string() })).default([]),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

export function toStoredResumeAnalysis(result: z.infer<typeof workflowResultSchema>) {
  const resume = result.final_report.resume_analysis;
  return resumeAnalysisSchema.parse({
    skills: resume.extracted_skills,
    // This workflow does not extract these fields. Empty means unknown, not
    // that the candidate has no education/projects/employment history.
    education: [], projects: [], experience: [], certifications: [], atsIssues: [],
    strengths: resume.strengths.slice(0, 20).map(text => text.slice(0, 500)),
    weaknesses: resume.improvement_areas.slice(0, 20).map(issue => ({ issue: issue.slice(0, 500) })),
    missingInformation: ['Education, employment, project, certification and ATS details were not extracted by this workflow.'],
    recommendations: resume.roadmap.slice(0, 20).map(step => ({ priority: 'MEDIUM', recommendation: step.topic.slice(0, 500), rationale: step.description.slice(0, 500) })),
  });
}
