import { useState, type CSSProperties, type FormEvent } from 'react'
import type {
  BuildDesignerInput,
  BuildType,
  BuildTheme,
  BiomeType,
  BuildSize,
  Difficulty,
  ProgressionLevel,
} from '@/types/build'
import styles from './BuildDesignerForm.module.css'

export interface BuildDesignerFormProps {
  onSubmit: (data: BuildDesignerInput) => void
  isLoading?: boolean
}

interface BuildTypeOption {
  id: BuildType
  emoji: string
  label: string
}
interface ThemeOption {
  id: BuildTheme
  emoji: string
  label: string
}
interface SizeOption {
  id: BuildSize
  label: string
  dim: string
  flavor: string
}
interface DifficultyOption {
  id: Difficulty
  label: string
  swords: 1 | 2 | 3 | 4 | 5
  tone: string
}
interface StageOption {
  id: ProgressionLevel
  label: string
  sub: string
  dots: [string, string, string, string]
}

const BUILD_TYPES: BuildTypeOption[] = [
  { id: 'house',      emoji: '🏠',  label: 'House' },
  { id: 'cottage',    emoji: '🏚️', label: 'Cottage' },
  { id: 'castle',     emoji: '🏰',  label: 'Castle' },
  { id: 'tower',      emoji: '🗼',  label: 'Tower' },
  { id: 'farm',       emoji: '🌾',  label: 'Farm' },
  { id: 'storage',    emoji: '🗃️', label: 'Storage' },
  { id: 'bridge',     emoji: '🌉',  label: 'Bridge' },
  { id: 'shop',       emoji: '🏪',  label: 'Shop' },
  { id: 'decoration', emoji: '🎭',  label: 'Deco' },
]

const THEMES: ThemeOption[] = [
  { id: 'fantasy',  emoji: '🌿',  label: 'Fantasy' },
  { id: 'medieval', emoji: '⚔️',  label: 'Medieval' },
  { id: 'modern',   emoji: '🏙️', label: 'Modern' },
  { id: 'cozy',     emoji: '🌸',  label: 'Cozy' },
  { id: 'nordic',   emoji: '🏔️', label: 'Nordic' },
  { id: 'desert',   emoji: '🏜️', label: 'Desert' },
  { id: 'coastal',  emoji: '🌊',  label: 'Coastal' },
  { id: 'forest',   emoji: '🌲',  label: 'Forest' },
  { id: 'magical',  emoji: '🔮',  label: 'Magical' },
]

const SIZES: SizeOption[] = [
  { id: 'tiny',   label: 'Tiny',   dim: '5 × 5',   flavor: 'Quick afternoon build' },
  { id: 'small',  label: 'Small',  dim: '8 × 8',   flavor: 'A few play sessions' },
  { id: 'medium', label: 'Medium', dim: '12 × 12', flavor: 'Weekend project' },
  { id: 'large',  label: 'Large',  dim: '18 × 18', flavor: 'Long-term commitment' },
]

const DIFFICULTIES: DifficultyOption[] = [
  { id: 'beginner', label: 'Beginner', swords: 1, tone: '#22D45A' },
  { id: 'easy',     label: 'Easy',     swords: 2, tone: '#7BCF3F' },
  { id: 'medium',   label: 'Medium',   swords: 3, tone: '#FFB020' },
  { id: 'hard',     label: 'Hard',     swords: 4, tone: '#FF7A3C' },
  { id: 'expert',   label: 'Expert',   swords: 5, tone: '#FF4455' },
]

const STAGES: StageOption[] = [
  { id: 'early',   label: 'Early Game', sub: 'Wood & stone era',      dots: ['#8A5A2C', '#A57138', '#6E4A23', '#C8A479'] },
  { id: 'mid',     label: 'Mid Game',   sub: 'Iron & steel era',      dots: ['#C8CCD4', '#8C919A', '#5D6268', '#B3BAC4'] },
  { id: 'late',    label: 'Late Game',  sub: 'Diamond & emerald',     dots: ['#5BD4E0', '#4AB7C8', '#3690A0', '#78EADA'] },
  { id: 'endgame', label: 'End Game',   sub: 'Netherite & obsidian',  dots: ['#1A1520', '#3A2E3E', '#5A4A5C', '#7A5E6E'] },
]

const BIOMES: BiomeType[] = [
  'plains', 'forest', 'snowy', 'desert', 'jungle', 'mushroom', 'mesa', 'swamp', 'ocean',
]

interface FormErrors {
  buildType?: string
  theme?: string
  size?: string
  difficulty?: string
  progression?: string
}

export function BuildDesignerForm({ onSubmit, isLoading = false }: BuildDesignerFormProps) {
  const [buildType, setBuildType] = useState<BuildType | ''>('')
  const [theme, setTheme] = useState<BuildTheme | ''>('')
  const [size, setSize] = useState<BuildSize | ''>('')
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('')
  const [progression, setProgression] = useState<ProgressionLevel | ''>('')
  const [biomes, setBiomes] = useState<Set<BiomeType>>(new Set())
  const [preferredBlocks, setPreferredBlocks] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [variationCount, setVariationCount] = useState(3)
  const [optionalOpen, setOptionalOpen] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const toggleBiome = (b: BiomeType) => {
    setBiomes(prev => {
      const next = new Set(prev)
      if (next.has(b)) next.delete(b)
      else next.add(b)
      return next
    })
  }

  const validate = (): FormErrors => {
    const e: FormErrors = {}
    if (!buildType)   e.buildType   = 'Pick a build type'
    if (!theme)       e.theme       = 'Pick a theme'
    if (!size)        e.size        = 'Pick a size'
    if (!difficulty)  e.difficulty  = 'Pick a difficulty'
    if (!progression) e.progression = 'Pick a game stage'
    return e
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload: BuildDesignerInput = {
      buildType:   buildType   as BuildType,
      theme:       theme       as BuildTheme,
      size:        size        as BuildSize,
      difficulty:  difficulty  as Difficulty,
      progression: progression as ProgressionLevel,
      variationCount,
      biome:           biomes.size > 0 ? Array.from(biomes) : undefined,
      preferredBlocks: preferredBlocks.trim() || undefined,
      specialRequests: specialRequests.trim() || undefined,
    }
    onSubmit(payload)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
      {/* ─── 1 · What ─────────────────────────────────────────── */}
      <SectionShell
        number={1}
        title="What are you building?"
        subtitle="Pick a form and a flavor. Combined these set the architectural direction."
      >
        <div className={styles.split14}>
          <div className={styles.col}>
            <SubLabel>Build Type</SubLabel>
            <RadioGrid
              name="buildType"
              className={styles.grid4}
              ariaLabel="Build type"
              error={errors.buildType}
            >
              {BUILD_TYPES.map((b, i) => (
                <RadioTile
                  key={b.id}
                  selected={buildType === b.id}
                  onSelect={() => {
                    setBuildType(b.id)
                    if (errors.buildType) setErrors(e => ({ ...e, buildType: undefined }))
                  }}
                  delayMs={i * 22}
                  ariaLabel={b.label}
                >
                  <span className={styles.tileEmoji}>{b.emoji}</span>
                  <span className={styles.tileLabel}>{b.label}</span>
                </RadioTile>
              ))}
            </RadioGrid>
          </div>

          <div className={styles.col}>
            <SubLabel>Theme</SubLabel>
            <RadioGrid
              name="theme"
              className={styles.grid2}
              ariaLabel="Theme"
              error={errors.theme}
            >
              {THEMES.map((t, i) => (
                <RadioTile
                  key={t.id}
                  selected={theme === t.id}
                  onSelect={() => {
                    setTheme(t.id)
                    if (errors.theme) setErrors(e => ({ ...e, theme: undefined }))
                  }}
                  delayMs={i * 22 + 150}
                  ariaLabel={t.label}
                  rowLayout
                >
                  <span className={styles.tileEmojiSm}>{t.emoji}</span>
                  <span className={`${styles.tileLabel} ${styles.tileLabelRow}`}>{t.label}</span>
                </RadioTile>
              ))}
            </RadioGrid>
          </div>
        </div>
      </SectionShell>

      {/* ─── 2 · Size ─────────────────────────────────────────── */}
      <SectionShell
        number={2}
        title="How big?"
        subtitle="Footprint drives material cost and build time."
      >
        <RadioGrid
          name="size"
          className={styles.sizeGrid}
          ariaLabel="Build size"
          error={errors.size}
        >
          {SIZES.map((s, i) => {
            const selected = size === s.id
            return (
              <RadioTile
                key={s.id}
                selected={selected}
                onSelect={() => {
                  setSize(s.id)
                  if (errors.size) setErrors(e => ({ ...e, size: undefined }))
                }}
                delayMs={i * 30}
                ariaLabel={`${s.label}, ${s.dim} blocks`}
                extraClass={styles.tileColStart}
              >
                <div className={styles.sizeHead}>
                  <span className={styles.sizeName}>{s.label}</span>
                  <SizeBlocksBadge count={i + 1} />
                </div>
                <div className={styles.sizeDims}>
                  {s.dim} <span className={styles.sizeDimsUnit}>blocks</span>
                </div>
                <div className={styles.sizeFlavor}>{s.flavor}</div>
              </RadioTile>
            )
          })}
        </RadioGrid>
      </SectionShell>

      {/* ─── 3 · Skill ────────────────────────────────────────── */}
      <SectionShell
        number={3}
        title="Your skill level"
        subtitle="Match the challenge to the player and the tech tier."
      >
        <div className={styles.split125}>
          <div className={styles.col}>
            <SubLabel>Difficulty</SubLabel>
            <RadioGrid
              name="difficulty"
              className={styles.grid5}
              ariaLabel="Difficulty"
              error={errors.difficulty}
            >
              {DIFFICULTIES.map((d, i) => {
                const selected = difficulty === d.id
                const toneStyle: CSSProperties | undefined = selected
                  ? {
                      borderColor: d.tone,
                      boxShadow:
                        `inset 0 1px 0 rgba(255,255,255,0.05),` +
                        `inset 0 0 0 1px ${d.tone}55,` +
                        `0 0 18px ${d.tone}40,` +
                        `0 2px 0 rgba(0,0,0,0.4)`,
                    }
                  : undefined
                return (
                  <RadioTile
                    key={d.id}
                    selected={selected}
                    onSelect={() => {
                      setDifficulty(d.id)
                      if (errors.difficulty) setErrors(e => ({ ...e, difficulty: undefined }))
                    }}
                    delayMs={i * 30}
                    ariaLabel={d.label}
                    extraClass={styles.tileCompact}
                    overrideStyle={toneStyle}
                    cornerColor={selected ? d.tone : undefined}
                  >
                    <SwordsRow count={d.swords} tone={d.tone} active={selected} />
                    <span
                      className={styles.diffLabel}
                      style={selected ? { color: d.tone } : undefined}
                    >
                      {d.label}
                    </span>
                  </RadioTile>
                )
              })}
            </RadioGrid>
          </div>

          <div className={styles.col}>
            <SubLabel>Game Stage</SubLabel>
            <RadioGrid
              name="progression"
              className={styles.grid2}
              ariaLabel="Game stage"
              error={errors.progression}
            >
              {STAGES.map((g, i) => {
                const selected = progression === g.id
                return (
                  <RadioTile
                    key={g.id}
                    selected={selected}
                    onSelect={() => {
                      setProgression(g.id)
                      if (errors.progression) setErrors(e => ({ ...e, progression: undefined }))
                    }}
                    delayMs={i * 40 + 100}
                    ariaLabel={`${g.label}, ${g.sub}`}
                    extraClass={styles.tileStageCard}
                  >
                    <span className={styles.stageTitle}>{g.label}</span>
                    <span className={styles.stageSub}>{g.sub}</span>
                    <BlockPalette dots={g.dots} />
                  </RadioTile>
                )
              })}
            </RadioGrid>
          </div>
        </div>
      </SectionShell>

      {/* ─── 4 · Optional (collapsible) ──────────────────────── */}
      <section className={styles.section}>
        <button
          type="button"
          className={`${styles.sectionHeader} ${styles.optionalToggle}`}
          onClick={() => setOptionalOpen(v => !v)}
          aria-expanded={optionalOpen}
          aria-controls="build-designer-optional"
          style={{ borderBottomColor: optionalOpen ? 'var(--border)' : 'transparent' }}
        >
          <span className={styles.sectionBadge}>04</span>
          <div className={styles.sectionHeaderText}>
            <h2 className={styles.sectionTitle}>Optional details</h2>
            <p className={styles.sectionSubtitle}>
              Fine-tune biomes, materials, and variations the AI returns.
            </p>
          </div>
          <span className={styles.optionalToggleIndicator}>
            {optionalOpen ? 'Close' : 'Expand'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`${styles.chevron} ${optionalOpen ? styles.chevronOpen : ''}`}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {optionalOpen && (
          <div id="build-designer-optional" className={styles.optionalBody}>
            {/* Biomes */}
            <div>
              <SubLabel>
                Biome vibe
                <span className={styles.subLabelHint}>multi-select</span>
              </SubLabel>
              <div className={styles.chipRow} role="group" aria-label="Biome vibe">
                {BIOMES.map(b => {
                  const on = biomes.has(b)
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBiome(b)}
                      aria-pressed={on}
                      className={`${styles.chip} ${on ? styles.chipSelected : ''}`}
                    >
                      {on && <span className={styles.chipCheck} aria-hidden="true">✓</span>}
                      {b}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Preferred blocks */}
            <div>
              <label htmlFor="bd-preferred-blocks">
                <SubLabel>Preferred blocks</SubLabel>
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="bd-preferred-blocks"
                  type="text"
                  className={styles.input}
                  placeholder="e.g., spruce wood, stone bricks, copper..."
                  value={preferredBlocks}
                  onChange={e => setPreferredBlocks(e.target.value)}
                />
              </div>
            </div>

            {/* Special requests */}
            <div>
              <label htmlFor="bd-special-requests">
                <SubLabel>Special requests</SubLabel>
              </label>
              <div className={styles.inputWrap}>
                <textarea
                  id="bd-special-requests"
                  className={styles.textarea}
                  placeholder="Any other notes for the AI..."
                  rows={3}
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                />
              </div>
            </div>

            {/* Variations */}
            <div>
              <SubLabel>
                Variations
                <span className={styles.subLabelHint}>how many options to generate</span>
              </SubLabel>
              <div
                className={styles.variationsGroup}
                role="radiogroup"
                aria-label="Number of variations"
              >
                {[1, 2, 3, 4, 5].map(n => {
                  const on = variationCount === n
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      tabIndex={on ? 0 : -1}
                      onClick={() => setVariationCount(n)}
                      onKeyDown={e => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault()
                          setVariationCount(Math.min(5, n + 1))
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault()
                          setVariationCount(Math.max(1, n - 1))
                        }
                      }}
                      className={`${styles.variationBtn} ${on ? styles.variationBtnOn : ''}`}
                    >
                      {n}
                      {on && <span className={styles.variationCheck} aria-hidden="true">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Submit ───────────────────────────────────────────── */}
      <div className={styles.submitWrap}>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          <span className={styles.submitSparkle} aria-hidden="true">✨</span>
          <span className={styles.submitLabel}>Generate Builds</span>
          <span className={styles.submitChip}>×{variationCount}</span>
          <span className={styles.submitShimmer} aria-hidden="true" />
          <span className={styles.submitInnerHighlight} aria-hidden="true" />
        </button>
        <p className={styles.submitFootnote}>
          Claude AI will generate{' '}
          <span className={styles.submitFootnoteAccent}>{variationCount}</span>{' '}
          unique build option{variationCount === 1 ? '' : 's'}
        </p>
      </div>

      {isLoading && <LoadingOverlay />}
    </form>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function SectionShell({
  number,
  title,
  subtitle,
  children,
}: {
  number: number
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionBadge}>{String(number).padStart(2, '0')}</span>
        <div className={styles.sectionHeaderText}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}
        </div>
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className={styles.subLabel}>{children}</div>
}

function RadioGrid({
  name,
  className,
  ariaLabel,
  error,
  children,
}: {
  name: string
  className: string
  ariaLabel: string
  error?: string
  children: React.ReactNode
}) {
  const errorId = error ? `${name}-error` : undefined
  return (
    <>
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={className}
      >
        {children}
      </div>
      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
    </>
  )
}

interface RadioTileProps {
  selected: boolean
  onSelect: () => void
  delayMs?: number
  ariaLabel: string
  rowLayout?: boolean
  extraClass?: string
  overrideStyle?: CSSProperties
  cornerColor?: string
  children: React.ReactNode
}

function RadioTile({
  selected,
  onSelect,
  delayMs = 0,
  ariaLabel,
  rowLayout,
  extraClass,
  overrideStyle,
  cornerColor,
  children,
}: RadioTileProps) {
  const className = [
    styles.tile,
    rowLayout ? styles.tileRow : null,
    extraClass ?? null,
    selected ? styles.tileSelected : null,
  ]
    .filter(Boolean)
    .join(' ')

  const style: CSSProperties = {
    animationDelay: `${delayMs}ms`,
    ...(overrideStyle ?? {}),
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={className}
      style={style}
    >
      {children}
      {selected && <CornerCuts color={cornerColor} />}
    </button>
  )
}

function CornerCuts({ color }: { color?: string }) {
  const style = color ? { background: color } : undefined
  return (
    <>
      <span className={`${styles.cornerCut} ${styles.cornerTL}`} style={style} aria-hidden="true" />
      <span className={`${styles.cornerCut} ${styles.cornerTR}`} style={style} aria-hidden="true" />
      <span className={`${styles.cornerCut} ${styles.cornerBL}`} style={style} aria-hidden="true" />
      <span className={`${styles.cornerCut} ${styles.cornerBR}`} style={style} aria-hidden="true" />
    </>
  )
}

function SizeBlocksBadge({ count }: { count: number }) {
  return (
    <div className={styles.sizeBlocksBadge} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 4 + i * 1.2,
            height: 6 + i * 3,
          }}
        />
      ))}
    </div>
  )
}

function SwordsRow({
  count,
  tone,
  active,
}: {
  count: number
  tone: string
  active: boolean
}) {
  return (
    <div className={styles.swordsRow} aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => {
        const on = i < count
        const color = active
          ? tone
          : on
            ? 'var(--text-secondary)'
            : 'var(--border-strong)'
        return (
          <SwordIcon
            key={i}
            filled={on}
            color={color}
            glow={active && on ? tone : undefined}
          />
        )
      })}
    </div>
  )
}

function SwordIcon({
  filled,
  color,
  glow,
}: {
  filled: boolean
  color: string
  glow?: string
}) {
  return (
    <svg
      width="11"
      height="22"
      viewBox="0 0 11 22"
      fill="none"
      style={{
        filter: glow ? `drop-shadow(0 0 4px ${glow})` : 'none',
        transition: 'filter var(--dur-fast) var(--ease-out)',
      }}
    >
      <rect x="4" y="1"  width="3" height="13"  fill={filled ? color : 'none'} stroke={color} strokeWidth="1" />
      <rect x="1" y="14" width="9" height="2"   fill={color} />
      <rect x="4" y="16" width="3" height="4"   fill={filled ? color : 'none'} stroke={color} strokeWidth="1" />
      <rect x="3" y="20" width="5" height="1.5" fill={color} />
    </svg>
  )
}

function BlockPalette({ dots }: { dots: readonly string[] }) {
  return (
    <div className={styles.paletteDots} aria-hidden="true">
      {dots.map((c, i) => (
        <span key={i} className={styles.paletteDot} style={{ background: c }} />
      ))}
    </div>
  )
}

function LoadingOverlay() {
  const blocks = Array.from({ length: 9 })
  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      aria-label="Designing your build"
    >
      <div className={styles.overlayStack} aria-hidden="true">
        {blocks.map((_, i) => (
          <span
            key={i}
            className={styles.overlayBlock}
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
      </div>
      <div className={styles.overlayText}>
        <h3 className={styles.overlayTitle}>Designing your build</h3>
        <p className={styles.overlaySub}>Stacking blocks &middot; Claude AI</p>
      </div>
    </div>
  )
}
