import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { extractResumeText } from './resume-extractor.js';

describe('PDF resume extraction', () => {
  it('extracts a valid PDF from a Node Buffer without corrupting cross-reference offsets', async () => {
    const file = await readFile(new URL('../../../scripts/fixtures/diagnostic-resume.pdf', import.meta.url));
    const original = Buffer.from(file);
    const text = await extractResumeText('application/pdf', file);
    expect(text).toContain('Diagnostic Student - Synthetic test resume');
    expect(text).toContain('Skills: Python, SQL');
    expect(file.equals(original)).toBe(true);
  });
});
