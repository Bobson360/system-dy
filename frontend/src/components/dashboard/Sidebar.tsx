'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/auth'
import {
  LayoutDashboard, Users, FileText, ClipboardCheck,
  CreditCard, Settings, LogOut, Scale, Bell,
  UserCheck, AlertTriangle, GitBranch,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  role: string
  userName: string
  userEmail: string
  pendingCount?: number
}

function getNavItems(role: string, pendingCount = 0): NavItem[] {
  switch (role) {
    case 'SUPERADMIN':
      return [
        { label: 'Dashboard',    href: '/admin/dashboard',  icon: <LayoutDashboard size={18} /> },
        { label: 'Advogados',    href: '/admin/advogados',  icon: <Users size={18} /> },
        { label: 'Demandas',     href: '/admin/demandas',   icon: <FileText size={18} /> },
        { label: 'Aprovações',   href: '/admin/aprovacoes', icon: <UserCheck size={18} />, badge: pendingCount },
        { label: 'Pagamentos',   href: '/admin/pagamentos', icon: <CreditCard size={18} /> },
        { label: 'Inadimplentes',href: '/admin/inadimplentes', icon: <AlertTriangle size={18} /> },
      ]
    case 'LAWYER':
      return [
        { label: 'Dashboard',  href: '/advogado/dashboard',  icon: <LayoutDashboard size={18} /> },
        { label: 'Demandas',   href: '/advogado/demandas',   icon: <FileText size={18} /> },
        { label: 'Clientes',   href: '/advogado/clientes',   icon: <Users size={18} /> },
        { label: 'Pagamentos', href: '/advogado/pagamentos', icon: <CreditCard size={18} /> },
        { label: 'Workflows',  href: '/advogado/workflows',  icon: <GitBranch size={18} /> },
      ]
    case 'REVIEWER':
      return [
        { label: 'Dashboard', href: '/revisor/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Fila',      href: '/revisor/fila',      icon: <ClipboardCheck size={18} />, badge: pendingCount },
        { label: 'Histórico', href: '/revisor/historico', icon: <FileText size={18} /> },
      ]
    case 'CLIENT':
      return [
        { label: 'Dashboard', href: '/cliente/dashboard', icon: <LayoutDashboard size={18} /> },
        { label: 'Demandas',  href: '/cliente/demandas',  icon: <FileText size={18} /> },
      ]
    default:
      return []
  }
}

export default function Sidebar({ role, userName, userEmail, pendingCount }: SidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItems(role, pendingCount)

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Administrador',
    LAWYER:     'Advogado',
    REVIEWER:   'Revisor',
    CLIENT:     'Cliente',
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-navy-800 bg-navy-900">
      {/* logo */}
      <div className="flex items-center gap-3 border-b border-navy-800 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500">
          <Scale size={18} className="text-navy-950" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Desk-yura</p>
          <p className="text-[10px] text-navy-400">{roleLabels[role]}</p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-navy-700 text-white font-medium'
                  : 'text-navy-400 hover:bg-navy-800 hover:text-white',
              )}
            >
              <span className={active ? 'text-gold-500' : ''}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1.5 text-[10px] font-bold text-navy-950">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* user + logout */}
      <div className="border-t border-navy-800 p-3 space-y-1">
        <Link
          href="/notificacoes"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-navy-400 hover:bg-navy-800 hover:text-white transition-colors"
        >
          <Bell size={18} />
          <span>Notificações</span>
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-[11px] text-navy-500">{userEmail}</p>
          </div>
          <button
            onClick={logout}
            className="shrink-0 text-navy-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
