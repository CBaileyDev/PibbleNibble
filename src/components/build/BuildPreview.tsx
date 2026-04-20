/**
 * components/build/BuildPreview.tsx
 *
 * Renders the AI-generated markdown instructions inside a styled prose
 * container. Used in BuildDetail to show the full narrative walkthrough.
 */

import ReactMarkdown from 'react-markdown'

interface BuildPreviewProps {
  markdown: string
}

export function BuildPreview({ markdown }: BuildPreviewProps) {
  return (
    <div
      className={[
        'prose prose-sm max-w-none',
        /* Manually scope prose colours to CSS vars */
        '[&_h1]:text-[var(--text-primary)] [&_h2]:text-[var(--text-primary)] [&_h3]:text-[var(--text-primary)]',
        '[&_p]:text-[var(--text-secondary)] [&_li]:text-[var(--text-secondary)]',
        '[&_strong]:text-[var(--text-primary)]',
        '[&_code]:bg-[var(--bg-tertiary)] [&_code]:text-[var(--accent)] [&_code]:rounded [&_code]:px-1',
        '[&_blockquote]:border-l-[var(--accent)] [&_blockquote]:text-[var(--text-muted)]',
        '[&_hr]:border-[var(--border)]',
        '[&_a]:text-[var(--accent)] [&_a:hover]:text-[var(--accent-hover)]',
      ].join(' ')}
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}
