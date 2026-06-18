/**
 * components/layout/ErrorBoundary.tsx
 *
 * Top-level React error boundary. Without it, any uncaught render error
 * unmounts the whole tree and leaves the user staring at a blank window.
 * This catches the error, logs it, and shows a friendly, theme-aware
 * recovery screen with a reload action.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface the stack in the console for debugging / crash reporting.
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: 'var(--bg-primary, #1a1d23)',
          color: 'var(--text-primary, #e8eaed)',
        }}
      >
        <span style={{ fontSize: 44 }} aria-hidden="true">
          🧱
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          Something cracked
        </h1>
        <p style={{ maxWidth: 420, color: 'var(--text-muted, #9aa0a6)', fontSize: 14, margin: 0 }}>
          The app hit an unexpected error. Your data is safe — reloading usually
          fixes it.
        </p>
        {import.meta.env.DEV && (
          <pre
            style={{
              maxWidth: 560,
              maxHeight: 200,
              overflow: 'auto',
              fontSize: 12,
              textAlign: 'left',
              padding: 12,
              borderRadius: 8,
              background: 'var(--surface, #22262e)',
              border: '1px solid var(--border, #3a414d)',
              color: 'var(--text-secondary, #c4c7cc)',
            }}
          >
            {error.message}
          </pre>
        )}
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: 4,
            padding: '10px 20px',
            borderRadius: 10,
            border: '1px solid var(--border, #3a414d)',
            background: 'var(--accent, #00ccff)',
            color: 'var(--accent-contrast, #07121a)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reload app
        </button>
      </div>
    )
  }
}
