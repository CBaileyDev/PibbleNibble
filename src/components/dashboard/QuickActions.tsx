/**
 * components/dashboard/QuickActions.tsx
 *
 * Row of shortcut buttons on the Dashboard for the most common actions.
 */

import { Link } from 'react-router-dom'
import { Wand2, BookOpen, MapPin, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function QuickActions() {
  const actions = [
    {
      label: 'New Build',
      to: '/build-designer',
      icon: <Wand2 size={15} />,
      variant: 'primary' as const,
    },
    {
      label: 'Saved Builds',
      to: '/saved-builds',
      icon: <BookOpen size={15} />,
      variant: 'secondary' as const,
    },
    {
      label: 'World Notes',
      to: '/world-notes',
      icon: <MapPin size={15} />,
      variant: 'secondary' as const,
    },
    {
      label: 'Progress',
      to: '/progress',
      icon: <CheckSquare size={15} />,
      variant: 'secondary' as const,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Link key={action.to} to={action.to}>
          <Button variant={action.variant} leftIcon={action.icon} size="sm">
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  )
}
