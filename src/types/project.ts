/**
 * types/project.ts
 *
 * Project tracker types — the kanban board that lets users plan
 * builds across To-do / In Progress / Done columns.
 */

/** The three kanban columns. */
export type KanbanStatus = 'todo' | 'in_progress' | 'done'

/** A single task card on the kanban board. */
export interface ProjectTask {
  id: string
  userId: string
  title: string
  description?: string
  status: KanbanStatus
  /** Optional link to a saved build. */
  buildId?: string
  /** Sort order within the column. */
  order: number
  /** Due date ISO string, optional. */
  dueAt?: string
  createdAt: string
  updatedAt: string
}

/** Ordered list of tasks grouped by column — used to render the board. */
export type KanbanBoard = Record<KanbanStatus, ProjectTask[]>

/** A coordinate pin dropped on a world map or note. */
export interface WorldNote {
  id: string
  userId: string
  /** Short label shown on the map pin. */
  label: string
  description?: string
  /** Minecraft world X coordinate. */
  x: number
  /** Minecraft world Y coordinate. */
  y: number
  /** Minecraft world Z coordinate. */
  z: number
  /** Optional dimension: overworld / nether / end. */
  dimension: 'overworld' | 'nether' | 'end'
  /** Hex color for the pin marker. */
  pinColor: string
  /** Optional link to a build or task. */
  buildId?: string
  createdAt: string
  updatedAt: string
}

/** An entry in the activity feed (timeline of recent actions). */
export interface ActivityEvent {
  id: string
  userId: string
  type:
    | 'build_created'
    | 'build_completed'
    | 'task_moved'
    | 'note_added'
    | 'material_checked'
  label: string
  entityId?: string
  createdAt: string
}
