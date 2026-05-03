'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, RefreshCw, History } from 'lucide-react'
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
  review: { approved: boolean; completedAt: string | null } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor', CORPORATE: 'Empresarial',
  TAX: 'Tributário', REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}

export default function HistoricoPage() {
  const [reviewed, setReviewed] = useState<Demand[]>([])
  const [rejected, setRejected] = useState<Demand[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'reviewed' | 'rejected'>('reviewed')
  const [pageR, setPageR]       = useState(1)
  const [pageX, setPageX]       = useState(1)
  const [totalR, setTotalR]     = useState(0)
  const [totalX, setTotalX]     = useState(0)
  const limit = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, x] = await Promise.all([
        api.get(`/demands?status=REVIEWED&page=${pageR}&limit=${limit}`),
        api.get(`/demands?status=REJECTED&page=${pageX}&limit=${limit}`),
      ])
      setReviewed(r.data.data)
      setTotalR(r.data.total)
      setRejected(x.data.data)
      setTotalX(x.data.total)
    } finally {
      setLoading(false)
    }
  }, [pageR, pageX])

  useEffect(() => { load() }, [load])

  const items = tab === 'reviewed' ? reviewed : rejected
  const total = tab === 'reviewed' ? totalR : totalX
  const page  = tab === 'reviewed' ? pageR  : pageX
  const setPage = tab === 'reviewed' ? setPageR : setPageX
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Histórico de revisões"
        subtitle={`${totalR} aprovadas · ${totalX} rejeitadas`}
        actions={
          <button onClick={() => load()}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div className="flex-1 p-8 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-navy-800 bg-navy-900 p-1 w-fit">
          <TabBtn active={tab === 'reviewed'} onClick={() => setTab('reviewed')} icon={<CheckCircle size={13} className="text-green-400" />} label={`Aprovadas (${totalR})`} />
          <TabBtn active={tab === 'rejected'} onClick={() => setTab('rejected')} icon={<XCircle size={13} className="text-red-400" />} label={`Rejeitadas (${totalX})`} />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-navy-800" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <History size={40} className="text-navy-700" />
            <p className="text-navy-400">Nenhuma demanda {tab === 'reviewed' ? 'aprovada' : 'rejeitada'} ainda.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-navy-800 bg-navy-900">
              <ul className="divide-y divide-navy-800">
                {items.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/revisor/fila/${d.id}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-navy-800/50 transition-colors"
                    >
                      <div className="shrink-0">
                        {d.review?.approved
                          ? <CheckCircle size={16} className="text-green-400" />
                          : <XCircle size={16} className="text-red-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{d.title}</p>
                        <p className="text-xs text-navy-500">
                          {CATEGORY_LABELS[d.category] ?? d.category} ·{' '}
                          {d.client.user.firstName} {d.client.user.lastName} ·{' '}
                          {d.review?.completedAt
                            ? new Date(d.review.completedAt).toLocaleDateString('pt-BR')
                            : new Date(d.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-navy-500">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
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

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'bg-navy-700 text-white' : 'text-navy-400 hover:text-white'
      }`}
    >
      {icon}{label}
    </button>
  )
}
