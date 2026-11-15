import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
let resolvedModel: string | undefined;

export async function generateGeminiJson(systemInstruction: string, prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new AppError(503, 'GEMINI_NOT_CONFIGURED', 'Gemini is not configured.');
  const models = [...new Set([resolvedModel, env.GEMINI_MODEL, env.GEMINI_FALLBACK_MODEL].filter((model): model is string => Boolean(model)))].slice(0, 2);
  let failure = new AppError(503, 'AI_PROVIDER_UNAVAILABLE', 'The AI provider is overloaded or temporarily unavailable. Please try again later.');
  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, responseMimeType: 'application/json' },
        }),
      });
      if (response.status === 429) throw new AppError(429, 'AI_QUOTA_EXCEEDED', 'The AI provider quota has been exhausted. Please wait for the quota reset or ask the site owner to update the provider plan.');
      if ([401, 403].includes(response.status)) throw new AppError(503, 'AI_PROVIDER_AUTH_FAILED', 'The AI provider credentials need attention from the site owner.');
      if ([404, 500, 502, 503, 504].includes(response.status)) continue;
      if (!response.ok) throw new AppError(502, 'GEMINI_PROVIDER_FAILED', 'The AI provider rejected this request. Please try again later.');
      const body = await response.json() as GeminiResponse;
      const text = body.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('');
      if (!text) throw new AppError(502, 'AI_INVALID_RESPONSE', 'The AI provider returned an empty response.');
      resolvedModel = model;
      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name)) {
        failure = new AppError(504, 'AI_SERVICE_TIMEOUT', 'The AI provider took too long to respond. Please try again later.');
        continue;
      }
      throw new AppError(503, 'AI_SERVICE_UNAVAILABLE', 'The AI provider could not be reached. Please try again later.');
    }
  }
  throw failure;
}
