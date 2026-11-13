import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

export async function generateGeminiJson(systemInstruction: string, prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini is not configured.');
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
  if (!response.ok) throw new AppError(502, 'GEMINI_PROVIDER_FAILED', typeof body === 'object' && body && 'error' in body ? body.error?.message ?? 'Gemini did not return a usable response.' : 'Gemini did not return a usable response.');
  const text = (body as GeminiResponse | undefined)?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('');
  if (!text) throw new AppError(502, 'GEMINI_PROVIDER_FAILED', 'Gemini returned an empty response.');
  return text;
}
