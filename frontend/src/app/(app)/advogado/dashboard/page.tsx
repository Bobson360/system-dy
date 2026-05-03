'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText, Users, CreditCard, Clock,
  Plus, ArrowRight, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import api from '@/lib/api'
import { getMe } from '@/lib/auth'
import Topbar from '@/components/dashboard/Topbar'
import StatCard from '@/components/dashboard/StatCard'
import StatusBadge from '@/components/dashboard/StatusBadge'

export default function AdvogadoDashboard() {
  const [user, setUser] = useState<any>(null)
  const [demands, setDemands] = useState<any>({ data: [], total: 0 })
  const [clients, setClients] = useState<any>({ data: [], total: 0 })
  const [payments, setPayments] = useState<any>({ data: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMe(),
      api.get('/demands?page=1&limit=5'),
      api.get('/clients?page=1&limit=5'),
      api.get('/payments/my?page=1&limit=3'),
    ]).then(([me, dem, cli, pay]) => {
      setUser(me)
      setDemands(dem.data)
      setClients(cli.data)
      setPayments(pay.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const profile = user?.lawyerProfile
  const pendingDemands = demands.data.filter((d: any) => d.status === 'PENDING_REVIEW').length
  const overduePayment = payments.data.find((p: any) => p.status === 'OVERDUE')

  return (
    <div className="flex flex-col">
      <Topbar
        title={`Olá, ${user?.firstName} 👋`}
        subtitle={profile ? `OAB ${profile.oabNumber} • Plano ${profile.plan}` : ''}
        actions={
          <Link
            href="/advogado/demandas/nova"
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
          >
            <Plus size={16} />
            Nova demanda
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {/* alerta inadimplência */}
        {profile && !profile.isAdimplente && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <AlertTriangle size={20} className="shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Pagamento em atraso</p>
              <p className="text-xs text-red-400/70">Regularize para criar novas demandas.</p>
            </div>
            <Link href="/advogado/pagamentos" className="text-xs font-semibold text-red-400 underline">
              Ver pagamento
            </Link>
          </div>
        )}

        {/* stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Total de demandas"
            value={demands.total}
            subtitle={`${pendingDemands} aguardando revisão`}
            icon={<FileText size={20} />}
            color="blue"
          />
          <StatCard
            title="Clientes ativos"
            value={clients.total}
            icon={<Users size={20} />}
            color="purple"
          />
          <StatCard
            title="Plano atual"
            value={profile?.plan ?? '—'}
            subtitle={profile?.planExpiresAt
              ? `Vence em ${new Date(profile.planExpiresAt).toLocaleDateString('pt-BR')}`
              : ''}
            icon={<CreditCard size={20} />}
            color={profile?.isAdimplente ? 'green' : 'red'}
          />
          <StatCard
            title="Revisões pendentes"
            value={demands.data.filter((d: any) => d.status === 'PENDING_REVIEW').length}
            subtitle="Aguardando revisor"
            icon={<Clock size={20} />}
            color="gold"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          {/* demandas recentes */}
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 xl:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Demandas recentes</h3>
              <Link href="/advogado/demandas" className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {demands.data.length === 0 ? (
              <EmptyState
                icon={<FileText size={28} />}
                text="Nenhuma demanda ainda"
                action={{ label: 'Criar primeira demanda', href: '/advogado/demandas/nova' }}
              />
            ) : (
              <div className="space-y-2">
                {demands.data.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/advogado/demandas/${d.id}`}
                    className="flex items-center justify-between rounded-lg border border-navy-800 p-3 hover:border-navy-700 hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{d.title}</p>
                      <p className="text-xs text-navy-500">
                        {d.client?.user?.firstName} {d.client?.user?.lastName} •{' '}
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* clientes recentes */}
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Clientes</h3>
              <Link href="/advogado/clientes" className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            {clients.data.length === 0 ? (
              <EmptyState
                icon={<Users size={28} />}
                text="Nenhum cliente ainda"
                action={{ label: 'Cadastrar cliente', href: '/advogado/clientes/novo' }}
              />
            ) : (
              <div className="space-y-2">
                {clients.data.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-navy-800 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
                      {c.user?.firstName?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {c.user?.firstName} {c.user?.lastName}
                      </p>
                      <p className="truncate text-xs text-navy-500">{c.user?.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-navy-500">
                      {c._count?.demands ?? 0} dem.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: { label: string; href: string } }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="text-navy-600">{icon}</div>
      <p className="text-sm text-navy-500">{text}</p>
      {action && (
        <Link href={action.href} className="text-xs font-medium text-gold-500 hover:text-gold-400">
          {action.label} →
        </Link>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-navy-800 px-8 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-navy-800" />
      </div>
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 h-72 animate-pulse rounded-xl bg-navy-800" />
          <div className="col-span-2 h-72 animate-pulse rounded-xl bg-navy-800" />
        </div>
      </div>
    </div>
  )
}
