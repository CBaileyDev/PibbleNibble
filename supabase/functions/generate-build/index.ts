// Edge Function: generate-build
//
// Single responsibility: take a BuildDesignerInput payload from the client,
// route it through Claude (primary) or Gemini (fallback on API failures),
// shape-check + auto-correct the JSON response, then return
//   { builds: MinecraftBuild[], warnings?: string[] }
// exactly as the client's `generateBuilds` expects.

import { SYSTEM_PROMPT } from '../_shared/buildEngine/systemPrompt.ts';
import { MinecraftBuildSchema } from '../_shared/buildEngine/schema.ts';
import { validateBuild } from '../_shared/buildEngine/validator.ts';
import { callClaude, callGemini, HttpError } from '../_shared/providers.ts';
import { isRetryable } from '../_shared/fallback.ts';
import { buildUserMessage } from '../_shared/prompt.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FALLBACK_WARNING =
  'Generated with Gemini 2.5 Pro — Claude was temporarily unavailable.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const input = await parseRequestBody(req);
    const variationCount = clampVariationCount(input.variationCount);

    const system = SYSTEM_PROMPT.replaceAll(
      '{variationCount}',
      String(variationCount),
    );
    const user = buildUserMessage(input, variationCount);

    const warnings: string[] = [];

    let rawText: string;
    try {
      rawText = await callClaude(system, user, req.signal);
    } catch (err) {
      if (req.signal.aborted) throw err;
      if (!isRetryable(err)) throw err;
      console.warn('[generate-build] Claude failed, falling back to Gemini:', describeError(err));
      rawText = await callGemini(system, user, req.signal);
      warnings.push(FALLBACK_WARNING);
    }

    const parsed = parseLlmJsonArray(rawText);
    const shape = MinecraftBuildSchema.array().safeParse(parsed);
    if (!shape.success) {
      const first = shape.error.issues[0];
      const where = first?.path.join('.') ?? 'builds';
      return json({
        error: `AI output failed schema validation (${where}: ${
          first?.message ?? 'invalid'
        }).`,
      }, 502);
    }

    const builds = shape.data.map((b) => {
      const r = validateBuild(b);
      for (const w of r.warnings) {
        warnings.push(`[${w.code}] ${w.message}`);
      }
      return r.correctedBuild ?? b;
    });

    return json({ builds, warnings });
  } catch (err) {
    if (req.signal.aborted) {
      // Client went away — return a cheap body. The client already bailed.
      return json({ error: 'Client aborted' }, 499);
    }
    console.error('[generate-build] Unhandled error:', describeError(err));
    const status = err instanceof HttpError ? err.status : 500;
    return json({ error: describeError(err) }, status);
  }
});

// ─── helpers ────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function clampVariationCount(raw: unknown): number {
  const n = Number(raw);
  const safe = Number.isFinite(n) ? n : 3;
  return Math.max(1, Math.min(5, Math.floor(safe)));
}

async function parseRequestBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json() as unknown;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new HttpError(400, 'Request body must be a JSON object.');
    }
    return body as Record<string, unknown>;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (err instanceof SyntaxError) {
      throw new HttpError(400, 'Request body must be valid JSON.');
    }
    throw err;
  }
}

function parseLlmJsonArray(raw: string): unknown {
  const stripped = stripFences(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new HttpError(502, 'AI output was not valid JSON.');
  }
  // Tolerate `{ "builds": [...] }` wrappers some models emit despite instructions.
  if (
    parsed && typeof parsed === 'object' && !Array.isArray(parsed) &&
    'builds' in (parsed as Record<string, unknown>) &&
    Array.isArray((parsed as { builds: unknown }).builds)
  ) {
    return (parsed as { builds: unknown[] }).builds;
  }
  return parsed;
}

function stripFences(text: string): string {
  const t = text.trim();
  const fenceMatch = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1] : t;
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
