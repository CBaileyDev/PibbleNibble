/**
 * lib/blockPalette.ts
 *
 * Block-ID → 2-tone swatch palette. Mirrors the pixel-shaded block swatches
 * used in the design prototype. Curated entries cover the Mossy Oak Cottage
 * mock; unknown IDs fall back to a keyword-based heuristic so any future
 * builds still render a sensible colour.
 */

export interface BlockPaletteEntry {
  /** Top / main face colour. */
  c1: string
  /** Shadow / accent pixel colour. */
  c2: string
}

const CURATED: Record<string, BlockPaletteEntry> = {
  'minecraft:oak_log':          { c1: '#8B6B3F', c2: '#5E4626' },
  'minecraft:oak_planks':       { c1: '#C49A5F', c2: '#8C6A3B' },
  'minecraft:stripped_oak_log': { c1: '#D3B27A', c2: '#A68552' },
  'minecraft:cobblestone':      { c1: '#8A8F98', c2: '#5E6168' },
  'minecraft:stone_bricks':     { c1: '#9DA3AC', c2: '#6E7178' },
  'minecraft:mossy_cobblestone': { c1: '#6A7A4E', c2: '#465433' },
  'minecraft:coarse_dirt':      { c1: '#7A5A3C', c2: '#4E3A25' },
  'minecraft:grass_block':      { c1: '#6C9B3E', c2: '#3F6621' },
  'minecraft:moss_block':       { c1: '#4E7A32', c2: '#30521F' },
  'minecraft:vine':             { c1: '#3E5D24', c2: '#24371A' },
  'minecraft:hay_block':        { c1: '#C9A867', c2: '#92763F' },
  'minecraft:spruce_planks':    { c1: '#5A3A1F', c2: '#3B2612' },
  'minecraft:dark_oak_stairs':  { c1: '#4C3418', c2: '#2B1D0C' },
  'minecraft:cobblestone_stairs': { c1: '#8A8F98', c2: '#5E6168' },
  'minecraft:oak_fence':        { c1: '#A88250', c2: '#6F5732' },
  'minecraft:oak_door':         { c1: '#9E7641', c2: '#6A4E28' },
  'minecraft:glass_pane':       { c1: '#B8D6E0', c2: '#7AA3B3' },
  'minecraft:lantern':          { c1: '#5E4A2A', c2: '#342612' },
  'minecraft:torch':            { c1: '#B8863B', c2: '#6D4F1E' },
  'minecraft:flower_pot':       { c1: '#7A4A30', c2: '#4A2A18' },
  'minecraft:chest':            { c1: '#A97C3E', c2: '#6F4E21' },
  'minecraft:crafting_table':   { c1: '#8B5A2B', c2: '#4E2F13' },
  'minecraft:furnace':          { c1: '#666A70', c2: '#3A3D42' },
  'minecraft:red_bed':          { c1: '#B83A3A', c2: '#6E2020' },
  'minecraft:bookshelf':        { c1: '#7A5A32', c2: '#4A3820' },
  'minecraft:iron_ingot':       { c1: '#CDD1D6', c2: '#8E949C' },
  'minecraft:stone_slab':       { c1: '#9DA3AC', c2: '#6E7178' },
  'minecraft:cobblestone_wall': { c1: '#8A8F98', c2: '#5E6168' },
  'minecraft:oak_sapling':      { c1: '#4E7A32', c2: '#30521F' },
  'minecraft:oak_leaves':       { c1: '#3E6B22', c2: '#254112' },
  'minecraft:large_fern':       { c1: '#4A6B2B', c2: '#2D4518' },
}

interface KeywordRule {
  match: RegExp
  palette: BlockPaletteEntry
}

const KEYWORD_RULES: KeywordRule[] = [
  { match: /moss/,                  palette: { c1: '#4E7A32', c2: '#30521F' } },
  { match: /vine|leaves|fern|sapling/, palette: { c1: '#3E6B22', c2: '#254112' } },
  { match: /grass/,                 palette: { c1: '#6C9B3E', c2: '#3F6621' } },
  { match: /dirt|podzol|mycelium/,  palette: { c1: '#7A5A3C', c2: '#4E3A25' } },
  { match: /hay|wheat|bamboo/,      palette: { c1: '#C9A867', c2: '#92763F' } },
  { match: /oak|plank|log|fence/,   palette: { c1: '#C49A5F', c2: '#8C6A3B' } },
  { match: /spruce/,                palette: { c1: '#5A3A1F', c2: '#3B2612' } },
  { match: /dark_oak/,              palette: { c1: '#4C3418', c2: '#2B1D0C' } },
  { match: /birch/,                 palette: { c1: '#E4D7AE', c2: '#B29765' } },
  { match: /cherry/,                palette: { c1: '#E8A0B8', c2: '#C46A8A' } },
  { match: /cobble|stone|slab/,     palette: { c1: '#8A8F98', c2: '#5E6168' } },
  { match: /deepslate|blackstone/,  palette: { c1: '#3C3F48', c2: '#1E2128' } },
  { match: /glass/,                 palette: { c1: '#B8D6E0', c2: '#7AA3B3' } },
  { match: /iron|anvil/,            palette: { c1: '#CDD1D6', c2: '#8E949C' } },
  { match: /gold/,                  palette: { c1: '#E8C063', c2: '#A08038' } },
  { match: /diamond/,               palette: { c1: '#63E8D8', c2: '#3AA090' } },
  { match: /netherite/,             palette: { c1: '#4A3E3C', c2: '#241E1D' } },
  { match: /lantern|torch|fire/,    palette: { c1: '#B8863B', c2: '#6D4F1E' } },
  { match: /chest|barrel|crafting/, palette: { c1: '#A97C3E', c2: '#6F4E21' } },
  { match: /bed/,                   palette: { c1: '#B83A3A', c2: '#6E2020' } },
  { match: /wool/,                  palette: { c1: '#D9D9D9', c2: '#8E8E8E' } },
]

export function getBlockPalette(blockId: string): BlockPaletteEntry {
  const hit = CURATED[blockId]
  if (hit) return hit

  for (const rule of KEYWORD_RULES) {
    if (rule.match.test(blockId)) return rule.palette
  }

  return { c1: '#6B88AA', c2: '#3D5570' }
}
