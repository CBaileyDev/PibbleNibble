// Renders the BuildDesignerForm payload into the user-turn markdown block the
// system prompt expects. The system prompt's "Input Contract" names different
// fields (purpose, maxDifficulty, progressionLevel, additionalNotes, …) than
// the form sends (buildType, difficulty, progression, specialRequests, …).
// We bridge the vocabulary here rather than reshape the payload.

const SIZE_FOOTPRINT: Record<string, string> = {
  tiny: 'around 5 × 5 blocks — a quick afternoon build',
  small: 'around 8 × 8 blocks — a few play sessions',
  medium: 'around 12 × 12 blocks — weekend project',
  large: 'around 18 × 18 blocks — long-term commitment',
};

interface FormPayload {
  buildType?: string;
  theme?: string;
  size?: string;
  difficulty?: string;
  progression?: string;
  biome?: string[];
  preferredBlocks?: string;
  specialRequests?: string;
  variationCount?: number;
}

export function buildUserMessage(
  input: FormPayload,
  variationCount: number,
): string {
  const lines: string[] = [
    'This is a Build Designer form submission. Produce exactly ' +
      `${variationCount} distinct \`MinecraftBuild\` variation${variationCount === 1 ? '' : 's'} as specified by your system prompt.`,
    '',
    '## Form inputs',
    '',
    `- **purpose (buildType):** ${required(input.buildType)}`,
    `- **theme:** ${required(input.theme)}`,
    `- **maxDifficulty (difficulty):** ${required(input.difficulty)}`,
    `- **progressionLevel (progression):** ${required(input.progression)}`,
    `- **size hint:** ${input.size ?? 'unspecified'}${
      input.size && SIZE_FOOTPRINT[input.size]
        ? ` — ${SIZE_FOOTPRINT[input.size]} (treat as a soft guideline, ±2 blocks)`
        : ''
    }`,
  ];

  if (Array.isArray(input.biome) && input.biome.length > 0) {
    lines.push(
      `- **biome candidates:** ${input.biome.join(
        ', ',
      )} — the \`biome\` field in each output must be exactly one of these; pick whichever best fits the theme.`,
    );
  } else {
    lines.push('- **biome candidates:** none specified — choose whichever biome best fits the theme.');
  }

  if (input.preferredBlocks && input.preferredBlocks.trim().length > 0) {
    lines.push(
      `- **preferredBlocks (free-form):** "${input.preferredBlocks.trim()}" — translate into Bedrock \`minecraft:...\` IDs and include at least one such block per variation where the progression tier allows.`,
    );
  }

  if (input.specialRequests && input.specialRequests.trim().length > 0) {
    lines.push(
      `- **additionalNotes (specialRequests):** "${input.specialRequests.trim()}" — treat as creative direction; hard constraints above still win.`,
    );
  }

  lines.push('');
  lines.push(
    'Respond with a raw JSON array and nothing else. No markdown, no code fences, no preamble.',
  );

  return lines.join('\n');
}

function required(value: string | undefined): string {
  return value && value.trim().length > 0 ? value : '(missing)';
}
