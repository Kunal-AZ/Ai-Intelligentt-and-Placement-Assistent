import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const maximumExtractedCharacters = 100000;

function normalizeText(value: string): string {
  return value
    .replaceAll('\0', '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maximumExtractedCharacters);
}

export async function extractResumeText(mimeType: string, buffer: Buffer): Promise<string> {
  if (mimeType === 'application/pdf') {
    // PDF.js expects Uint8Array.slice() to copy bytes. Node Buffer.slice()
    // returns a view instead, corrupting xref parsing in the bundled parser.
    // pdf-parse accepts typed arrays at runtime, but its older typings only
    // declare Buffer as input.
    const parsed = await pdfParse(new Uint8Array(buffer) as Buffer);
    return normalizeText(parsed.text);
  }
  const extracted = await mammoth.extractRawText({ buffer });
  return normalizeText(extracted.value);
}
