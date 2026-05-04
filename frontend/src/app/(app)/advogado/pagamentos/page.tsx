'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, Clock, XCircle, RefreshCw,
  ChevronLeft, ChevronRight, Zap, Copy, Check, X,
} from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'

interface Charge {
  id: string
  amount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  pixCode: string | null
  paidAt: string | null
  createdAt: string
  demand: { id: string; title: string; status: string }
}

const STATUS_LABEL: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'Pendente',  cls: 'bg-amber-500/15 text-amber-400',  icon: <Clock size={11} /> },
  PAID:      { label: 'Pago',      cls: 'bg-green-500/15 text-green-400',  icon: <CheckCircle2 size={11} /> },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-500/15 text-red-400',      icon: <XCircle size={11} /> },
}

export default function AdvogadoPagamentosPage() {
  const [charges, setCharges]     = useState<Charge[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [pixOpen, setPixOpen]     = useState(false)
  const [paying, setPaying]       = useState(false)
  const [copied, setCopied]       = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const limit = 20

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/payments/charges?page=${p}&limit=${limit}`)
      setCharges(data.data)
      setTotal(data.total)
      setPage(p)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao carregar cobranças.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const totalPages   = Math.ceil(total / limit)
  const pendingItems = charges.filter((c) => c.status === 'PENDING')
  const pendingAmt   = pendingItems
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.amount, 0)

  function toggleAll() {
    const pendingIds = pendingItems.map((c) => c.id)
    if (pendingIds.every((id) => selected.has(id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingIds))
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function copyPix() {
    await navigator.clipboard.writeText('pix@deskyura.com.br').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function confirmPayment() {
    if (selected.size === 0) return
    setPaying(true)
    try {
      await api.post('/payments/charges/pay-pix', { chargeIds: Array.from(selected) })
      setPaySuccess(true)
      setTimeout(() => {
        setPaySuccess(false)
        setPixOpen(false)
        setSelected(new Set())
        load(page)
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao registrar pagamento.')
      setPixOpen(false)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="flex flex-col">
      <Topbar
        title="Pagamentos"
        subtitle={`${total} cobrança${total !== 1 ? 's' : ''} de prioridade`}
        actions={
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button
                onClick={() => setPixOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
              >
                <Zap size={14} />
                Pagar {selected.size} via PIX · R$ {pendingAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </button>
            )}
            <button
              onClick={() => load(1)}
              className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="flex-1 p-8 space-y-6">
        {error && (
          <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <Zap size={16} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-white">Cobranças de análise prioritária</p>
              <p className="mt-0.5 text-xs text-navy-400">
                Cada priorização de demanda gera uma cobrança de R$ 15,00. Selecione as pendentes e pague via PIX em lote.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-navy-800" />)}
          </div>
        ) : charges.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <CreditCard size={48} className="text-navy-600" />
            <p className="text-lg font-semibold text-white">Nenhuma cobrança ainda</p>
            <p className="text-sm text-navy-400">As cobranças aparecem aqui ao priorizar uma demanda.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    <th className="px-4 pb-3 pt-4 text-left">
                      <input
                        type="checkbox"
                        checked={pendingItems.length > 0 && pendingItems.every((c) => selected.has(c.id))}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-navy-600 bg-navy-800 accent-gold-500"
                      />
                    </th>
                    {['Demanda', 'Valor', 'Status', 'Data', ''].map((h) => (
                      <th key={h} className="px-4 pb-3 pt-4 text-left text-xs font-medium text-navy-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {charges.map((c) => {
                    const badge = STATUS_LABEL[c.status]
                    return (
                      <tr key={c.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="px-4 py-3">
                          {c.status === 'PENDING' ? (
                            <input
                              type="checkbox"
                              checked={selected.has(c.id)}
                              onChange={() => toggle(c.id)}
                              className="h-4 w-4 rounded border-navy-600 bg-navy-800 accent-gold-500"
                            />
                          ) : <span className="block w-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/advogado/demandas/${c.demand.id}`}
                            className="max-w-xs truncate font-medium text-white hover:text-gold-400 transition-colors block"
                          >
                            {c.demand.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-white font-medium">
                          R$ {c.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                            {badge.icon}{badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-navy-500">
                          {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'PAID' && c.paidAt && (
                            <span className="text-xs text-navy-500">
                              pago em {new Date(c.paidAt).toLocaleDateString('pt-BR')}
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
                  <button onClick={() => load(page - 1)} disabled={page === 1}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => load(page + 1)} disabled={page === totalPages}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* PIX payment modal */}
      {pixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-900 p-6 shadow-2xl">
            <button
              onClick={() => { setPixOpen(false); setPaySuccess(false) }}
              className="absolute right-4 top-4 text-navy-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {paySuccess ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <p className="text-lg font-semibold text-white">Pagamento confirmado!</p>
                <p className="text-center text-sm text-navy-400">
                  {selected.size} cobrança{selected.size !== 1 ? 's' : ''} marcada{selected.size !== 1 ? 's' : ''} como paga{selected.size !== 1 ? 's' : ''}.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h2 className="text-base font-bold text-white">Pagamento via PIX</h2>
                  <p className="mt-1 text-xs text-navy-400">
                    {selected.size} cobrança{selected.size !== 1 ? 's' : ''} · R$ {pendingAmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Mock QR placeholder */}
                <div className="mb-4 flex aspect-square w-full max-w-[180px] mx-auto items-center justify-center rounded-xl border border-navy-700 bg-navy-800">
                  <div className="grid grid-cols-5 gap-1 p-4 opacity-30">
                    {[...Array(25)].map((_, i) => (
                      <div key={i} className={`h-4 w-4 rounded-sm ${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>

                <p className="mb-2 text-xs text-navy-400 text-center">ou copie a chave PIX</p>

                <div className="mb-5 flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2.5">
                  <span className="flex-1 truncate text-sm font-mono text-white">pix@deskyura.com.br</span>
                  <button
                    onClick={copyPix}
                    className="shrink-0 text-navy-400 hover:text-gold-400 transition-colors"
                    title="Copiar chave PIX"
                  >
                    {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                  </button>
                </div>

                <button
                  onClick={confirmPayment}
                  disabled={paying}
                  className="w-full rounded-xl bg-green-500 py-3 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  {paying ? 'Registrando…' : 'Confirmar pagamento efetuado'}
                </button>
                <p className="mt-2 text-center text-[11px] text-navy-600">
                  Ambiente de demonstração — nenhum valor real será cobrado.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
