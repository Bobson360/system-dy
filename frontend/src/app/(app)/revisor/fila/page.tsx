'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ClipboardCheck, CheckCircle2, RefreshCw, ChevronLeft, ChevronRight, Bot } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'

interface QueueItem {
  id: string
  title: string
  category: string
  status: string
  updatedAt: string
  client: { user: { firstName: string; lastName: string } }
  lawyer: { user: { firstName: string; lastName: string } }
  aiAnalysis: { confidence: number } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor', CORPORATE: 'Empresarial',
  TAX: 'Tributário', REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}

function waitingLabel(updatedAt: string) {
  const h = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 36e5)
  if (h < 1) return 'Agora'
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function FilaPage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/review/queue?page=${p}&limit=${limit}`)
      setItems(data.data)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Fila de revisão"
        subtitle={`${total} demanda${total !== 1 ? 's' : ''} aguardando revisão`}
        actions={
          <button
            onClick={() => load(1)}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="flex-1 p-8">
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-navy-800" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <CheckCircle2 size={56} className="text-green-400" />
            <p className="text-lg font-semibold text-white">Fila vazia!</p>
            <p className="text-sm text-navy-400">Nenhuma demanda aguarda revisão no momento.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    {['Demanda', 'Categoria', 'Cliente', 'Advogado', 'IA', 'Aguardando', ''].map((h) => (
                      <th key={h} className="px-5 pb-3 pt-4 text-left text-xs font-medium text-navy-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="max-w-xs truncate font-medium text-white">{d.title}</p>
                      </td>
                      <td className="px-5 py-3.5 text-navy-400">
                        {CATEGORY_LABELS[d.category] ?? d.category}
                      </td>
                      <td className="px-5 py-3.5 text-navy-400">
                        {d.client.user.firstName} {d.client.user.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-navy-400">
                        {d.lawyer.user.firstName} {d.lawyer.user.lastName}
                      </td>
                      <td className="px-5 py-3.5">
                        {d.aiAnalysis ? (
                          <div className="flex items-center gap-2">
                            <Bot size={12} className="text-blue-400" />
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-navy-800">
                              <div
                                className="h-full rounded-full bg-blue-500"
                                style={{ width: `${d.aiAnalysis.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-navy-400">{Math.round(d.aiAnalysis.confidence * 100)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-navy-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-navy-500">
                        {waitingLabel(d.updatedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/revisor/fila/${d.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 transition-colors whitespace-nowrap"
                        >
                          <ClipboardCheck size={12} /> Revisar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
    </div>
  )
}
