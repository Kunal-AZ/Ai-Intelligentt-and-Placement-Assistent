import { describe, expect, it } from 'vitest';
import { AppError } from '../../utils/app-error.js';
import { validateResumeFile } from './resume.validation.js';

describe('validateResumeFile', () => {
  it('throws when file is missing', () => {
    expect(() => validateResumeFile(undefined)).toThrow(AppError);
    try {
      validateResumeFile(undefined);
    } catch (error) {
      expect((error as AppError).code).toBe('RESUME_FILE_REQUIRED');
      expect((error as AppError).statusCode).toBe(400);
    }
  });

  it('throws when file is empty', () => {
    const file = {
      buffer: Buffer.alloc(0),
      size: 0,
      originalname: 'resume.pdf',
    } as Express.Multer.File;

    expect(() => validateResumeFile(file)).toThrow(AppError);
    try {
      validateResumeFile(file);
    } catch (error) {
      expect((error as AppError).code).toBe('EMPTY_RESUME_FILE');
    }
  });

  it('accepts valid PDF with proper magic bytes', () => {
    const file = {
      buffer: Buffer.from('%PDF-1.7 valid content'),
      size: 22,
      originalname: 'john_doe_resume.pdf',
    } as Express.Multer.File;

    const result = validateResumeFile(file);
    expect(result.extension).toBe('pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.originalFileName).toBe('john_doe_resume.pdf');
  });

  it('accepts a DOCX archive containing required Office document entries', () => {
    const file = {
      buffer: Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), Buffer.from('[Content_Types].xml word/document.xml')]),
      size: 42,
      originalname: 'resume.docx',
    } as Express.Multer.File;

    const result = validateResumeFile(file);
    expect(result.extension).toBe('docx');
    expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(result.originalFileName).toBe('resume.docx');
  });

  it('rejects a generic ZIP renamed as DOCX', () => {
    const file = { buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), size: 6, originalname: 'archive.docx' } as Express.Multer.File;
    expect(() => validateResumeFile(file)).toThrow(AppError);
  });

  it('rejects spoofed file extensions', () => {
    const file = {
      buffer: Buffer.from('plain text pretending to be pdf'),
      size: 32,
      originalname: 'fake.pdf',
    } as Express.Multer.File;

    expect(() => validateResumeFile(file)).toThrow(AppError);
    try {
      validateResumeFile(file);
    } catch (error) {
      expect((error as AppError).code).toBe('UNSUPPORTED_RESUME_FILE');
      expect((error as AppError).statusCode).toBe(415);
    }
  });
});

