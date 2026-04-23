// Thin fetch wrappers around Anthropic Messages and Google Gemini generateContent.
//
// Both wrappers:
//   - forward an `AbortSignal` so client-side aborts cancel the upstream request
//   - throw `HttpError` (with `.status`) on non-2xx so `fallback.isRetryable`
//     can make a routing decision from the HTTP status code
//   - extract plain text from the provider-specific response envelope

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// ─── Claude (Anthropic Messages API) ─────────────────────────────────────────

const CLAUDE_MODEL = 'claude-sonnet-4-5';
const CLAUDE_MAX_TOKENS = 16000;
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

export async function callClaude(
  system: string,
  user: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new HttpError(500, 'ANTHROPIC_API_KEY is not configured');

  const res = await fetch(CLAUDE_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const body = await safeReadText(res);
    throw new HttpError(res.status, `Anthropic API ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === 'text')?.text
    ?? data.content?.[0]?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new HttpError(502, 'Anthropic response contained no text block');
  }
  return text;
}

// ─── Gemini 2.5 Pro (Google generateContent API) ─────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_MAX_OUTPUT_TOKENS = 16384;

export async function callGemini(
  system: string,
  user: string,
  signal: AbortSignal,
): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new HttpError(500, 'GEMINI_API_KEY is not configured');

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!res.ok) {
    const body = await safeReadText(res);
    throw new HttpError(res.status, `Gemini API ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('');
  if (text.length === 0) {
    throw new HttpError(502, 'Gemini response contained no text parts');
  }
  return text;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function safeReadText(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text.slice(0, 500);
  } catch {
    return '<unreadable body>';
  }
}
