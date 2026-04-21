/**
 * pages/Dashboard.tsx
 *
 * Main hub page for Pibble & Nibble. Composes all dashboard widgets using
 * static mock data until Supabase is wired in Phase 7.
 *
 * Layout:
 *   PageLayout
 *   ├── Stats row (4 × StatCard)
 *   ├── QuickActionsBar
 *   └── Two-column main grid
 *       ├── Left  — ActiveProjectCard + Recent Builds grid
 *       └── Right — WorldNotesWidget + ActivityFeed
 */

import { useNavigate } from 'react-router-dom'
import {
  Hammer,
  CheckCircle2,
  Layers,
  Flame,
} from 'lucide-react'

import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { useTheme } from '@/hooks/useTheme'

import { StatCard } from '@/components/dashboard/StatCard'
import { ActiveProjectCard } from '@/components/dashboard/ActiveProjectCard'
import { RecentBuildCard } from '@/components/dashboard/RecentBuildCard'
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar'
import { WorldNotesWidget } from '@/components/dashboard/WorldNotesWidget'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'

import type { MinecraftBuild, BuildProject } from '@/types/build'
import type { WorldNote } from '@/types/project'

/* ── Mock data ───────────────────────────────────────────────────────────────
   All data is static for Phase 1–6. Phase 7 replaces these constants with
   Supabase queries / React Query hooks.
   ─────────────────────────────────────────────────────────────────────────── */

const MOCK_ACTIVE_BUILD: MinecraftBuild = {
  id: 'build-mossy-cottage',
  userId: 'user-1',
  title: 'Mossy Oak Cottage',
  description: 'A cozy woodland retreat with stone hearth and herb garden.',
  category: 'house',
  difficulty: 'medium',
  edition: 'java',
  dimensions: { width: 12, height: 8, depth: 10 },
  estimatedMinutes: 90,
  materials: [],
  phases: [],
  markdownInstructions: '',
  isAiGenerated: true,
  tags: ['cozy', 'forest'],
  isFavorite: true,
  blockPalette: ['#5E4028', '#7A5638', '#8AA64A', '#C9B180', '#4B5D2E'],
  createdAt: '2026-04-10T10:00:00Z',
  updatedAt: '2026-04-20T18:30:00Z',
}

const MOCK_PROJECT: BuildProject = {
  id: 'proj-1',
  userId: 'user-1',
  buildId: MOCK_ACTIVE_BUILD.id,
  name: 'Mossy Oak Cottage',
  status: 'in-progress',
  progress: { current: 9, total: 24 },
  currentStepText: 'Place the oak log frame for the second-floor walls',
  startedAt: '2026-04-15T09:00:00Z',
  createdAt: '2026-04-15T09:00:00Z',
  updatedAt: '2026-04-20T18:30:00Z',
}

const MOCK_RECENT_BUILDS: MinecraftBuild[] = [
  {
    id: 'build-lantern-tower',
    userId: 'user-1',
    title: 'Blackstone Lantern Tower',
    description: 'A tall nether-themed tower lit by soul lanterns.',
    category: 'landmark',
    difficulty: 'hard',
    edition: 'java',
    dimensions: { width: 9, height: 22, depth: 9 },
    estimatedMinutes: 180,
    materials: [],
    phases: [],
    markdownInstructions: '',
    isAiGenerated: true,
    tags: ['nether', 'tower'],
    isFavorite: false,
    blockPalette: ['#1E1A1E', '#3C2F30', '#E8A23A', '#8B6B3F', '#0F0D10'],
    createdAt: '2026-04-18T14:00:00Z',
    updatedAt: '2026-04-18T14:00:00Z',
  },
  {
    id: 'build-koi-pavilion',
    userId: 'user-1',
    title: 'Willow Koi Pavilion',
    description: 'A tranquil garden pavilion with a koi pond and cherry trees.',
    category: 'decoration',
    difficulty: 'easy',
    edition: 'both',
    dimensions: { width: 16, height: 6, depth: 14 },
    estimatedMinutes: 45,
    materials: [],
    phases: [],
    markdownInstructions: '',
    isAiGenerated: true,
    tags: ['garden', 'peaceful'],
    isFavorite: false,
    blockPalette: ['#C47B5C', '#E8C9A3', '#6FA5A0', '#3E5A48', '#D8526E'],
    createdAt: '2026-04-19T11:00:00Z',
    updatedAt: '2026-04-19T11:00:00Z',
  },
  {
    id: 'build-deepslate-vault',
    userId: 'user-1',
    title: 'Deepslate Vault Chamber',
    description: 'A massive underground storage complex with cyan lighting.',
    category: 'storage',
    difficulty: 'expert',
    edition: 'java',
    dimensions: { width: 24, height: 18, depth: 24 },
    estimatedMinutes: 360,
    materials: [],
    phases: [],
    markdownInstructions: '',
    isAiGenerated: false,
    tags: ['underground', 'storage'],
    isFavorite: true,
    blockPalette: ['#1B2330', '#2E3A4E', '#00B0D9', '#5A6A80', '#0A0D12'],
    createdAt: '2026-04-20T08:00:00Z',
    updatedAt: '2026-04-20T08:00:00Z',
  },
]

const MOCK_NOTES: WorldNote[] = [
  {
    id: 'note-1',
    userId: 'user-1',
    label: 'Home Base',
    x: 248,
    y: 64,
    z: -1192,
    dimension: 'overworld',
    pinColor: '#00CCFF',
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'note-2',
    userId: 'user-1',
    label: 'Iron Mine',
    description: 'Rich iron vein, bring lots of pickaxes',
    x: -412,
    y: 16,
    z: 873,
    dimension: 'overworld',
    pinColor: '#8AA64A',
    createdAt: '2026-04-16T14:20:00Z',
    updatedAt: '2026-04-16T14:20:00Z',
  },
  {
    id: 'note-3',
    userId: 'user-1',
    label: 'Nether Portal',
    x: 108,
    y: 68,
    z: -240,
    dimension: 'overworld',
    pinColor: '#E8A23A',
    createdAt: '2026-04-17T09:45:00Z',
    updatedAt: '2026-04-17T09:45:00Z',
  },
  {
    id: 'note-4',
    userId: 'user-1',
    label: 'Blaze Farm',
    x: 54,
    y: 48,
    z: -110,
    dimension: 'nether',
    pinColor: '#FF4455',
    createdAt: '2026-04-18T16:00:00Z',
    updatedAt: '2026-04-18T16:00:00Z',
  },
  {
    id: 'note-5',
    userId: 'user-1',
    label: 'Ancient City',
    description: 'Found it while caving — lots of loot',
    x: 312,
    y: -45,
    z: 608,
    dimension: 'overworld',
    pinColor: '#7BCF3F',
    createdAt: '2026-04-20T12:30:00Z',
    updatedAt: '2026-04-20T12:30:00Z',
  },
]

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    message: 'Completed "Foundation" phase on Mossy Oak Cottage',
    timestamp: '2026-04-20T18:30:00Z',
    type: 'complete',
  },
  {
    id: 'act-2',
    message: 'Saved Blackstone Lantern Tower to library',
    timestamp: '2026-04-20T15:10:00Z',
    type: 'save',
  },
  {
    id: 'act-3',
    message: 'Started Deepslate Vault Chamber build',
    timestamp: '2026-04-20T08:05:00Z',
    type: 'start',
  },
  {
    id: 'act-4',
    message: 'Completed "Excavation" phase on Deepslate Vault',
    timestamp: '2026-04-19T21:00:00Z',
    type: 'complete',
  },
  {
    id: 'act-5',
    message: 'Saved Willow Koi Pavilion design',
    timestamp: '2026-04-19T11:35:00Z',
    type: 'save',
  },
  {
    id: 'act-6',
    message: 'Started Willow Koi Pavilion build',
    timestamp: '2026-04-19T10:00:00Z',
    type: 'start',
  },
  {
    id: 'act-7',
    message: 'Completed all steps on Cherrywood Rope Bridge',
    timestamp: '2026-04-18T19:45:00Z',
    type: 'complete',
  },
  {
    id: 'act-8',
    message: 'Saved Blackstone Lantern Tower to favorites',
    timestamp: '2026-04-18T14:20:00Z',
    type: 'save',
  },
]

/* ── Dashboard component ──────────────────────────────────────────────────── */

export function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <PageLayout
      title="Workshop"
      subtitle={`${theme === 'blossom' ? '🌸 ' : '⚡ '}You and Pibble have 2 active builds. Let's keep crafting.`}
      headerActions={
        <QuickActionsBar
          onGenerateBuild={() => navigate('/build-designer')}
          onViewBuilds={() => navigate('/saved-builds')}
          onOpenChecklists={() => navigate('/progress')}
        />
      }
    >
      {/* ── Stats row ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 'var(--space-4)',
        }}
      >
        <StatCard
          icon={Hammer}
          value={2}
          label="Active Builds"
          trend={{ value: 1, direction: 'up' }}
        />
        <StatCard
          icon={CheckCircle2}
          value={14}
          label="Completed"
          trend={{ value: 3, direction: 'up' }}
        />
        <StatCard
          icon={Layers}
          value="28,431"
          label="Blocks Placed"
        />
        <StatCard
          icon={Flame}
          value="9 days"
          label="Session Streak"
          trend={{ value: 2, direction: 'up' }}
        />
      </div>

      {/* ── Two-column main layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 'var(--space-5)',
          alignItems: 'start',
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Active project */}
          <SectionCard
            title="Active Project"
            subtitle="Pick up where you left off"
          >
            <ActiveProjectCard
              project={MOCK_PROJECT}
              build={MOCK_ACTIVE_BUILD}
              onContinue={() => navigate(`/builds/${MOCK_ACTIVE_BUILD.id}`)}
            />
          </SectionCard>

          {/* Recent builds */}
          <SectionCard
            title="Fresh from the Forge"
            subtitle="Recently generated builds"
            headerAction={
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('/saved-builds')}
                style={{ fontSize: '0.8125rem', color: 'var(--accent)' }}
              >
                See library →
              </button>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-4)',
              }}
            >
              {MOCK_RECENT_BUILDS.map((build) => (
                <RecentBuildCard
                  key={build.id}
                  build={build}
                  onStart={() => navigate(`/builds/${build.id}`)}
                  onSave={() => navigate('/saved-builds')}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* World notes */}
          <SectionCard title="World Notes" subtitle="Coordinate pins">
            <WorldNotesWidget
              notes={MOCK_NOTES}
              onAddNote={() => navigate('/world-notes')}
            />
          </SectionCard>

          {/* Activity feed */}
          <SectionCard title="Recent Activity">
            <ActivityFeed activities={MOCK_ACTIVITIES} />
          </SectionCard>
        </div>
      </div>
    </PageLayout>
  )
}
