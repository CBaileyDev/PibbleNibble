import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { AppToaster } from '@/components/ui/Toast'

export function AppShell() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <AppToaster />
    </div>
  )
}
