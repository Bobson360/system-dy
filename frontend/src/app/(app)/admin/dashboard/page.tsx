'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, FileText, CreditCard, AlertTriangle,
  UserCheck, TrendingUp, CheckCircle2, Bot, Zap, DollarSign,
} from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatCard from '@/components/dashboard/StatCard'
import StatusBadge from '@/components/dashboard/StatusBadge'

interface AiStats {
  totalAnalyses: number
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  avgDurationMs: number
  avgConfidence: number
}

interface DashboardData {
  users: {
    total: number
    lawyers: number
    clients: number
    activeLawyers: number
    delinquentLawyers: number
  }
  demands: {
    total: number
    byStatus: Record<string, number>
  }
  payments: {
    recentPayments: any[]
    monthlyRevenue: number
  }
  ai: AiStats
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/pending-approvals'),
    ]).then(([dash, pend]) => {
      setData(dash.data)
      setPending(pend.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const d = data!
  const pendingReview = d.demands.byStatus['PENDING_REVIEW'] ?? 0
  const totalDemands  = d.demands.total

  return (
    <div className="flex flex-col">
      <Topbar
        title="Dashboard"
        subtitle="Visão geral da plataforma"
        actions={
          <span className="text-xs text-navy-500">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            title="Total de advogados"
            value={d.users.lawyers}
            subtitle={`${d.users.activeLawyers} ativos`}
            icon={<Users size={20} />}
            color="blue"
          />
          <StatCard
            title="Total de clientes"
            value={d.users.clients}
            icon={<UserCheck size={20} />}
            color="purple"
          />
          <StatCard
            title="Demandas na plataforma"
            value={totalDemands}
            subtitle={`${pendingReview} aguardando revisão`}
            icon={<FileText size={20} />}
            color="gold"
          />
          <StatCard
            title="Receita do mês"
            value={`R$ ${(d.payments.monthlyRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitle={`${d.users.delinquentLawyers} inadimplentes`}
            icon={<CreditCard size={20} />}
            color={d.users.delinquentLawyers > 0 ? 'red' : 'green'}
          />
        </div>

        {/* AI Stats */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Bot size={16} className="text-blue-400" /> Análises de IA
            </h3>
            <Link href="/admin/demandas" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver demandas →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <AiMetric
              icon={<Zap size={14} className="text-blue-400" />}
              label="Total análises"
              value={String(d.ai.totalAnalyses)}
            />
            <AiMetric
              icon={<DollarSign size={14} className="text-green-400" />}
              label="Custo total"
              value={`$${d.ai.totalCostUsd.toFixed(4)}`}
            />
            <AiMetric
              icon={<TrendingUp size={14} className="text-gold-400" />}
              label="Confiança média"
              value={`${Math.round(d.ai.avgConfidence * 100)}%`}
            />
            <AiMetric
              icon={<Bot size={14} className="text-blue-400" />}
              label="Tempo médio"
              value={d.ai.avgDurationMs ? `${(d.ai.avgDurationMs / 1000).toFixed(1)}s` : '—'}
            />
            <AiMetric
              icon={<FileText size={14} className="text-navy-400" />}
              label="Tokens entrada"
              value={d.ai.totalInputTokens.toLocaleString()}
            />
            <AiMetric
              icon={<FileText size={14} className="text-navy-400" />}
              label="Tokens saída"
              value={d.ai.totalOutputTokens.toLocaleString()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* demandas por status */}
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 xl:col-span-1">
            <h3 className="mb-4 text-sm font-semibold text-white">Demandas por status</h3>
            {totalDemands === 0 ? (
              <p className="text-sm text-navy-500">Nenhuma demanda ainda.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(d.demands.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <StatusBadge status={status} />
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-navy-800">
                        <div
                          className="h-full rounded-full bg-gold-500"
                          style={{ width: `${(count / totalDemands) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-sm font-medium text-white">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* aprovações pendentes */}
          <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Aprovações pendentes</h3>
              {pending.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={32} className="text-green-400" />
                <p className="text-sm text-navy-400">Nenhuma aprovação pendente</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-navy-700 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">
                        {u.firstName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-navy-500">{u.email}</p>
                        {u.lawyerProfile && (
                          <p className="text-xs text-navy-500">{u.lawyerProfile.oabNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ApproveButton userId={u.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* pagamentos recentes */}
        <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Pagamentos recentes</h3>
          {d.payments.recentPayments.length === 0 ? (
            <p className="text-sm text-navy-500">Nenhum pagamento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    <th className="pb-3 text-left text-xs font-medium text-navy-500">Advogado</th>
                    <th className="pb-3 text-left text-xs font-medium text-navy-500">Plano</th>
                    <th className="pb-3 text-left text-xs font-medium text-navy-500">Valor</th>
                    <th className="pb-3 text-left text-xs font-medium text-navy-500">Vencimento</th>
                    <th className="pb-3 text-left text-xs font-medium text-navy-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {d.payments.recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-navy-800/50">
                      <td className="py-3 text-white">
                        {p.lawyer?.user?.firstName} {p.lawyer?.user?.lastName}
                      </td>
                      <td className="py-3 text-navy-400">{p.plan}</td>
                      <td className="py-3 text-white">
                        R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-navy-400">
                        {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* alertas */}
        {d.users.delinquentLawyers > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <AlertTriangle size={20} className="shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">
                {d.users.delinquentLawyers} advogado{d.users.delinquentLawyers > 1 ? 's' : ''} inadimplente{d.users.delinquentLawyers > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-400/70">
                Acesse o menu Inadimplentes para gerenciar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AiMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-navy-700/50 bg-navy-900/60 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5">{icon}<span className="text-xs text-navy-400">{label}</span></div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function ApproveButton({ userId }: { userId: string }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function approve() {
    setLoading(true)
    await api.post(`/admin/users/${userId}/approve`)
    setDone(true)
  }

  if (done) return <span className="text-xs text-green-400">✓ Aprovado</span>
  return (
    <button
      onClick={approve}
      disabled={loading}
      className="rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Aprovar'}
    </button>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-navy-800 px-8 py-4">
        <div className="h-6 w-40 animate-pulse rounded bg-navy-800" />
      </div>
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-navy-800" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 animate-pulse rounded-xl bg-navy-800" />
          <div className="col-span-2 h-64 animate-pulse rounded-xl bg-navy-800" />
        </div>
      </div>
    </div>
  )
}
