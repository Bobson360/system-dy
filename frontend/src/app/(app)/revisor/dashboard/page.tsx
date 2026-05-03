'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheck, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { getMe } from '@/lib/auth'
import Topbar from '@/components/dashboard/Topbar'
import StatCard from '@/components/dashboard/StatCard'
import StatusBadge from '@/components/dashboard/StatusBadge'

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor', CORPORATE: 'Empresarial',
  TAX: 'Tributário', REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}

export default function RevisorDashboard() {
  const [user, setUser] = useState<any>(null)
  const [queue, setQueue] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMe(), api.get('/review/queue?limit=6')]).then(([me, q]) => {
      setUser(me)
      setQueue(q.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const specialties = user?.reviewerProfile?.specialties ?? []

  return (
    <div className="flex flex-col">
      <Topbar
        title={`Olá, ${user?.firstName} 👋`}
        subtitle={specialties.length > 0
          ? `Especialidades: ${specialties.map((s: string) => CATEGORY_LABELS[s] ?? s).join(', ')}`
          : 'Revisor jurídico'}
        actions={
          <Link
            href="/revisor/fila"
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
          >
            <ClipboardCheck size={16} />
            Ver fila completa
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <StatCard
            title="Na fila agora"
            value={queue.total}
            subtitle="Demandas aguardando revisão"
            icon={<Clock size={20} />}
            color="gold"
          />
          <StatCard
            title="Disponíveis para você"
            value={queue.data.length}
            subtitle="Baseado nas suas especialidades"
            icon={<ClipboardCheck size={20} />}
            color="blue"
          />
          <StatCard
            title="Revisões concluídas"
            value="—"
            subtitle="Em breve"
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
        </div>

        {/* fila */}
        <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Demandas na fila
              {queue.total > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950">
                  {queue.total}
                </span>
              )}
            </h3>
            <Link href="/revisor/fila" className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          {queue.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 size={36} className="text-green-400" />
              <p className="text-sm text-navy-400">Fila vazia! Nenhuma demanda pendente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    {['Demanda', 'Categoria', 'Cliente', 'IA Confiança', 'Aguardando', ''].map((h) => (
                      <th key={h} className="pb-3 text-left text-xs font-medium text-navy-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {queue.data.map((d: any) => {
                    const days = Math.floor(
                      (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24),
                    )
                    const confidence = d.aiAnalysis?.confidence
                    return (
                      <tr key={d.id} className="hover:bg-navy-800/50">
                        <td className="py-3">
                          <p className="font-medium text-white line-clamp-1 max-w-[200px]">{d.title}</p>
                        </td>
                        <td className="py-3 text-navy-400">
                          {CATEGORY_LABELS[d.category] ?? d.category}
                        </td>
                        <td className="py-3 text-navy-400">
                          {d.client?.user?.firstName} {d.client?.user?.lastName}
                        </td>
                        <td className="py-3">
                          {confidence != null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-navy-800">
                                <div
                                  className="h-full rounded-full bg-gold-500"
                                  style={{ width: `${confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-navy-400">{Math.round(confidence * 100)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-navy-600">—</span>
                          )}
                        </td>
                        <td className="py-3 text-navy-400 text-xs">
                          {days === 0 ? 'Hoje' : `${days}d`}
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/revisor/fila/${d.id}`}
                            className="rounded-lg bg-gold-500/20 px-3 py-1 text-xs font-semibold text-gold-500 hover:bg-gold-500/30 transition-colors"
                          >
                            Revisar
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-navy-800 px-8 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-navy-800" />
      </div>
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-navy-800" />
      </div>
    </div>
  )
}
