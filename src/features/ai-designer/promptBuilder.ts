/**
 * features/ai-designer/promptBuilder.ts
 *
 * Constructs the user-turn message sent to Claude when generating a build.
 * Kept separate from systemPrompt.ts so you can iterate on the user prompt
 * format without touching the system instructions.
 */

import type { BuildGenerationRequest } from '@/types/build'

/**
 * Builds a human-readable user message from the generation request form values.
 * The message is structured to give Claude all the constraints up-front.
 */
export function buildUserPrompt(request: BuildGenerationRequest): string {
  const lines: string[] = []

  lines.push(`Design a Minecraft build with the following requirements:`)
  lines.push(``)
  lines.push(`**Description:** ${request.prompt}`)

  if (request.category) {
    lines.push(`**Category:** ${request.category}`)
  }
  if (request.difficulty) {
    lines.push(`**Difficulty:** ${request.difficulty}`)
  }
  if (request.edition) {
    lines.push(`**Edition:** ${request.edition}`)
  }
  if (request.maxBlocks) {
    lines.push(`**Maximum blocks:** ${request.maxBlocks}`)
  }
  if (request.styleNotes) {
    lines.push(`**Style notes:** ${request.styleNotes}`)
  }

  lines.push(``)
  lines.push(
    `Return the JSON object only. Make the instructions friendly and beginner-accessible.`
  )

  return lines.join('\n')
}
