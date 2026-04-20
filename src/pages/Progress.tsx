/**
 * pages/Progress.tsx
 *
 * Kanban-style project tracker — To-do / In Progress / Done.
 * Drag-and-drop via @dnd-kit (full implementation coming soon).
 */

import { PageLayout } from '@/components/layout/PageLayout'
import { useKanbanBoard } from '@/hooks/useProject'

const COLUMN_LABELS: Record<string, { label: string; emoji: string }> = {
  todo:        { label: 'To-do',       emoji: '📋' },
  in_progress: { label: 'In Progress', emoji: '⚒️' },
  done:        { label: 'Done',        emoji: '✅' },
}

export function Progress() {
  const { data: board, isLoading } = useKanbanBoard()

  return (
    <PageLayout flush>
      <div className="h-full flex flex-col gap-4 p-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Progress Tracker</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Drag tasks across columns to track your builds.</p>
        </div>

        {isLoading ? (
          <div className="flex gap-4 flex-1">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 rounded-[var(--radius-lg)] bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
            {(['todo', 'in_progress', 'done'] as const).map((status) => {
              const col = COLUMN_LABELS[status]
              const tasks = board?.[status] ?? []

              return (
                <div
                  key={status}
                  className="flex-1 min-w-64 flex flex-col gap-3 bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] p-4 border border-[var(--border)]"
                >
                  <div className="flex items-center gap-2">
                    <span>{col.emoji}</span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{col.label}</h3>
                    <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded-full border border-[var(--border)]">
                      {tasks.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-[var(--surface)] rounded-[var(--radius-md)] border border-[var(--border)] text-sm text-[var(--text-primary)] cursor-grab hover:border-[var(--accent)] transition-colors"
                      >
                        {task.title}
                        {task.description && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">{task.description}</p>
                        )}
                      </div>
                    ))}

                    {tasks.length === 0 && (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-[var(--text-muted)] text-center">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
