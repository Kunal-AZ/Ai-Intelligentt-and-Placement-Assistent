import path from 'node:path';
import { AppError } from '../../utils/app-error.js';

export type ValidatedResumeFile = {
  mimeType: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  extension: 'pdf' | 'docx';
  originalFileName: string;
};

const pdfMagic = Buffer.from('%PDF-');
const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

function safeFileName(fileName: string): string {
  const baseName = path.basename(fileName).replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_').trim();
  return baseName.slice(0, 180) || 'resume';
}

export function validateResumeFile(file: Express.Multer.File | undefined): ValidatedResumeFile {
  if (!file) throw new AppError(400, 'RESUME_FILE_REQUIRED', 'Upload a resume PDF or DOCX file.');
  if (file.size === 0) throw new AppError(400, 'EMPTY_RESUME_FILE', 'The uploaded file is empty.');
  const declaredExtension = path.extname(file.originalname).toLowerCase();
  const isPdf = file.buffer.subarray(0, pdfMagic.length).equals(pdfMagic);
  const isDocx = file.buffer.subarray(0, zipMagic.length).equals(zipMagic);

  if (isPdf && declaredExtension === '.pdf') {
    return { mimeType: 'application/pdf', extension: 'pdf', originalFileName: safeFileName(file.originalname) };
  }
  if (isDocx && declaredExtension === '.docx') {
    return { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx', originalFileName: safeFileName(file.originalname) };
  }
  throw new AppError(415, 'UNSUPPORTED_RESUME_FILE', 'Only valid PDF and DOCX resume files are supported.');
}
