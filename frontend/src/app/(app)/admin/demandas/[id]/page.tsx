'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Bot, CheckCircle, XCircle, Clock, Zap, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'
import DocumentSection from '@/components/dashboard/DocumentSection'

interface Demand {
  id: string
  title: string
  body: string
  category: string
  status: string
  createdAt: string
  client: { id: string; user: { firstName: string; lastName: string; email: string } }
  lawyer: { user: { firstName: string; lastName: string; email: string } }
  aiAnalysis: {
    id: string
    model: string
    parsedSummary: string
    parsedRisks: string[]
    parsedActions: string[]
    confidence: number
    isPreliminary: boolean
    durationMs: number | null
    estimatedCostUsd: number | null
    promptTokens: number
    outputTokens: number
    createdAt: string
  } | null
  review: {
    id: string
    approved: boolean
    reviewNotes: string | null
    completedAt: string | null
    reviewer: { user: { firstName: string; lastName: string } } | null
  } | null
  statusLogs: { id: string; toStatus: string; reason: string | null; createdAt: string }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista', FAMILY: 'Família', CONSUMER: 'Consumidor',
}
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', ANALYZING: 'Analisando', PENDING_REVIEW: 'Aguardando revisão',
  REVIEWED: 'Revisado', REJECTED: 'Rejeitado', COMPLETED: 'Concluído',
}

export default function AdminDemandaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [demand, setDemand]       = useState<Demand | null>(null)
  const [loading, setLoading]     = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError]         = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/demands/${id}`)
      setDemand(data)
    } catch {
      setError('Demanda não encontrada.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleAnalyze() {
    setActionMsg('')
    setAnalyzing(true)
    try {
      await api.post(`/admin/demands/${id}/analyze`)
      setActionMsg('Análise de IA concluída. Demanda movida para revisão humana.')
      await load()
    } catch (err: any) {
      setActionMsg(err.response?.data?.message ?? 'Erro ao executar análise.')
    } finally {
      setAnalyzing(false)
    }
  }

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
        <div className="p-8"><p className="text-red-400">{error || 'Erro ao carregar.'}</p></div>
      </div>
    )
  }

  const canAnalyze = ['DRAFT', 'ANALYZING', 'PENDING_REVIEW'].includes(demand.status)

  return (
    <div className="flex flex-col">
      <Topbar
        title={demand.title}
        subtitle={`${CATEGORY_LABELS[demand.category] ?? demand.category} · ${new Date(demand.createdAt).toLocaleDateString('pt-BR')}`}
        actions={
          <div className="flex items-center gap-2">
            {canAnalyze && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                {analyzing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                {analyzing ? 'Analisando...' : 'Analisar com IA'}
              </button>
            )}
            <Link
              href="/admin/demandas"
              className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {actionMsg && (
          <p className="rounded-lg bg-blue-500/10 px-4 py-3 text-sm text-blue-300">{actionMsg}</p>
        )}

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

            {/* Documents */}
            <DocumentSection demandId={id} readOnly />

            {/* AI Analysis */}
            {demand.aiAnalysis ? (
              <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Bot size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white">Análise de IA</h3>
                  {demand.aiAnalysis.isPreliminary && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Preliminar</span>
                  )}
                </div>

                {/* Metrics */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Confiança" value={`${Math.round(demand.aiAnalysis.confidence * 100)}%`} />
                  <Metric label="Duração" value={demand.aiAnalysis.durationMs ? `${(demand.aiAnalysis.durationMs / 1000).toFixed(1)}s` : '—'} />
                  <Metric label="Custo estimado" value={demand.aiAnalysis.estimatedCostUsd != null ? `$${demand.aiAnalysis.estimatedCostUsd.toFixed(4)}` : '—'} />
                  <Metric label="Tokens" value={`${(demand.aiAnalysis.promptTokens + demand.aiAnalysis.outputTokens).toLocaleString()}`} />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-navy-400">Resumo</p>
                    <p className="text-sm leading-relaxed text-navy-200">{demand.aiAnalysis.parsedSummary}</p>
                  </div>
                  {demand.aiAnalysis.parsedRisks?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-navy-400">Riscos</p>
                      <ul className="space-y-1">
                        {demand.aiAnalysis.parsedRisks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-200">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {demand.aiAnalysis.parsedActions?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-navy-400">Ações recomendadas</p>
                      <ul className="space-y-1">
                        {demand.aiAnalysis.parsedActions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-200">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-navy-600">
                    Modelo: {demand.aiAnalysis.model} ·{' '}
                    {new Date(demand.aiAnalysis.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </section>
            ) : (
              <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
                <div className="flex items-center gap-3">
                  <Bot size={18} className="text-navy-600" />
                  <div>
                    <p className="text-sm font-medium text-white">Sem análise de IA</p>
                    <p className="text-xs text-navy-500">Clique em "Analisar com IA" para gerar uma análise preliminar.</p>
                  </div>
                </div>
              </section>
            )}

            {/* Review result */}
            {demand.review && (
              <section className={`rounded-xl border p-6 ${demand.review.approved ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="mb-3 flex items-center gap-2">
                  {demand.review.approved ? <CheckCircle size={18} className="text-green-400" /> : <XCircle size={18} className="text-red-400" />}
                  <h3 className="font-semibold text-white">{demand.review.approved ? 'Revisão aprovada' : 'Revisão rejeitada'}</h3>
                  {demand.review.reviewer && (
                    <span className="ml-auto text-xs text-navy-500">
                      {demand.review.reviewer.user.firstName} {demand.review.reviewer.user.lastName}
                    </span>
                  )}
                </div>
                {demand.review.reviewNotes && (
                  <p className="text-sm leading-relaxed text-navy-300">{demand.review.reviewNotes}</p>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-500">Partes</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-navy-500">Cliente</p>
                  <p className="text-sm font-medium text-white">{demand.client.user.firstName} {demand.client.user.lastName}</p>
                  <p className="text-xs text-navy-500">{demand.client.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500">Advogado</p>
                  <p className="text-sm font-medium text-white">{demand.lawyer.user.firstName} {demand.lawyer.user.lastName}</p>
                  <p className="text-xs text-navy-500">{demand.lawyer.user.email}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy-500">Histórico</h4>
              <ol className="relative border-l border-navy-700 pl-4">
                {demand.statusLogs.map((log) => (
                  <li key={log.id} className="pb-4">
                    <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-navy-900 bg-navy-600" />
                    <p className="text-xs font-medium text-white">{STATUS_LABELS[log.toStatus] ?? log.toStatus}</p>
                    <p className="text-xs text-navy-500">{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                    {log.reason && <p className="mt-0.5 text-xs text-navy-400">{log.reason}</p>}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-navy-900/80 border border-navy-700 px-3 py-2">
      <p className="text-xs text-navy-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}
