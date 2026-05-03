'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'

interface Demand {
  id: string
  title: string
  body: string
  category: string
  status: string
  createdAt: string
  aiAnalysis: {
    id: string
    summary: string
    recommendation: string
    confidence: number
    isPreliminary: boolean
    createdAt: string
  } | null
  review: {
    id: string
    approved: boolean
    notes: string | null
    completedAt: string | null
    reviewer: { user: { firstName: string; lastName: string } } | null
  } | null
  statusLogs: {
    id: string
    toStatus: string
    createdAt: string
  }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  LABOR: 'Trabalhista',
  FAMILY: 'Família',
  CONSUMER: 'Consumidor',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  ANALYZING: 'Analisando',
  PENDING_REVIEW: 'Em revisão',
  REVIEWED: 'Revisado',
  REJECTED: 'Rejeitado',
  COMPLETED: 'Concluído',
}

export default function ClienteDemandaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [demand, setDemand] = useState<Demand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/demands/${id}`)
      setDemand(data)
    } catch {
      setError('Demanda não encontrada.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex flex-col">
        <Topbar title="Carregando..." />
        <div className="space-y-4 p-8">
          <div className="h-32 animate-pulse rounded-xl bg-navy-800" />
          <div className="h-48 animate-pulse rounded-xl bg-navy-800" />
        </div>
      </div>
    )
  }

  if (error || !demand) {
    return (
      <div className="flex flex-col">
        <Topbar title="Demanda" />
        <div className="p-8">
          <p className="text-red-400">{error || 'Erro ao carregar demanda.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Topbar
        title={demand.title}
        subtitle={`${CATEGORY_LABELS[demand.category] ?? demand.category} · ${new Date(demand.createdAt).toLocaleDateString('pt-BR')}`}
        actions={
          <Link
            href="/cliente/demandas"
            className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Demand body */}
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Descrição</h3>
                <StatusBadge status={demand.status} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-300">{demand.body}</p>
            </section>

            {/* AI Analysis — only show if not preliminary or if review is done */}
            {demand.aiAnalysis && demand.review?.approved && (
              <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Bot size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white">Análise jurídica</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-navy-400">Resumo</p>
                    <p className="text-sm leading-relaxed text-navy-200">{demand.aiAnalysis.summary}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-navy-400">Recomendação</p>
                    <p className="text-sm leading-relaxed text-navy-200">{demand.aiAnalysis.recommendation}</p>
                  </div>
                </div>
              </section>
            )}

            {/* Review result */}
            {demand.review && (
              <section
                className={`rounded-xl border p-6 ${
                  demand.review.approved
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  {demand.review.approved ? (
                    <CheckCircle size={18} className="text-green-400" />
                  ) : (
                    <XCircle size={18} className="text-red-400" />
                  )}
                  <h3 className="font-semibold text-white">
                    {demand.review.approved ? 'Análise aprovada' : 'Demanda rejeitada'}
                  </h3>
                </div>
                {demand.review.notes && (
                  <p className="text-sm leading-relaxed text-navy-300">{demand.review.notes}</p>
                )}
                {demand.review.completedAt && (
                  <p className="mt-2 text-xs text-navy-500">
                    {new Date(demand.review.completedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </section>
            )}

            {/* Analyzing state */}
            {(demand.status === 'ANALYZING' || demand.status === 'PENDING_REVIEW') && (
              <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
                <div className="flex items-center gap-3">
                  {demand.status === 'ANALYZING' ? (
                    <RefreshCw size={18} className="animate-spin text-blue-400" />
                  ) : (
                    <Clock size={18} className="text-yellow-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {demand.status === 'ANALYZING'
                        ? 'Análise em andamento...'
                        : 'Aguardando revisão humana'}
                    </p>
                    <p className="text-xs text-navy-500">
                      {demand.status === 'ANALYZING'
                        ? 'Sua demanda está sendo analisada por IA.'
                        : 'Um revisor jurídico irá validar a análise.'}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar: timeline */}
          <div>
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy-500">
                Histórico
              </h4>
              {demand.statusLogs.length === 0 ? (
                <p className="text-xs text-navy-600">Sem registros.</p>
              ) : (
                <ol className="relative border-l border-navy-700 pl-4">
                  {demand.statusLogs.map((log) => (
                    <li key={log.id} className="pb-4">
                      <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-navy-900 bg-navy-600" />
                      <p className="text-xs font-medium text-white">
                        {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                      </p>
                      <p className="text-xs text-navy-500">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
