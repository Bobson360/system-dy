'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, Clock, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Mail, Zap, Check,
} from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'

interface Charge {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  paidAt: string | null
  createdAt: string
  demand: { id: string; title: string; status: string }
  lawyer: { user: { firstName: string; lastName: string; email: string } }
}

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pendente',  cls: 'bg-amber-500/15 text-amber-400',  icon: <Clock size={11} /> },
  PAID:      { label: 'Pago',      cls: 'bg-green-500/15 text-green-400',  icon: <CheckCircle2 size={11} /> },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-500/15 text-red-400',      icon: <XCircle size={11} /> },
}

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'PAID', label: 'Pagos' },
  { value: 'CANCELLED', label: 'Cancelados' },
]

export default function AdminPagamentosPage() {
  const [charges, setCharges]     = useState<Charge[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [filter, setFilter]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [sending, setSending]     = useState<Record<string, boolean>>({})
  const [sent, setSent]           = useState<Record<string, boolean>>({})
  const limit = 20

  const load = useCallback(async (p = 1, f = filter) => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (f) qs.set('status', f)
      const { data } = await api.get(`/admin/charges?${qs}`)
      setCharges(data.data)
      setTotal(data.total)
      setPage(p)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao carregar cobranças.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load(1, filter) }, [filter])

  const totalPages = Math.ceil(total / limit)

  async function sendEmail(chargeId: string) {
    setSending((prev) => ({ ...prev, [chargeId]: true }))
    try {
      const { data } = await api.post(`/admin/charges/${chargeId}/send-email`)
      setSent((prev) => ({ ...prev, [chargeId]: true }))
      // Show briefly then reset
      setTimeout(() => setSent((prev) => ({ ...prev, [chargeId]: false })), 3000)
      if (data?.message) setError('')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao enviar e-mail.')
    } finally {
      setSending((prev) => ({ ...prev, [chargeId]: false }))
    }
  }

  const pendingTotal = charges.filter((c) => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0)
  const paidTotal    = charges.filter((c) => c.status === 'PAID').reduce((s, c) => s + c.amount, 0)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Cobranças de prioridade"
        subtitle={`${total} cobrança${total !== 1 ? 's' : ''} no total`}
        actions={
          <button
            onClick={() => load(1, filter)}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="flex-1 p-8 space-y-6">
        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {/* summary cards */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <SummaryCard
            label="Total cobranças"
            value={total}
            icon={<Zap size={16} className="text-amber-400" />}
            cls="border-amber-500/20 bg-amber-500/5"
          />
          <SummaryCard
            label="Pendentes"
            value={`R$ ${pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<Clock size={16} className="text-amber-400" />}
            cls="border-amber-500/20 bg-amber-500/5"
          />
          <SummaryCard
            label="Receita (nesta página)"
            value={`R$ ${paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<CreditCard size={16} className="text-green-400" />}
            cls="border-green-500/20 bg-green-500/5"
          />
          <SummaryCard
            label="Valor unitário"
            value="R$ 15,00"
            icon={<Zap size={16} className="text-gold-400" />}
            cls="border-gold-500/20 bg-gold-500/5"
          />
        </div>

        {/* filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-navy-700 text-white'
                  : 'text-navy-400 hover:bg-navy-800 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-navy-800" />)}
          </div>
        ) : charges.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <CreditCard size={48} className="text-navy-600" />
            <p className="text-lg font-semibold text-white">Nenhuma cobrança encontrada</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    {['Advogado', 'Demanda', 'Valor', 'Status', 'Data', ''].map((h) => (
                      <th key={h} className="px-5 pb-3 pt-4 text-left text-xs font-medium text-navy-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {charges.map((c) => {
                    const badge = STATUS_LABEL[c.status]
                    return (
                      <tr key={c.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-white">
                            {c.lawyer.user.firstName} {c.lawyer.user.lastName}
                          </p>
                          <p className="text-xs text-navy-500">{c.lawyer.user.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/demandas/${c.demand.id}`}
                            className="max-w-xs truncate text-navy-300 hover:text-gold-400 transition-colors block"
                          >
                            {c.demand.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-white">
                          R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                            {badge.icon}{badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-navy-500">
                          {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.status === 'PENDING' && (
                            <button
                              onClick={() => sendEmail(c.id)}
                              disabled={sending[c.id] || sent[c.id]}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                sent[c.id]
                                  ? 'bg-green-500/15 text-green-400'
                                  : 'bg-navy-700 text-navy-200 hover:bg-navy-600 hover:text-white'
                              }`}
                            >
                              {sent[c.id] ? (
                                <><Check size={12} /> Enviado</>
                              ) : (
                                <><Mail size={12} /> {sending[c.id] ? 'Enviando…' : 'Cobrar por e-mail'}</>
                              )}
                            </button>
                          )}
                          {c.status === 'PAID' && c.paidAt && (
                            <span className="text-xs text-navy-600">
                              {new Date(c.paidAt).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-navy-500">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => load(page - 1, filter)} disabled={page === 1}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => load(page + 1, filter)} disabled={page === totalPages}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon, cls }: { label: string; value: string | number; icon: React.ReactNode; cls: string }) {
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs text-navy-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
