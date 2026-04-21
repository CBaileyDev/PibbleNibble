/**
 * components/instructions/MaterialChecklist.tsx
 *
 * Left-rail shopping list for a build. Groups materials by category
 * (structural / decorative / functional / rare) into collapsible sections
 * and lets the user tick off each block as they gather it.
 *
 * State (the set of collected blockIds) is owned by the parent — this
 * component only dispatches toggle / mark-all events.
 */

import { useMemo, useState } from 'react'
import type { MaterialItem, MaterialCategory } from '@/types/build'
import { BlockSwatch } from './StepCard'

interface MaterialChecklistProps {
  materials: MaterialItem[]
  collectedBlockIds: Set<string>
  onToggle: (blockId: string) => void
  onMarkAll: () => void
}

const GROUP_ORDER: MaterialCategory[] = ['structural', 'decorative', 'functional', 'rare']

const GROUP_META: Record<MaterialCategory, { label: string; blurb: string }> = {
  structural: { label: 'Structural', blurb: 'Logs, planks, foundation' },
  decorative: { label: 'Decorative', blurb: 'Moss, vines, trim' },
  functional: { label: 'Functional', blurb: 'Furniture, lighting' },
  rare:       { label: 'Rare',       blurb: 'Hard-to-find gems' },
}

export function MaterialChecklist({
  materials,
  collectedBlockIds,
  onToggle,
  onMarkAll,
}: MaterialChecklistProps) {
  const grouped = useMemo(() => {
    const byCategory = new Map<MaterialCategory, MaterialItem[]>()
    for (const m of materials) {
      const list = byCategory.get(m.category) ?? []
      list.push(m)
      byCategory.set(m.category, list)
    }
    return GROUP_ORDER.flatMap((cat) => {
      const items = byCategory.get(cat)
      return items && items.length > 0 ? [{ category: cat, items }] : []
    })
  }, [materials])

  const [openCategories, setOpenCategories] = useState<Set<MaterialCategory>>(
    () => new Set<MaterialCategory>(['structural', 'decorative']),
  )

  function toggleGroup(cat: MaterialCategory) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const collectedCount = materials.filter((m) => collectedBlockIds.has(m.blockId)).length
  const allCollected = materials.length > 0 && collectedCount === materials.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 8,
          borderTop: '1px solid var(--border)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
          }}
        >
          Materials
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>{collectedCount}</span>
          <span style={{ color: 'var(--text-muted)' }}> of {materials.length} collected</span>
        </span>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {grouped.map(({ category, items }) => {
          const open = openCategories.has(category)
          const groupDone = items.filter((m) => collectedBlockIds.has(m.blockId)).length
          const meta = GROUP_META[category]

          return (
            <div
              key={category}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleGroup(category)}
                aria-expanded={open}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    aria-hidden
                    style={{
                      display: 'inline-block',
                      width: 0,
                      height: 0,
                      borderLeft: '4px solid var(--text-secondary)',
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform var(--dur-fast, 120ms) var(--ease-out, ease)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {meta.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {meta.blurb}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color:
                      groupDone === items.length ? 'var(--success)' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  {groupDone}/{items.length}
                </span>
              </button>

              {open && (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: '4px 4px 6px',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(0,0,0,0.2)',
                  }}
                >
                  {items.map((m) => (
                    <MaterialRow
                      key={m.blockId}
                      material={m}
                      checked={collectedBlockIds.has(m.blockId)}
                      onToggle={() => onToggle(m.blockId)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Mark all */}
      <button
        type="button"
        onClick={onMarkAll}
        disabled={allCollected}
        style={{
          marginTop: 4,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-sm)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: allCollected ? 'not-allowed' : 'pointer',
          opacity: allCollected ? 0.45 : 1,
          transition: 'all var(--dur-fast, 120ms) var(--ease-out, ease)',
        }}
        onMouseEnter={(e) => {
          if (allCollected) return
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }}
        onMouseLeave={(e) => {
          if (allCollected) return
          e.currentTarget.style.background = 'var(--bg-card)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {allCollected ? 'All Collected' : 'Mark All Collected'}
      </button>
    </div>
  )
}

function MaterialRow({
  material,
  checked,
  onToggle,
}: {
  material: MaterialItem
  checked: boolean
  onToggle: () => void
}) {
  return (
    <li
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 8px',
        borderRadius: 'var(--r-xs)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background var(--dur-fast, 120ms) var(--ease-out, ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <Checkbox checked={checked} onChange={onToggle} label={material.blockName} />
      <BlockSwatch blockId={material.blockId} size={20} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          fontWeight: 500,
          color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: checked ? 'line-through' : 'none',
          textDecorationColor: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {material.blockName}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 500,
          minWidth: 40,
          textAlign: 'right',
          color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
        }}
      >
        ×{material.quantity}
      </span>
      {checked && (
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--success)',
            borderRadius: 'var(--r-xs)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-inverse)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </li>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      style={{
        width: 16,
        height: 16,
        padding: 0,
        flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--bg-base)',
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--r-xs)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: checked
          ? 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.25)'
          : 'inset 0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-inverse)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  )
}
