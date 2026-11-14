import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
const retryableStatusCodes = new Set([429, 500, 502, 503, 504]);
const wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export async function generateGeminiJson(systemInstruction: string, prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini is not configured.');
  for (let attempt = 0; attempt < 3; attempt += 1) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  });
  const body = await response.json().catch(() => undefined) as GeminiResponse | { error?: { message?: string } } | undefined;
  if (!response.ok) {
    if (retryableStatusCodes.has(response.status) && attempt < 2) { await wait(400 * (attempt + 1)); continue; }
    if (retryableStatusCodes.has(response.status)) throw new AppError(502, 'GEMINI_TEMPORARILY_UNAVAILABLE', 'The AI provider is temporarily busy. Please try again in a moment.');
    throw new AppError(502, 'GEMINI_PROVIDER_FAILED', typeof body === 'object' && body && 'error' in body ? body.error?.message ?? 'Gemini did not return a usable response.' : 'Gemini did not return a usable response.');
  }
  const text = (body as GeminiResponse | undefined)?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
  if (!text) throw new AppError(502, 'GEMINI_PROVIDER_FAILED', 'Gemini returned an empty response.');
  return text;
  }
  throw new AppError(503, 'GEMINI_TEMPORARILY_UNAVAILABLE', 'The AI provider is temporarily unavailable. Please try again in a moment.');
}
