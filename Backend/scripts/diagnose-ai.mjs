import dotenv from 'dotenv';

dotenv.config({ path: new URL('../../.env', import.meta.url) });

// Run in the deployed API/worker environment. An empty input validates routing
// and the internal token without sending a resume or consuming Gemini quota.
const base = process.env.AI_SERVICE_URL;
const token = process.env.AI_SERVICE_TOKEN;
if (!base || !token) {
  console.error('Set AI_SERVICE_URL and AI_SERVICE_TOKEN in this API/worker environment.');
  process.exitCode = 1;
} else {
  try {
    const response = await fetch(new URL('/api/v1/ipca/analyze', base), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ai-service-token': token },
      body: '{}',
      signal: AbortSignal.timeout(60000),
      redirect: 'error',
    });
    const body = await response.json().catch(() => null);
    if (response.status === 422 && body?.error_code === 'INVALID_REQUEST_INPUT') {
      console.log('PASS: AI workflow route is reachable and the service token is accepted. Gemini and MongoDB still require a separate runtime check.');
    } else {
      process.exitCode = 1;
      console.error(`FAIL: AI workflow route returned HTTP ${response.status}.`);
      if ([401, 403].includes(response.status)) console.error('Match AI_SERVICE_TOKEN across the API, worker, and Python service.');
      else if ([404, 405].includes(response.status)) console.error('Set AI_SERVICE_URL to the Python FastAPI service origin, not the frontend or Express API.');
      else if (response.status === 503) console.error('Check Python service startup logs and whether AI_SERVICE_TOKEN is configured there.');
      else console.error('Check the Python service and hosting proxy logs for this request.');
    }
  } catch {
    process.exitCode = 1;
    console.error('FAIL: Could not reach the AI workflow route within 60 seconds. Check AI_SERVICE_URL, service startup, TLS, and network access.');
  }
}
