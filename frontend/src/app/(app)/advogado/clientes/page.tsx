'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, Users, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'

interface Client {
  id: string
  cpfCnpj?: string
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string; status: string }
  _count: { demands: number }
}

export default function ClientesPage() {
  const [clients, setClients]   = useState<Client[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const limit = 15

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      const { data } = await api.get(`/clients?${params}`)
      setClients(data.data)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(1) }, [load])

  const filtered = search
    ? clients.filter((c) =>
        `${c.user.firstName} ${c.user.lastName} ${c.user.email} ${c.cpfCnpj ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : clients

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={
          <Link
            href="/advogado/clientes/novo"
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
          >
            <Plus size={16} /> Novo cliente
          </Link>
        }
      />

      <div className="flex-1 space-y-4 p-8">
        {/* busca */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou CPF..."
              className="w-full rounded-lg border border-navy-700 bg-navy-900 py-2 pl-9 pr-4 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => load(1)}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* cards ou tabela */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Users size={48} className="text-navy-700" />
            <p className="text-navy-400">Nenhum cliente encontrado.</p>
            <Link
              href="/advogado/clientes/novo"
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
            >
              <Plus size={16} /> Cadastrar primeiro cliente
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/advogado/clientes/${c.id}`}
                  className="group rounded-xl border border-navy-800 bg-navy-900 p-5 hover:border-navy-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-700 text-lg font-bold text-white group-hover:bg-navy-600 transition-colors">
                        {c.user.firstName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {c.user.firstName} {c.user.lastName}
                        </p>
                        <p className="text-xs text-navy-500 truncate">{c.user.email}</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="shrink-0 text-navy-600 group-hover:text-navy-400 transition-colors" />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-navy-500">
                      {c.user.phone && <span>{c.user.phone}</span>}
                      {c.cpfCnpj && <span>{c.cpfCnpj}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-xs text-navy-400">
                        {c._count.demands} dem.
                      </span>
                      <StatusBadge status={c.user.status} />
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-navy-600">
                    Desde {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-navy-500">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page === 1}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page === totalPages}
                    className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
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
