'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Search, Filter, UserCheck, UserX, ChevronLeft,
  ChevronRight, ExternalLink, RefreshCw, AlertTriangle,
} from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'

const PLANS    = ['', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']
const STATUSES = ['', 'ACTIVE', 'PENDING_APPROVAL', 'BLOCKED', 'INACTIVE']
const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter', PROFESSIONAL: 'Professional', ENTERPRISE: 'Enterprise',
}

interface Lawyer {
  id: string
  oabNumber: string
  oabState: string
  specialties: string[]
  plan: string
  isAdimplente: boolean
  createdAt: string
  user: {
    id: string
    email: string
    status: string
    firstName: string
    lastName: string
    phone?: string
    createdAt: string
  }
  _count: { clients: number; demands: number }
}

export default function AdvogadosPage() {
  const [lawyers, setLawyers]   = useState<Lawyer[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [plan, setPlan]         = useState('')
  const [adimplente, setAdimplente] = useState('')
  const limit = 15

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) })
      if (search)     params.set('search', search)
      if (status)     params.set('status', status)
      if (plan)       params.set('plan', plan)
      if (adimplente) params.set('adimplente', adimplente)

      const { data } = await api.get(`/lawyers?${params}`)
      setLawyers(data.data)
      setTotal(data.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [search, status, plan, adimplente])

  useEffect(() => { load(1) }, [load])

  async function approve(userId: string) {
    await api.post(`/admin/users/${userId}/approve`)
    load(page)
  }

  async function block(userId: string) {
    await api.post(`/admin/users/${userId}/block`)
    load(page)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col">
      <Topbar
        title="Advogados"
        subtitle={`${total} advogado${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
      />

      <div className="flex-1 space-y-4 p-8">
        {/* filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* busca */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1)}
              placeholder="Nome, e-mail ou OAB..."
              className="w-full rounded-lg border border-navy-700 bg-navy-900 py-2 pl-9 pr-4 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          {/* status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING_APPROVAL">Aguarda aprovação</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="INACTIVE">Inativo</option>
          </select>

          {/* plano */}
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
          >
            <option value="">Todos os planos</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          {/* adimplência */}
          <select
            value={adimplente}
            onChange={(e) => setAdimplente(e.target.value)}
            className="rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
          >
            <option value="">Adimplência</option>
            <option value="true">Adimplente</option>
            <option value="false">Inadimplente</option>
          </select>

          <button
            onClick={() => load(1)}
            className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900 px-3 py-2 text-sm text-navy-300 hover:border-navy-600 hover:text-white transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Buscar
          </button>
        </div>

        {/* tabela */}
        <div className="rounded-xl border border-navy-800 bg-navy-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-navy-800 bg-navy-950/50">
                <tr>
                  {['Advogado', 'OAB', 'Plano', 'Clientes', 'Demandas', 'Status', 'Cadastro', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-navy-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-navy-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : lawyers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-navy-500">
                      Nenhum advogado encontrado.
                    </td>
                  </tr>
                ) : (
                  lawyers.map((l) => (
                    <tr key={l.id} className="hover:bg-navy-800/40 transition-colors">
                      {/* advogado */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">
                            {l.user.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {l.user.firstName} {l.user.lastName}
                            </p>
                            <p className="text-xs text-navy-500">{l.user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* oab */}
                      <td className="px-4 py-3">
                        <p className="text-white">{l.oabNumber}</p>
                        {!l.isAdimplente && (
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-red-400">
                            <AlertTriangle size={10} /> Inadimplente
                          </div>
                        )}
                      </td>

                      {/* plano */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          l.plan === 'ENTERPRISE'   ? 'bg-purple-500/20 text-purple-400' :
                          l.plan === 'PROFESSIONAL' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-navy-700 text-navy-300'
                        }`}>
                          {PLAN_LABELS[l.plan] ?? l.plan}
                        </span>
                      </td>

                      {/* clientes */}
                      <td className="px-4 py-3 text-center text-navy-300">{l._count.clients}</td>

                      {/* demandas */}
                      <td className="px-4 py-3 text-center text-navy-300">{l._count.demands}</td>

                      {/* status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={l.user.status} />
                      </td>

                      {/* data */}
                      <td className="px-4 py-3 text-xs text-navy-500">
                        {new Date(l.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      {/* ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {l.user.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => approve(l.user.id)}
                              className="flex items-center gap-1 rounded-lg bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors"
                            >
                              <UserCheck size={12} /> Aprovar
                            </button>
                          )}
                          {l.user.status === 'ACTIVE' && (
                            <button
                              onClick={() => block(l.user.id)}
                              className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <UserX size={12} /> Bloquear
                            </button>
                          )}
                          {l.user.status === 'BLOCKED' && (
                            <button
                              onClick={() => approve(l.user.id)}
                              className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-400 hover:bg-blue-500/30 transition-colors"
                            >
                              <UserCheck size={12} /> Reativar
                            </button>
                          )}
                          <Link
                            href={`/admin/advogados/${l.id}`}
                            className="flex items-center gap-1 rounded-lg border border-navy-700 px-2.5 py-1 text-xs text-navy-400 hover:border-navy-600 hover:text-white transition-colors"
                          >
                            <ExternalLink size={12} /> Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-navy-800 px-4 py-3">
              <p className="text-xs text-navy-500">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:border-navy-600 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1
                  if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) return null
                  return (
                    <button
                      key={p}
                      onClick={() => load(p)}
                      className={`min-w-[30px] rounded-lg border px-2 py-1 text-xs transition-colors ${
                        p === page
                          ? 'border-gold-500 bg-gold-500/20 text-gold-500'
                          : 'border-navy-700 text-navy-400 hover:border-navy-600 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => load(page + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg border border-navy-700 p-1.5 text-navy-400 hover:border-navy-600 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
