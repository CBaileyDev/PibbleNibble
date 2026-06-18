import { describe, it, expect } from 'vitest'
import { validateBuild } from './validator'
import { makeValidBuild, cloneBuild } from '@/test/fixtures'

describe('validateBuild', () => {
  it('accepts a well-formed build with no errors, warnings, or corrections', () => {
    const result = validateBuild(makeValidBuild())
    expect(result.isValid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.correctedBuild).toBeUndefined()
  })

  it('does not mutate the input build', () => {
    const build = makeValidBuild({
      dimensions: {
        width: 7,
        height: 6,
        depth: 7,
        totalBlocks: 63, // off by 3 → triggers auto-correction
        footprintShape: 'rectangle',
      },
    })
    const before = JSON.stringify(build)
    validateBuild(build)
    expect(JSON.stringify(build)).toBe(before)
  })

  it('flags a build with no phases (E002)', () => {
    const build = cloneBuild(makeValidBuild())
    build.phases = []
    const result = validateBuild(build)
    expect(result.isValid).toBe(false)
    expect(result.errors.some((e) => e.code === 'E002')).toBe(true)
  })

  it('rejects dimensions that exceed the maximum (E007)', () => {
    const build = cloneBuild(makeValidBuild())
    build.dimensions.width = 50
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E007')).toBe(true)
  })

  it('flags a step block missing from the materials list (E008)', () => {
    const build = cloneBuild(makeValidBuild())
    build.phases[0].steps[0].blocksUsed.push({
      blockId: 'minecraft:diamond_block',
      blockName: 'Block of Diamond',
      quantity: 4,
    })
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E008')).toBe(true)
  })

  it('rejects an invalid block id format (E009)', () => {
    const build = cloneBuild(makeValidBuild())
    build.materials[0].blockId = 'oak_planks' // missing minecraft: prefix
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E009')).toBe(true)
  })

  it('rejects a material gated above the build progression (E011)', () => {
    const build = cloneBuild(makeValidBuild())
    build.materials[0].progressionRequired = 'endgame'
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E011')).toBe(true)
  })

  it('auto-corrects a small totalBlocks discrepancy (W001)', () => {
    const build = cloneBuild(makeValidBuild())
    build.dimensions.totalBlocks = 63 // computed total is 60 (within 10%)
    const result = validateBuild(build)
    expect(result.warnings.some((w) => w.code === 'W001')).toBe(true)
    expect(result.correctedBuild).toBeDefined()
    expect(result.correctedBuild?.dimensions.totalBlocks).toBe(60)
  })

  it('errors when totalBlocks discrepancy exceeds the threshold (E010)', () => {
    const build = cloneBuild(makeValidBuild())
    build.dimensions.totalBlocks = 300 // way off from computed 60
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E010')).toBe(true)
  })

  it('auto-corrects when the final step is not a checkpoint (W006)', () => {
    const build = cloneBuild(makeValidBuild())
    const lastPhase = build.phases[build.phases.length - 1]
    lastPhase.steps[lastPhase.steps.length - 1].isCheckpoint = false
    const result = validateBuild(build)
    expect(result.warnings.some((w) => w.code === 'W006')).toBe(true)
    const corrected = result.correctedBuild
    expect(corrected).toBeDefined()
    const correctedLastPhase = corrected!.phases[corrected!.phases.length - 1]
    expect(
      correctedLastPhase.steps[correctedLastPhase.steps.length - 1].isCheckpoint,
    ).toBe(true)
  })

  it('flags non-sequential step numbers (E004)', () => {
    const build = cloneBuild(makeValidBuild())
    build.phases[1].steps[0].stepNumber = 5 // creates a gap after step 1
    const result = validateBuild(build)
    expect(result.errors.some((e) => e.code === 'E004')).toBe(true)
  })
})
