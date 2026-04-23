/**
 * components/ui/Avatar.tsx
 *
 * Pixel-art SVG mob portraits. Each avatar is a self-contained SVG
 * component so no image assets need to ship with the app — everything
 * renders from code and scales crisply at any size.
 *
 * The public API is `<Avatar id="creeper" size={32} />`, where `id`
 * matches the string stored in `profiles.avatar_url`.
 */

import type { ReactNode } from 'react'

export type AvatarId =
  | 'creeper'
  | 'enderman'
  | 'pig'
  | 'wolf'
  | 'cat'
  | 'axolotl'
  | 'villager'
  | 'steve'

export interface AvatarOption {
  id: AvatarId
  name: string
  /** Primary background tint behind the face — used by surrounding UI chrome. */
  color: string
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'creeper',  name: 'Creeper',  color: '#3FAA51' },
  { id: 'enderman', name: 'Enderman', color: '#1A1320' },
  { id: 'pig',      name: 'Pig',      color: '#F2B4C1' },
  { id: 'wolf',     name: 'Wolf',     color: '#C9CED3' },
  { id: 'cat',      name: 'Cat',      color: '#E8954A' },
  { id: 'axolotl',  name: 'Axolotl',  color: '#F2A3C7' },
  { id: 'villager', name: 'Villager', color: '#A27B5C' },
  { id: 'steve',    name: 'Steve',    color: '#4E7AC7' },
]

function byId(id: string): AvatarOption {
  return AVATAR_OPTIONS.find((o) => o.id === id) ?? AVATAR_OPTIONS[0]!
}

interface AvatarProps {
  id?: string | null
  size?: number
  className?: string
}

/**
 * Render an 8×8 pixel grid where `grid` is a 64-char string using a
 * single-character palette. `.` = transparent; every other char is a
 * key into `palette`. This keeps each face declarative and tiny.
 */
function PixelGrid({ grid, palette, size }: { grid: string; palette: Record<string, string>; size: number }) {
  const cells: ReactNode[] = []
  for (let i = 0; i < 64; i++) {
    const ch = grid[i]
    if (!ch || ch === '.') continue
    const color = palette[ch]
    if (!color) continue
    const x = i % 8
    const y = Math.floor(i / 8)
    cells.push(
      <rect key={i} x={x} y={y} width={1} height={1} fill={color} shapeRendering="crispEdges" />,
    )
  }
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      {cells}
    </svg>
  )
}

/* ── Face grids ──────────────────────────────────────────────────────── */

const CREEPER = {
  grid:
    '.gggggg.' +
    'gddddddg' +
    'gdmmddmg' +
    'gdmmddmg' +
    'gddmmddg' +
    'gdmddmdg' +
    'gdmddmdg' +
    '.gmmmmg.',
  palette: { g: '#4DB34D', d: '#2C7A36', m: '#0F2716' },
}

const ENDERMAN = {
  grid:
    '.kkkkkk.' +
    'kkkkkkkk' +
    'kkpppkkk' +
    'kkpppkkk' +
    'kkkppkkk' +
    'kkkpkkkk' +
    'kkkkkkkk' +
    '.kkkkkk.',
  palette: { k: '#1A1320', p: '#B388FF' },
}

const PIG = {
  grid:
    '.pppppp.' +
    'prrrrrrp' +
    'prkkkkrp' +
    'prkkkkrp' +
    'prrnnrpp' +
    'prnnnnpp' +
    'prnnnnpp' +
    '.ppppppp',
  palette: { p: '#E99AAA', r: '#F2B4C1', k: '#3A1A24', n: '#C76D82' },
}

const WOLF = {
  grid:
    '.w..w...' +
    'wwwwww..' +
    'wwgwgww.' +
    'wwwwwww.' +
    '.wnnnw..' +
    '.wnnnw..' +
    '..www...' +
    '...w....',
  palette: { w: '#E2E6EB', g: '#2E2E2E', n: '#1A1A1A' },
}

const CAT = {
  grid:
    '.c..c...' +
    'cccccc..' +
    'ccycycc.' +
    'cccccccc' +
    'ccnnnnc.' +
    '.cnnncc.' +
    '.cccccc.' +
    '..cccc..',
  palette: { c: '#E8954A', y: '#F6D23A', n: '#3B1A04' },
}

const AXOLOTL = {
  grid:
    '.aaaaaa.' +
    'aappppaa' +
    'apbppbpa' +
    'appppppa' +
    'appmmppa' +
    'apmmmmpa' +
    'aappppaa' +
    'g.gaag.g',
  palette: { a: '#F2A3C7', p: '#FFD1E0', b: '#3A1A24', m: '#D16C8E', g: '#E85B92' },
}

const VILLAGER = {
  grid:
    '.bbbbbb.' +
    'bssssssb' +
    'bshhshsb' +
    'bsnnnnsb' +
    'bsnnnnsb' +
    'bsmmmmsb' +
    'brrrrrrb' +
    '.bbbbbb.',
  palette: { b: '#4B3722', s: '#B88E5C', h: '#1C1008', n: '#8A5E3B', m: '#2A1A0E', r: '#27455D' },
}

const STEVE = {
  grid:
    '.sssssss' +
    'shhhhhhs' +
    'skkkkkks' +
    'skwekwes' +
    'sknnnnks' +
    'sknmmnks' +
    'sskkkkss' +
    '.bbbbbb.',
  palette: { s: '#2B1A08', h: '#6E4623', k: '#C08866', w: '#E6E6E6', e: '#2E4DA6', n: '#7E5530', m: '#A8635B', b: '#2F7D9E' },
}

const GRIDS: Record<AvatarId, { grid: string; palette: Record<string, string> }> = {
  creeper:  CREEPER,
  enderman: ENDERMAN,
  pig:      PIG,
  wolf:     WOLF,
  cat:      CAT,
  axolotl:  AXOLOTL,
  villager: VILLAGER,
  steve:    STEVE,
}

/**
 * Avatar portrait with a rounded block background. The portrait itself
 * scales to ~85% of the tile; the surrounding pad carries the mob's
 * signature colour so the avatar reads even at small sizes.
 */
export function Avatar({ id, size = 32, className }: AvatarProps) {
  const option = byId(id ?? 'creeper')
  const cfg = GRIDS[option.id]
  const innerSize = Math.round(size * 0.86)
  return (
    <span
      className={className}
      role="img"
      aria-label={`${option.name} avatar`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 'var(--r-sm)',
        background: option.color,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -2px 0 rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}
    >
      <PixelGrid grid={cfg.grid} palette={cfg.palette} size={innerSize} />
    </span>
  )
}
