'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Smartphone,
  Zap,
  Users,
  Logs,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Activity,
  BellRing,
  Settings,
  Search,
} from 'lucide-react'
import { useState } from 'react'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/dashboard/accounts', icon: Smartphone },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Zap },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Logs', href: '/dashboard/logs', icon: Logs },
  { name: 'Analytics', href: '/dashboard/analytics', icon: Activity, requireAdmin: true },
  { name: 'Alert Bots', href: '/dashboard/notifications', icon: BellRing, requireAdmin: true },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, requireAdmin: true },
  { name: 'Global SEO', href: '/dashboard/seo', icon: Search, requireAdmin: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Hard reload to login if totally unauthenticated
      window.location.href = '/login'
    },
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 space-y-4">
        <svg className="animate-spin w-10 h-10 text-[#24A1DE]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-slate-400 font-medium tracking-wider animate-pulse">Authenticating Session...</p>
      </div>
    )
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center justify-center">
              <img src="/logo.svg" alt="Telegram Matrix Logo" className="w-10 h-10 shadow-2xl shadow-indigo-500/20" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-bold text-sm truncate">Telegram Panel</h1>
                <div className="flex items-center gap-1">
                  <p className="text-slate-400 text-xs">Pro Automation</p>
                  {session?.user?.role === 'ADMIN' && (
                    <ShieldCheck className="w-3 h-3 text-[#24A1DE]" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            if (item.requireAdmin && session?.user?.role !== 'ADMIN') return null;

            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#24A1DE] text-white shadow-md'
                    : 'text-slate-100 hover:bg-slate-800'
                }`}
                title={item.name}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.requireAdmin ? 'text-indigo-400' : 'text-slate-300'}`} />
                {sidebarOpen && <span className="text-sm font-semibold">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {sidebarOpen && session?.user?.email && (
            <div className="px-4 py-2 bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-300">Logged in as</p>
              <p className="text-sm font-bold text-white truncate">{session.user.email}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 font-bold">{session.user.role}</p>
            </div>
          )}

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full flex items-center ${
              sidebarOpen ? 'justify-start px-4' : 'justify-center p-0'
            } gap-3 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors`}
            title="Log Out"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">Log Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-200 hover:text-white"
          >
            {sidebarOpen ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{session?.user?.name || 'User'}</p>
              <p className="text-xs font-semibold text-slate-300">{session?.user?.role || 'Member'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
              {(session?.user?.name || session?.user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
