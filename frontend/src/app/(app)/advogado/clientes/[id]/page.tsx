'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Phone, FileText, Plus } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import StatusBadge from '@/components/dashboard/StatusBadge'
import DocumentSection from '@/components/dashboard/DocumentSection'

interface ClientDetail {
  id: string
  cpfCnpj?: string
  address?: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    status: string
    createdAt: string
  }
  demands: {
    id: string
    title: string
    category: string
    status: string
    createdAt: string
  }[]
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  LABOR: 'Trabalhista',
  FAMILY: 'Família',
  CONSUMER: 'Consumidor',
}

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get(`/clients/${id}`)
      .then(({ data }) => setClient(data))
      .catch(() => setError('Cliente não encontrado.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col">
        <Topbar title="Carregando..." />
        <div className="p-8 space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-navy-800" />
          <div className="h-48 animate-pulse rounded-xl bg-navy-800" />
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="flex flex-col">
        <Topbar title="Cliente" />
        <div className="p-8">
          <p className="text-red-400">{error || 'Erro ao carregar cliente.'}</p>
        </div>
      </div>
    )
  }

  const fullName = `${client.user.firstName} ${client.user.lastName}`

  return (
    <div className="flex flex-col">
      <Topbar
        title={fullName}
        subtitle={`Cliente desde ${new Date(client.createdAt).toLocaleDateString('pt-BR')}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/advogado/demandas/nova?clientId=${client.id}`}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
            >
              <Plus size={14} /> Nova demanda
            </Link>
            <Link
              href="/advogado/clientes"
              className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Voltar
            </Link>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-8">
        {/* Profile card */}
        <div className="rounded-xl border border-navy-800 bg-navy-900 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-700 text-2xl font-bold text-white">
              {client.user.firstName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-white">{fullName}</h2>
                <StatusBadge status={client.user.status} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={<Mail size={13} />} label={client.user.email} />
                {client.user.phone && <InfoRow icon={<Phone size={13} />} label={client.user.phone} />}
                {client.cpfCnpj && <InfoRow icon={<User size={13} />} label={client.cpfCnpj} />}
              </div>
              {client.address && (
                <p className="mt-2 text-xs text-navy-500">{client.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <DocumentSection clientId={client.id} />

        {/* Demands */}
        <div className="rounded-xl border border-navy-800 bg-navy-900">
          <div className="flex items-center justify-between border-b border-navy-800 px-6 py-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-navy-400" />
              Demandas ({client.demands.length})
            </h3>
            <Link
              href={`/advogado/demandas/nova?clientId=${client.id}`}
              className="flex items-center gap-1.5 text-xs text-gold-500 hover:text-gold-400 transition-colors"
            >
              <Plus size={12} /> Nova
            </Link>
          </div>

          {client.demands.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <FileText size={36} className="text-navy-700" />
              <p className="text-sm text-navy-400">Nenhuma demanda ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-navy-800">
              {client.demands.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/advogado/demandas/${d.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{d.title}</p>
                      <p className="text-xs text-navy-500">
                        {CATEGORY_LABELS[d.category] ?? d.category} ·{' '}
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-navy-400">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  )
}
