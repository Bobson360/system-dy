'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import api from '@/lib/api'
import { getMe } from '@/lib/auth'
import Topbar from '@/components/dashboard/Topbar'
import StatCard from '@/components/dashboard/StatCard'
import StatusBadge from '@/components/dashboard/StatusBadge'

const STATUS_ORDER = ['DRAFT','ANALYZING','PENDING_REVIEW','REVIEWED','COMPLETED','REJECTED']

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null)
  const [demands, setDemands] = useState<any>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMe(), api.get('/demands?limit=10')]).then(([me, dem]) => {
      setUser(me)
      setDemands(dem.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const concluded = demands.data.filter((d: any) => ['REVIEWED','COMPLETED'].includes(d.status)).length
  const inProgress = demands.data.filter((d: any) => ['ANALYZING','PENDING_REVIEW'].includes(d.status)).length

  return (
    <div className="flex flex-col">
      <Topbar
        title={`Olá, ${user?.firstName} 👋`}
        subtitle="Acompanhe suas demandas jurídicas"
      />

      <div className="flex-1 space-y-6 p-8">
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Total de demandas"
            value={demands.total}
            icon={<FileText size={20} />}
            color="blue"
          />
          <StatCard
            title="Em andamento"
            value={inProgress}
            subtitle="Análise ou revisão"
            icon={<Clock size={20} />}
            color="gold"
          />
          <StatCard
            title="Concluídas"
            value={concluded}
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
        </div>

        <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Minhas demandas</h3>
            <Link href="/cliente/demandas" className="flex items-center gap-1 text-xs text-gold-500 hover:text-gold-400">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          {demands.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FileText size={36} className="text-navy-600" />
              <p className="text-sm text-navy-400">Nenhuma demanda ainda.</p>
              <p className="text-xs text-navy-600">Seu advogado abrirá demandas em seu nome.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {demands.data.map((d: any) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-navy-800 p-4 hover:border-navy-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{d.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-navy-500">
                      <span>{d.category}</span>
                      <span>•</span>
                      <span>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* progress steps */}
                  <div className="mx-6 hidden items-center gap-1 xl:flex">
                    {STATUS_ORDER.slice(0, 5).map((s, i) => {
                      const currentIdx = STATUS_ORDER.indexOf(d.status)
                      const done = i < currentIdx
                      const active = i === currentIdx
                      return (
                        <div key={s} className="flex items-center">
                          <div className={`h-2 w-2 rounded-full ${
                            active ? 'bg-gold-500 ring-2 ring-gold-500/30' :
                            done  ? 'bg-green-500' : 'bg-navy-700'
                          }`} />
                          {i < 4 && <div className={`h-px w-4 ${done ? 'bg-green-500' : 'bg-navy-700'}`} />}
                        </div>
                      )
                    })}
                  </div>

                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* info box */}
        <div className="rounded-xl border border-navy-700 bg-navy-900 p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Como funciona</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            {[
              { step: '1', title: 'Demanda aberta', desc: 'Seu advogado registra a demanda.' },
              { step: '2', title: 'Análise por IA', desc: 'IA gera um parecer preliminar.' },
              { step: '3', title: 'Revisão humana', desc: 'Especialista valida o parecer.' },
              { step: '4', title: 'Resultado', desc: 'Você acompanha o resultado final.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-xs font-bold text-gold-500">
                  {item.step}
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{item.title}</p>
                  <p className="text-xs text-navy-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
