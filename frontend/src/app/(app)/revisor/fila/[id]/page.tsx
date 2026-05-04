'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import {
  ArrowLeft, Bot, CheckCircle, XCircle, UserCheck,
  Pencil, RefreshCw, AlertCircle,
} from 'lucide-react'
import api from '@/lib/api'
import { getMe } from '@/lib/auth'
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
  lawyer: { user: { firstName: string; lastName: string } }
  aiAnalysis: {
    parsedSummary: string
    parsedRisks: string[]
    parsedActions: string[]
    confidence: number
    durationMs: number | null
    estimatedCostUsd: number | null
  } | null
  review: {
    id: string
    approved: boolean
    reviewNotes: string | null
    editedSummary: string | null
    editedRisks: string[]
    editedActions: string[]
    completedAt: string | null
    reviewer: { user: { firstName: string; lastName: string } } | null
  } | null
  statusLogs: { id: string; toStatus: string; reason: string | null; createdAt: string }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor', CORPORATE: 'Empresarial',
  TAX: 'Tributário', REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', ANALYZING: 'Analisando', PENDING_REVIEW: 'Aguardando revisão',
  REVIEWED: 'Revisado', REJECTED: 'Rejeitado', COMPLETED: 'Concluído',
}

export default function ReviewDemandPage() {
  const { id } = useParams<{ id: string }>()
  const [demand, setDemand]     = useState<Demand | null>(null)
  const [me, setMe]             = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingAi, setEditingAi] = useState(false)
  const [error, setError]       = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // form for the actual review submission
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<{
    editedSummary: string
    editedRisks: string
    editedActions: string
    reviewNotes: string
  }>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: demand }, me] = await Promise.all([
        api.get(`/demands/${id}`),
        getMe(),
      ])
      setDemand(demand)
      setMe(me)
      // Pre-fill form with AI data
      if (demand.aiAnalysis) {
        reset({
          editedSummary: demand.review?.editedSummary ?? demand.aiAnalysis.parsedSummary ?? '',
          editedRisks: (demand.review?.editedRisks?.length
            ? demand.review.editedRisks
            : demand.aiAnalysis.parsedRisks
          ).join('\n'),
          editedActions: (demand.review?.editedActions?.length
            ? demand.review.editedActions
            : demand.aiAnalysis.parsedActions
          ).join('\n'),
          reviewNotes: demand.review?.reviewNotes ?? '',
        })
      }
    } catch {
      setError('Demanda não encontrada.')
    } finally {
      setLoading(false)
    }
  }, [id, reset])

  useEffect(() => { load() }, [load])

  async function handleAssign() {
    setError('')
    setAssigning(true)
    try {
      await api.post(`/review/${id}/assign`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao assumir demanda.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleSubmitReview(approved: boolean) {
    setError('')
    setSubmitting(true)
    const values = watch()
    const payload = {
      approved,
      reviewNotes: values.reviewNotes || undefined,
      editedSummary: values.editedSummary || undefined,
      editedRisks: values.editedRisks
        ? values.editedRisks.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined,
      editedActions: values.editedActions
        ? values.editedActions.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined,
    }
    try {
      await api.post(`/review/${id}/submit`, payload)
      setSuccessMsg(approved ? 'Revisão aprovada com sucesso.' : 'Demanda rejeitada.')
      await load()
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao concluir revisão.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <Topbar title="Carregando..." />
        <div className="space-y-4 p-8">
          <div className="h-32 animate-pulse rounded-xl bg-navy-800" />
          <div className="h-64 animate-pulse rounded-xl bg-navy-800" />
        </div>
      </div>
    )
  }

  if (error && !demand) {
    return (
      <div className="flex flex-col">
        <Topbar title="Revisão" />
        <div className="p-8"><p className="text-red-400">{error}</p></div>
      </div>
    )
  }

  if (!demand) return null

  const review = demand.review
  const isAssigned = !!review
  const isCompleted = !!review?.completedAt
  const myReviewerProfileId = me?.reviewerProfile?.id
  const isMyReview = review?.reviewer?.user && (
    `${me?.firstName} ${me?.lastName}` ===
    `${review.reviewer.user.firstName} ${review.reviewer.user.lastName}`
  )
  const canEdit = isAssigned && !isCompleted

  return (
    <div className="flex flex-col">
      <Topbar
        title={demand.title}
        subtitle={`${CATEGORY_LABELS[demand.category] ?? demand.category} · ${new Date(demand.createdAt).toLocaleDateString('pt-BR')}`}
        actions={
          <Link
            href="/revisor/fila"
            className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar à fila
          </Link>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}
        {successMsg && (
          <p className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-400">{successMsg}</p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">

            {/* Demand body */}
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Descrição da demanda</h3>
                <StatusBadge status={demand.status} />
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy-300">{demand.body}</p>
            </section>

            {/* Documents */}
            <DocumentSection demandId={id} readOnly />

            {/* Assign CTA */}
            {!isAssigned && demand.status === 'PENDING_REVIEW' && (
              <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <UserCheck size={36} className="text-gold-500" />
                  <div>
                    <p className="font-semibold text-white">Esta demanda precisa de um revisor</p>
                    <p className="mt-1 text-sm text-navy-400">Ao assumir, você se torna responsável por validar a análise de IA.</p>
                  </div>
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className="flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
                  >
                    {assigning ? <RefreshCw size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    {assigning ? 'Assumindo...' : 'Assumir esta revisão'}
                  </button>
                </div>
              </section>
            )}

            {/* AI Analysis with editable fields */}
            {demand.aiAnalysis && (
              <section className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-blue-400" />
                    <h3 className="font-semibold text-white">Análise de IA</h3>
                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Preliminar</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-navy-500">
                      Confiança {Math.round(demand.aiAnalysis.confidence * 100)}%
                      {demand.aiAnalysis.durationMs ? ` · ${(demand.aiAnalysis.durationMs / 1000).toFixed(1)}s` : ''}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => setEditingAi((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Pencil size={12} /> {editingAi ? 'Ver original' : 'Editar'}
                      </button>
                    )}
                  </div>
                </div>

                {editingAi && canEdit ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-navy-400">Resumo</label>
                      <textarea
                        {...register('editedSummary')}
                        rows={5}
                        className={areaCls}
                        placeholder="Edite o resumo da análise..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-navy-400">
                        Riscos <span className="text-navy-600">(um por linha)</span>
                      </label>
                      <textarea
                        {...register('editedRisks')}
                        rows={4}
                        className={areaCls}
                        placeholder="Risco 1&#10;Risco 2&#10;..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-navy-400">
                        Ações recomendadas <span className="text-navy-600">(uma por linha)</span>
                      </label>
                      <textarea
                        {...register('editedActions')}
                        rows={4}
                        className={areaCls}
                        placeholder="Ação 1&#10;Ação 2&#10;..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 text-xs font-medium text-navy-400">Resumo</p>
                      <p className="text-sm leading-relaxed text-navy-200">
                        {review?.editedSummary ?? demand.aiAnalysis.parsedSummary}
                      </p>
                    </div>
                    {(review?.editedRisks?.length ? review.editedRisks : demand.aiAnalysis.parsedRisks)?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-navy-400">Riscos</p>
                        <ul className="space-y-1">
                          {(review?.editedRisks?.length ? review.editedRisks : demand.aiAnalysis.parsedRisks).map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-navy-200">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(review?.editedActions?.length ? review.editedActions : demand.aiAnalysis.parsedActions)?.length > 0 && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-navy-400">Ações recomendadas</p>
                        <ul className="space-y-1">
                          {(review?.editedActions?.length ? review.editedActions : demand.aiAnalysis.parsedActions).map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-navy-200">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* No AI analysis warning */}
            {!demand.aiAnalysis && demand.status === 'PENDING_REVIEW' && (
              <section className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-yellow-400" />
                  <p className="text-xs text-navy-300">
                    Esta demanda não possui análise de IA. Você pode revisá-la diretamente.
                  </p>
                </div>
              </section>
            )}

            {/* Review form — only if assigned and not completed */}
            {canEdit && (
              <section className="rounded-xl border border-navy-700 bg-navy-900 p-6">
                <h3 className="mb-4 font-semibold text-white">Parecer do revisor</h3>
                <div className="mb-6">
                  <label className="mb-1 block text-xs font-medium text-navy-400">
                    Notas da revisão <span className="text-navy-600">(opcional)</span>
                  </label>
                  <textarea
                    {...register('reviewNotes')}
                    rows={4}
                    className={areaCls}
                    placeholder="Observações, justificativa de aprovação ou rejeição, orientações ao advogado..."
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => handleSubmitReview(true)}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                    Aprovar análise
                  </button>
                  <button
                    onClick={() => handleSubmitReview(false)}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60 transition-colors"
                  >
                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={16} />}
                    Rejeitar demanda
                  </button>
                </div>
              </section>
            )}

            {/* Completed review result */}
            {isCompleted && review && (
              <section className={`rounded-xl border p-6 ${review.approved ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="mb-3 flex items-center gap-2">
                  {review.approved
                    ? <CheckCircle size={18} className="text-green-400" />
                    : <XCircle size={18} className="text-red-400" />}
                  <h3 className="font-semibold text-white">
                    {review.approved ? 'Revisão concluída — Aprovada' : 'Revisão concluída — Rejeitada'}
                  </h3>
                </div>
                {review.reviewNotes && (
                  <p className="text-sm leading-relaxed text-navy-300">{review.reviewNotes}</p>
                )}
                {review.completedAt && (
                  <p className="mt-2 text-xs text-navy-500">
                    Concluída em {new Date(review.completedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Review status */}
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-500">Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-400">Demanda</span>
                  <StatusBadge status={demand.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-navy-400">Revisor</span>
                  {review?.reviewer ? (
                    <span className="text-xs text-white">
                      {review.reviewer.user.firstName} {review.reviewer.user.lastName}
                    </span>
                  ) : review ? (
                    <span className="text-xs text-navy-400">Admin</span>
                  ) : (
                    <span className="text-xs text-navy-600">Não atribuído</span>
                  )}
                </div>
              </div>
            </section>

            {/* Parties */}
            <section className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-500">Partes</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-navy-500">Cliente</p>
                  <p className="text-sm font-medium text-white">
                    {demand.client.user.firstName} {demand.client.user.lastName}
                  </p>
                  <p className="text-xs text-navy-500">{demand.client.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500">Advogado</p>
                  <p className="text-sm font-medium text-white">
                    {demand.lawyer.user.firstName} {demand.lawyer.user.lastName}
                  </p>
                </div>
              </div>
            </section>

            {/* Timeline */}
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

const areaCls = 'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-600 focus:border-gold-500 focus:outline-none resize-none'
