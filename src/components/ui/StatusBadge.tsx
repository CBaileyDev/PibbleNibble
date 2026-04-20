type BuildStatus = 'todo' | 'in-progress' | 'completed'

const STATUS_CONFIG: Record<BuildStatus, { cls: string; label: string; dot: string }> = {
  todo:          { cls: 'badge-todo',      label: 'To Do',       dot: '▪' },
  'in-progress': { cls: 'badge-progress',  label: 'In Progress', dot: '▪' },
  completed:     { cls: 'badge-completed', label: 'Completed',   dot: '▪' },
}

interface StatusBadgeProps {
  status: BuildStatus | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as BuildStatus]
  if (!cfg) return null
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" />
      {cfg.label}
    </span>
  )
}
