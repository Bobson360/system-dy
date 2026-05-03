'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, Briefcase, Calendar,
  Users, FileText, CreditCard, UserCheck, UserX,
  AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'
import api from '@/lib/api'
import StatusBadge from '@/components/dashboard/StatusBadge'

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOR: 'Trabalhista',
  FAMILY: 'Família', CONSUMER: 'Consumidor', CORPORATE: 'Empresarial',
  TAX: 'Tributário', REAL_ESTATE: 'Imobiliário', OTHER: 'Outros',
}
const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter', PROFESSIONAL: 'Professional', ENTERPRISE: 'Enterprise',
}

export default function AdvogadoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [lawyer, setLawyer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')

  useEffect(() => {
    api.get(`/lawyers/${id}`)
      .then((r) => setLawyer(r.data))
      .finally(() => setLoading(false))
  }, [id])

  async function doAction(action: 'approve' | 'block') {
    setActionLoading(action)
    try {
      await api.post(`/admin/users/${lawyer.user.id}/${action}`)
      const updated = await api.get(`/lawyers/${id}`)
      setLawyer(updated.data)
    } finally {
      setActionLoading('')
    }
  }

  if (loading) return <Skeleton />
  if (!lawyer)  return (
    <div className="flex h-full items-center justify-center text-navy-500">
      Advogado não encontrado.
    </div>
  )

  const u = lawyer.user

  return (
    <div className="flex flex-col">
      {/* topbar */}
      <div className="flex items-center gap-4 border-b border-navy-800 px-8 py-4">
        <button onClick={() => router.back()} className="text-navy-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{u.firstName} {u.lastName}</h1>
          <p className="text-sm text-navy-400">{lawyer.oabNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {u.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => doAction('approve')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
            >
              <UserCheck size={16} />
              {actionLoading === 'approve' ? 'Aprovando...' : 'Aprovar conta'}
            </button>
          )}
          {u.status === 'ACTIVE' && (
            <button
              onClick={() => doAction('block')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
            >
              <UserX size={16} />
              {actionLoading === 'block' ? 'Bloqueando...' : 'Bloquear conta'}
            </button>
          )}
          {u.status === 'BLOCKED' && (
            <button
              onClick={() => doAction('approve')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
            >
              <UserCheck size={16} />
              {actionLoading === 'approve' ? 'Reativando...' : 'Reativar conta'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* coluna esquerda: perfil */}
          <div className="space-y-6">
            {/* card perfil */}
            <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-700 text-2xl font-bold text-white">
                  {u.firstName.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{u.firstName} {u.lastName}</p>
                  <StatusBadge status={u.status} />
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <InfoRow icon={<Mail size={14} />}    value={u.email} />
                <InfoRow icon={<Phone size={14} />}   value={u.phone || 'Não informado'} />
                <InfoRow icon={<Briefcase size={14} />} value={`${lawyer.oabNumber} — ${lawyer.oabState}`} />
                <InfoRow icon={<Calendar size={14} />} value={`Cadastro: ${new Date(u.createdAt).toLocaleDateString('pt-BR')}`} />
                {u.lastLoginAt && (
                  <InfoRow icon={<Clock size={14} />} value={`Último acesso: ${new Date(u.lastLoginAt).toLocaleDateString('pt-BR')}`} />
                )}
              </div>
            </div>

            {/* plano */}
            <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Assinatura</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">Plano</span>
                <span className={`text-sm font-semibold ${
                  lawyer.plan === 'ENTERPRISE'   ? 'text-purple-400' :
                  lawyer.plan === 'PROFESSIONAL' ? 'text-blue-400' : 'text-navy-300'
                }`}>
                  {PLAN_LABELS[lawyer.plan] ?? lawyer.plan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-navy-400">Adimplência</span>
                {lawyer.isAdimplente ? (
                  <span className="flex items-center gap-1 text-sm text-green-400">
                    <CheckCircle2 size={14} /> Em dia
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-red-400">
                    <AlertTriangle size={14} /> Inadimplente
                  </span>
                )}
              </div>
              {lawyer.planExpiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-navy-400">Vencimento</span>
                  <span className="text-sm text-navy-300">
                    {new Date(lawyer.planExpiresAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            {/* especialidades */}
            {lawyer.specialties?.length > 0 && (
              <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {lawyer.specialties.map((s: string) => (
                    <span key={s} className="rounded-full bg-navy-700 px-3 py-1 text-xs text-navy-300">
                      {CATEGORY_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* stats resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 text-center">
                <Users size={18} className="mx-auto mb-1 text-blue-400" />
                <p className="text-2xl font-bold text-white">{lawyer._count.clients}</p>
                <p className="text-xs text-navy-500">Clientes</p>
              </div>
              <div className="rounded-xl border border-navy-800 bg-navy-900 p-4 text-center">
                <FileText size={18} className="mx-auto mb-1 text-gold-500" />
                <p className="text-2xl font-bold text-white">{lawyer._count.demands}</p>
                <p className="text-xs text-navy-500">Demandas</p>
              </div>
            </div>
          </div>

          {/* coluna direita: histórico */}
          <div className="space-y-6 xl:col-span-2">
            {/* últimos clientes */}
            <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Clientes recentes
                </h3>
                <span className="text-xs text-navy-500">{lawyer._count.clients} total</span>
              </div>
              {lawyer.clients.length === 0 ? (
                <p className="py-4 text-center text-sm text-navy-500">Nenhum cliente cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {lawyer.clients.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-navy-800 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
                          {c.user.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{c.user.firstName} {c.user.lastName}</p>
                          <p className="text-xs text-navy-500">{c.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-navy-500">{c._count.demands} dem.</span>
                        <StatusBadge status={c.user.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* últimas demandas */}
            <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Demandas recentes</h3>
                <span className="text-xs text-navy-500">{lawyer._count.demands} total</span>
              </div>
              {lawyer.demands.length === 0 ? (
                <p className="py-4 text-center text-sm text-navy-500">Nenhuma demanda criada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-800">
                        <th className="pb-2 text-left text-xs text-navy-500">Título</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Categoria</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Status</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800">
                      {lawyer.demands.map((d: any) => (
                        <tr key={d.id} className="hover:bg-navy-800/40">
                          <td className="py-2.5 text-white max-w-[200px] truncate">{d.title}</td>
                          <td className="py-2.5 text-navy-400">{CATEGORY_LABELS[d.category] ?? d.category}</td>
                          <td className="py-2.5"><StatusBadge status={d.status} /></td>
                          <td className="py-2.5 text-xs text-navy-500">
                            {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* últimos pagamentos */}
            <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Pagamentos</h3>
                <span className="text-xs text-navy-500">{lawyer._count.payments} total</span>
              </div>
              {lawyer.payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-navy-500">Nenhum pagamento registrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-800">
                        <th className="pb-2 text-left text-xs text-navy-500">Plano</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Valor</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Vencimento</th>
                        <th className="pb-2 text-left text-xs text-navy-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-800">
                      {lawyer.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-navy-800/40">
                          <td className="py-2.5 text-navy-300">{PLAN_LABELS[p.plan] ?? p.plan}</td>
                          <td className="py-2.5 text-white font-medium">
                            R$ {Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-xs text-navy-500">
                            {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-2.5"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-navy-400">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="flex flex-col">
      <div className="border-b border-navy-800 px-8 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-navy-800" />
      </div>
      <div className="grid grid-cols-3 gap-6 p-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
        <div className="col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
      </div>
    </div>
  )
}
