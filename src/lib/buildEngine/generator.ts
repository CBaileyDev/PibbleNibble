// =============================================================================
// src/lib/buildEngine/generator.ts
//
// AI build generation handler. Wraps the Anthropic Node SDK with validation,
// a single retry on failure, and graceful error handling so the route never
// crashes. Consumes a BuildDesignerInput (from the designer form) and returns
// a GeneratorResult containing validated MinecraftBuild objects.
// =============================================================================

import Anthropic from '@anthropic-ai/sdk';

import type {
  BuildDesignerInput,
  BuildSize,
  MinecraftBuild,
} from '../../types/build';
import { SYSTEM_PROMPT } from './systemPrompt';
import { validateBuild, type ValidationError } from './validator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratorResult {
  builds: MinecraftBuild[];
  error?: string;
  retried: boolean;
  rawResponse?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8000;

const SIZE_DIMENSIONS: Record<BuildSize, string> = {
  tiny: '5×5×5 blocks',
  small: '8×8×8 blocks',
  medium: '14×14×12 blocks',
  large: '22×22×18 blocks',
};

// ─── formatUserMessage ────────────────────────────────────────────────────────

export function formatUserMessage(input: BuildDesignerInput): string {
  const lines: string[] = [];

  lines.push(
    `Generate ${input.variationCount} unique Minecraft ${input.buildType} builds with a ${input.theme} theme.`
  );
  lines.push(
    `Size: ${input.size} (approximately ${SIZE_DIMENSIONS[input.size]}).`
  );
  lines.push(
    `Difficulty: ${input.difficulty}. Game stage: ${input.progression}.`
  );

  if (input.biome && input.biome.length > 0) {
    lines.push(`Biome context: ${input.biome.join(', ')}.`);
  }

  if (input.preferredBlocks && input.preferredBlocks.trim()) {
    lines.push(`Preferred materials: ${input.preferredBlocks.trim()}.`);
  }

  if (input.specialRequests && input.specialRequests.trim()) {
    lines.push(`Additional notes: ${input.specialRequests.trim()}.`);
  }

  lines.push(
    'Return ONLY a valid JSON array of MinecraftBuild objects. No other text.'
  );

  return lines.join('\n');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(input: BuildDesignerInput): string {
  return SYSTEM_PROMPT.replace(
    /\{variationCount\}/g,
    String(input.variationCount)
  );
}

function getClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

interface CallResult {
  text: string;
  parsed?: unknown;
  parseError?: string;
}

async function callModel(
  client: Anthropic,
  system: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<CallResult> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages,
  });

  const firstBlock = response.content[0];
  const text =
    firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';

  try {
    const parsed = JSON.parse(extractJsonArray(text));
    return { text, parsed };
  } catch (e) {
    return {
      text,
      parseError: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Strip optional markdown code fences or stray preamble and isolate the JSON
 * array. The system prompt forbids this, but we guard anyway.
 */
function extractJsonArray(text: string): string {
  const trimmed = text.trim();
  const first = trimmed.indexOf('[');
  const last = trimmed.lastIndexOf(']');
  if (first === -1 || last === -1 || last <= first) {
    return trimmed;
  }
  return trimmed.slice(first, last + 1);
}

function formatValidationFeedback(
  failures: Array<{ index: number; errors: ValidationError[] }>
): string {
  const lines: string[] = [
    'Your previous response contained builds that failed validation. Please fix the issues below and return the FULL corrected JSON array (all builds, not just the broken ones). Return ONLY valid JSON — no commentary.',
  ];

  for (const failure of failures) {
    lines.push(`\nBuild at index ${failure.index}:`);
    for (const err of failure.errors) {
      const field = err.field ? ` (field: ${err.field})` : '';
      lines.push(`  - [${err.code}] ${err.message}${field}`);
    }
  }

  return lines.join('\n');
}

interface ParsedBuildsOutcome {
  builds: MinecraftBuild[];
  failures: Array<{ index: number; errors: ValidationError[] }>;
}

function processParsed(parsed: unknown): ParsedBuildsOutcome | null {
  if (!Array.isArray(parsed)) return null;

  const builds: MinecraftBuild[] = [];
  const failures: Array<{ index: number; errors: ValidationError[] }> = [];

  for (let i = 0; i < parsed.length; i++) {
    const candidate = parsed[i] as MinecraftBuild;
    const result = validateBuild(candidate);
    const effective = result.correctedBuild ?? candidate;

    if (result.isValid) {
      builds.push(effective);
    } else {
      failures.push({ index: i, errors: result.errors });
    }
  }

  return { builds, failures };
}

// ─── generateBuilds ───────────────────────────────────────────────────────────

export async function generateBuilds(
  input: BuildDesignerInput
): Promise<GeneratorResult> {
  const system = buildSystemPrompt(input);
  const userMessage = formatUserMessage(input);

  let client: Anthropic;
  try {
    client = getClient();
  } catch (e) {
    console.error('[generator] Failed to initialize Anthropic client:', e);
    return { builds: [], error: 'Generation failed.', retried: false };
  }

  const conversation: Array<{ role: 'user' | 'assistant'; content: string }> = [
    { role: 'user', content: userMessage },
  ];

  let firstCall: CallResult;
  try {
    firstCall = await callModel(client, system, conversation);
  } catch (e) {
    console.error('[generator] Anthropic API error (initial):', e);
    return { builds: [], error: 'Generation failed.', retried: false };
  }

  const rawResponse = firstCall.text;

  if (firstCall.parseError !== undefined) {
    console.error(
      '[generator] JSON parse error on initial response:',
      firstCall.parseError,
      '\nRaw text:\n',
      rawResponse
    );
  }

  const firstOutcome =
    firstCall.parsed !== undefined ? processParsed(firstCall.parsed) : null;

  const needsRetry =
    firstCall.parseError !== undefined ||
    firstOutcome === null ||
    firstOutcome.failures.length > 0;

  if (!needsRetry && firstOutcome) {
    return {
      builds: firstOutcome.builds,
      retried: false,
      rawResponse,
    };
  }

  // ── Retry once with corrective feedback ────────────────────────────────────
  conversation.push({ role: 'assistant', content: rawResponse });

  let retryUserMessage: string;
  if (firstCall.parseError !== undefined || firstOutcome === null) {
    retryUserMessage =
      'Your previous response was not valid JSON (or was not a JSON array of MinecraftBuild objects). Return ONLY a valid JSON array — no prose, no code fences, no commentary. The first character must be `[` and the last must be `]`.';
  } else {
    retryUserMessage = formatValidationFeedback(firstOutcome.failures);
  }
  conversation.push({ role: 'user', content: retryUserMessage });

  let retryCall: CallResult;
  try {
    retryCall = await callModel(client, system, conversation);
  } catch (e) {
    console.error('[generator] Anthropic API error (retry):', e);
    return {
      builds: firstOutcome?.builds ?? [],
      error: 'Generation failed.',
      retried: true,
      rawResponse,
    };
  }

  if (retryCall.parseError !== undefined) {
    console.error(
      '[generator] JSON parse error on retry response:',
      retryCall.parseError,
      '\nRaw text:\n',
      retryCall.text
    );
    return {
      builds: firstOutcome?.builds ?? [],
      error: 'Generation failed.',
      retried: true,
      rawResponse: retryCall.text,
    };
  }

  const retryOutcome = processParsed(retryCall.parsed);
  if (!retryOutcome) {
    return {
      builds: firstOutcome?.builds ?? [],
      error: 'Generation failed.',
      retried: true,
      rawResponse: retryCall.text,
    };
  }

  return {
    builds: retryOutcome.builds,
    retried: true,
    rawResponse: retryCall.text,
  };
}
