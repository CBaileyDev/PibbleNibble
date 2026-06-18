import { describe, it, expect } from 'vitest'
import { MinecraftBuildSchema } from './schema'
import { makeValidBuild, cloneBuild } from '@/test/fixtures'

describe('MinecraftBuildSchema', () => {
  it('parses a well-formed build', () => {
    const result = MinecraftBuildSchema.safeParse(makeValidBuild())
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUIDv4 id', () => {
    const build = cloneBuild(makeValidBuild())
    build.id = 'not-a-uuid'
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('rejects an empty materials array', () => {
    const build = cloneBuild(makeValidBuild())
    build.materials = []
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('rejects a malformed block id', () => {
    const build = cloneBuild(makeValidBuild())
    build.materials[0].blockId = 'minecraft:OAK_PLANKS' // uppercase not allowed
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('rejects style tags that are not kebab-case', () => {
    const build = cloneBuild(makeValidBuild())
    build.styleTags = ['Not Kebab Case']
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('rejects an out-of-range estimatedMinutes', () => {
    const build = cloneBuild(makeValidBuild())
    build.estimatedMinutes = 1000 // max is 600
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('rejects a step id that does not match the required pattern', () => {
    const build = cloneBuild(makeValidBuild())
    build.phases[0].steps[0].stepId = 'step-1'
    expect(MinecraftBuildSchema.safeParse(build).success).toBe(false)
  })

  it('defaults validation to null when omitted', () => {
    const build = cloneBuild(makeValidBuild()) as unknown as Record<string, unknown>
    delete build.validation
    const result = MinecraftBuildSchema.safeParse(build)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.validation).toBeNull()
  })
})
