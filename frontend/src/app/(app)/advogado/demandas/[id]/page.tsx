'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  ArrowLeft, Bot, CheckCircle, XCircle, Clock, AlertCircle,
  Send, RefreshCw, Pencil, Save, X, Zap, Ban, RotateCcw,
} from 'lucide-react'
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
  isPriority: boolean
  createdAt: string
  client: {
    id: string
    user: { id: string; firstName: string; lastName: string; email: string }
  }
  aiAnalysis: {
    id: string
    parsedSummary: string
    parsedRisks: string[]
    parsedActions: string[]
    confidence: number
    isPreliminary: boolean
    durationMs: number | null
    estimatedCostUsd: number | null
  } | null
  review: {
    id: string
    approved: boolean
    reviewNotes: string | null
    completedAt: string | null
    reviewer: { user: { firstName: string; lastName: string } } | null
  } | null
  statusLogs: {
    id: string
    fromStatus: string | null
    toStatus: string
    reason: string | null
    createdAt: string
  }[]
}

const editSchema = z.object({
  title:    z.string().min(5, 'Mínimo 5 caracteres'),
  body:     z.string().min(20, 'Mínimo 20 caracteres'),
  category: z.enum(['CIVIL', 'CRIMINAL', 'LABOR', 'FAMILY', 'CONSUMER', 'CORPORATE', 'TAX', 'REAL_ESTATE', 'OTHER']),
})
type EditForm = z.infer<typeof editSchema>

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista', FAMILY: 'Família',
  CONSUMER: 'Consumidor', CORPORATE: 'Empresarial', TAX: 'Tributário',
  REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', ANALYZING: 'Analisando', PENDING_REVIEW: 'Aguardando revisão',
  REVIEWED: 'Revisado', REJECTED: 'Rejeitado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado',
}

export default function DemandaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [demand, setDemand]           = useState<Demand | null>(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [editing, setEditing]         = useState(false)
  const [error, setError]             = useState('')
  const [actionError, setActionError] = useState('')
  const [showPriorityConfirm, setShowPriorityConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting: saving } } =
    useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/demands/${id}`)
      setDemand(data)
      reset({ title: data.title, body: data.body, category: data.category })
    } catch {
      setError('Demanda não encontrada.')
    } finally {
      setLoading(false)
    }
  }, [id, reset])

  useEffect(() => { load() }, [load])

  async function handleAction(endpoint: string, successMsg?: string) {
    setActionError('')
    setShowPriorityConfirm(false)
    try {
      await api.post(`/demands/${id}/${endpoint}`)
      if (successMsg) setActionError(successMsg) // reuse for success too
      await load()
    } catch (err: any) {
      setActionError(err.response?.data?.message ?? 'Erro ao executar ação.')
    }
  }

  async function onSave(data: EditForm) {
    setActionError('')
    try {
      await api.patch(`/demands/${id}`, data)
      setEditing(false)
      await load()
    } catch (err: any) {
      setActionError(err.response?.data?.message ?? 'Erro ao salvar alterações.')
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

  const canSubmit     = demand.status === 'DRAFT'
  const canCancel     = ['DRAFT', 'ANALYZING', 'PENDING_REVIEW'].includes(demand.status)
  const canReopen     = ['REJECTED', 'CANCELLED'].includes(demand.status)
  const canPrioritize = !demand.isPriority && ['DRAFT', 'ANALYZING', 'PENDING_REVIEW'].includes(demand.status)

  return (
    <div className="flex flex-col">
      <Topbar
        title={demand.title}
        subtitle={`${CATEGORY_LABELS[demand.category] ?? demand.category} · ${new Date(demand.createdAt).toLocaleDateString('pt-BR')}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canSubmit && (
              <button
                onClick={() => { setSubmitting(true); handleAction('submit').finally(() => setSubmitting(false)) }}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
              >
                {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Submetendo...' : 'Submeter para análise'}
              </button>
            )}
            {canPrioritize && (
              <button
                onClick={() => setShowPriorityConfirm(true)}
                className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                <Zap size={14} /> Priorizar
              </button>
            )}
            {canReopen && (
              <button
                onClick={() => handleAction('reopen')}
                className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition-colors"
              >
                <RotateCcw size={14} /> Reabrir
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => {
                  if (confirm('Confirmar cancelamento desta demanda?')) handleAction('cancel')
                }}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Ban size={14} /> Cancelar
              </button>
            )}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
              >
                <Pencil size={14} /> Editar
              </button>
            )}
            <Link
              href="/advogado/demandas"
              className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {/* Priority confirm banner */}
        {showPriorityConfirm && (
          <div className="flex items-center gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <Zap size={18} className="shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Análise prioritária</p>
              <p className="text-xs text-amber-400/80">Receba a análise em até 30 min pelo valor adicional de <strong className="text-amber-300">R$ 15,00</strong>. Deseja confirmar?</p>
            </div>
            <button
              onClick={() => handleAction('prioritize')}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-navy-950 hover:bg-amber-400 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => setShowPriorityConfirm(false)}
              className="rounded-lg border border-navy-700 px-3 py-2 text-xs text-navy-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {actionError && (
          <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{actionError}</p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Demand body / edit form */}
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
              {editing ? (
                <form onSubmit={handleSubmit(onSave)} className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Editar demanda</h3>
                    <button type="button" onClick={() => setEditing(false)} className="text-navy-500 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs text-navy-400">Título</label>
                      <input {...register('title')} className={inputCls} />
                      {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-navy-400">Categoria</label>
                      <select {...register('category')} className={selectCls}>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-navy-400">Descrição</label>
                    <textarea {...register('body')} rows={8} className={`${inputCls} resize-none`} />
                    {errors.body && <p className="text-xs text-red-400">{errors.body.message}</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
                    >
                      <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)}
                      className="rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <h3 className="font-semibold text-white">Descrição</h3>
                    {demand.isPriority && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <Zap size={10} /> Prioritária
                      </span>
                    )}
                    <div className="ml-auto">
                      <StatusBadge status={demand.status} />
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-300">{demand.body}</p>
                </>
              )}
            </section>

            {/* Documents */}
            <DocumentSection demandId={id} />

            {/* AI Analysis */}
            {demand.aiAnalysis ? (
              <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <Bot size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-white">Análise de IA</h3>
                  {demand.aiAnalysis.isPreliminary && (
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Preliminar</span>
                  )}
                  <span className="ml-auto text-xs text-navy-500">
                    Confiança {Math.round(demand.aiAnalysis.confidence * 100)}%
                    {demand.aiAnalysis.durationMs && ` · ${(demand.aiAnalysis.durationMs / 1000).toFixed(1)}s`}
                    {demand.aiAnalysis.estimatedCostUsd != null && ` · $${demand.aiAnalysis.estimatedCostUsd.toFixed(4)}`}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs font-medium text-navy-400">Resumo</p>
                    <p className="text-sm leading-relaxed text-navy-200">{demand.aiAnalysis.parsedSummary}</p>
                  </div>
                  {demand.aiAnalysis.parsedRisks?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-navy-400">Riscos identificados</p>
                      <ul className="space-y-1">
                        {demand.aiAnalysis.parsedRisks.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-navy-200">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                            {r}
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
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            ) : demand.status === 'ANALYZING' ? (
              <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="animate-spin text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Analisando com IA...</p>
                    <p className="text-xs text-navy-500">Aguarde alguns instantes.</p>
                  </div>
                </div>
              </section>
            ) : null}

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
                {demand.review.completedAt && (
                  <p className="mt-2 text-xs text-navy-500">{new Date(demand.review.completedAt).toLocaleString('pt-BR')}</p>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-500">Cliente</h4>
              <Link href={`/advogado/clientes/${demand.client.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">
                  {demand.client.user.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{demand.client.user.firstName} {demand.client.user.lastName}</p>
                  <p className="truncate text-xs text-navy-500">{demand.client.user.email}</p>
                </div>
              </Link>
            </section>

            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy-500">Histórico</h4>
              {demand.statusLogs.length === 0 ? (
                <p className="text-xs text-navy-600">Sem registros.</p>
              ) : (
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
              )}
            </section>

            {demand.status === 'DRAFT' && (
              <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-yellow-400" />
                  <p className="text-xs text-navy-300">
                    Rascunho. Edite conforme necessário e clique em <strong className="text-white">Submeter</strong> quando estiver pronto.
                  </p>
                </div>
              </section>
            )}

            {demand.status === 'PENDING_REVIEW' && (
              <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
                <div className="flex items-start gap-2">
                  <Clock size={15} className="mt-0.5 shrink-0 text-navy-400" />
                  <p className="text-xs text-navy-400">Aguardando revisão humana.</p>
                </div>
              </section>
            )}

            {demand.status === 'CANCELLED' && (
              <section className="rounded-xl border border-navy-700 bg-navy-900 p-5">
                <div className="flex items-start gap-2">
                  <Ban size={15} className="mt-0.5 shrink-0 text-navy-500" />
                  <p className="text-xs text-navy-400">
                    Demanda cancelada. Clique em <strong className="text-white">Reabrir</strong> para retomar como rascunho.
                  </p>
                </div>
              </section>
            )}

            {demand.status === 'REJECTED' && (
              <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex items-start gap-2">
                  <XCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                  <p className="text-xs text-navy-300">
                    Demanda rejeitada. Clique em <strong className="text-white">Reabrir</strong> para corrigir e resubmeter.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none'
const selectCls = 'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none'
