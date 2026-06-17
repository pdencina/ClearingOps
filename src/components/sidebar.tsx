'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Layers,
  Wallet,
  Scale,
  Settings,
  ShieldAlert,
  Activity,
  Zap,
  Play,
  Unplug,
  Store,
  Cpu,
  Code2,
  Workflow,
  Radio,
  HeartPulse,
  Timer,
  UserPlus,
  FileBarChart,
  ScrollText,
  AlertTriangle,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transacciones', label: 'Transacciones', icon: ArrowLeftRight },
  { href: '/comercios', label: 'Comercios', icon: Store },
  { href: '/onboarding', label: 'Onboarding', icon: UserPlus },
  { href: '/clearing', label: 'Clearing', icon: Layers },
  { href: '/liquidaciones', label: 'Liquidaciones', icon: Wallet },
  { href: '/conciliacion', label: 'Conciliación', icon: Scale },
  { href: '/reglas', label: 'Reglas & Fees', icon: Settings },
  { href: '/disputas', label: 'Disputas', icon: ShieldAlert },
  { href: '/monitor', label: 'Monitor', icon: Activity },
  { href: '/reportes', label: 'Reportes', icon: FileBarChart },
  { href: '/audit', label: 'Audit Trail', icon: ScrollText },
  { href: '/health', label: 'Health & SLA', icon: HeartPulse },
  { href: '/jobs', label: 'Jobs', icon: Timer },
  { href: '/engine', label: 'KLAP Engine', icon: Cpu },
  { href: '/pipeline', label: 'Pipeline', icon: Workflow },
  { href: '/switch', label: 'Switch ISO', icon: Radio },
  { href: '/apis', label: 'API Reference', icon: Code2 },
  { href: '/demo', label: 'Demo Flow', icon: Play },
  { href: '/pain-points', label: 'Pain Points', icon: AlertTriangle },
  { href: '/independencia', label: 'Independencia BPC', icon: Unplug },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-border flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">KLAP CORE</h1>
            <p className="text-[10px] text-muted uppercase tracking-widest">Payment OS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-muted hover:text-foreground hover:bg-sidebar-hover'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
            PE
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">Pablo Encina</p>
            <p className="text-[10px] text-muted">Administrador</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('klap_session')
              window.location.reload()
            }}
            className="p-1.5 rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
