'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, RefreshCw, ChevronLeft, ChevronRight, Filter, FileText } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'

interface Demand {
  id: string
  title: string
  category: string
  status: string
  createdAt: string
  client: { user: { firstName: string; lastName: string } }
  lawyer: { user: { firstName: string; lastName: string } }
  aiAnalysis: { id: string; confidence: number; estimatedCostUsd: number | null } | null
  review: { id: string; approved: boolean } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ANALYZING', label: 'Analisando' },
  { value: 'PENDING_REVIEW', label: 'Aguardando revisão' },
  { value: 'REVIEWED', label: 'Revisado' },
  { value: 'REJECTED', label: 'Rejeitado' },
  { value: 'COMPLETED', label: 'Concluído' },
]

export default function AdminDemandasPage() {
  const [demands, setDemands]   = useState<Demand[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]   = useState(true)
  const limit = 20

  const load = useCallback(async (p = 1, st = statusFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (st) params.set('status', st)
      const { data } = await api.get(`/admin/demands?${params}`)
      setDemands(data.data)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load(1) }, [load])

  function handleStatusChange(st: string) {
    setStatus(st)
    load(1, st)
  }

  const filtered = search
    ? demands.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        `${d.client.user.firstName} ${d.client.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        `${d.lawyer.user.firstName} ${d.lawyer.user.lastName}`.toLowerCase().includes(search.toLowerCase())
      )
    : demands

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Demandas"
        subtitle={`${total} demanda${total !== 1 ? 's' : ''} na plataforma`}
      />

      <div className="flex-1 space-y-4 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, cliente ou advogado..."
              className="w-full rounded-lg border border-navy-700 bg-navy-900 py-2 pl-9 pr-4 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-navy-700 bg-navy-900 py-2 pl-8 pr-8 text-sm text-white focus:border-gold-500 focus:outline-none appearance-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => load(1)}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-navy-800" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <FileText size={48} className="text-navy-700" />
            <p className="text-navy-400">Nenhuma demanda encontrada.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
              <ul className="divide-y divide-navy-800">
                {filtered.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/demandas/${d.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-navy-800/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs text-navy-400">
                            {CATEGORY_LABELS[d.category] ?? d.category}
                          </span>
                          {d.aiAnalysis && (
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                              IA {Math.round(d.aiAnalysis.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-white">{d.title}</p>
                        <p className="text-xs text-navy-500">
                          Cliente: {d.client.user.firstName} {d.client.user.lastName} ·{' '}
                          Advogado: {d.lawyer.user.firstName} {d.lawyer.user.lastName} ·{' '}
                          {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-navy-500">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => load(page - 1)} disabled={page === 1}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => load(page + 1)} disabled={page === totalPages}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40 transition-colors">
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
