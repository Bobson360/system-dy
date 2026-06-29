'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'
import {
  Plus, Play, GitBranch, Clock, CheckCircle2,
  PauseCircle, Archive, Trash2, Pencil,
} from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string | null
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  schedule: string | null
  createdAt: string
  updatedAt: string
  _count: { executions: number }
}

const STATUS_CONFIG = {
  DRAFT:    { label: 'Rascunho',   icon: <Pencil size={12} />,      classes: 'bg-navy-700 text-navy-300' },
  ACTIVE:   { label: 'Ativo',      icon: <CheckCircle2 size={12} />, classes: 'bg-emerald-500/20 text-emerald-300' },
  PAUSED:   { label: 'Pausado',    icon: <PauseCircle size={12} />,  classes: 'bg-amber-500/20 text-amber-300' },
  ARCHIVED: { label: 'Arquivado',  icon: <Archive size={12} />,      classes: 'bg-slate-700 text-slate-400' },
}

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  async function load() {
    try {
      const { data } = await api.get('/workflows')
      setWorkflows(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    const { data } = await api.post('/workflows', { name: 'Novo Fluxo' })
    router.push(`/advogado/workflows/${data.id}`)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este fluxo?')) return
    setDeleting(id)
    try {
      await api.delete(`/workflows/${id}`)
      setWorkflows((prev) => prev.filter((w) => w.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleRun(id: string) {
    setRunning(id)
    try {
      await api.post(`/workflows/${id}/execute`, { input: {} })
      alert('Fluxo executado! Veja o histórico na tela do fluxo.')
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao executar fluxo')
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Fluxos de Trabalho"
        subtitle="Automatize processos jurídicos com lógica visual"
        actions={
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
          >
            <Plus size={16} />
            Novo Fluxo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-700 border-t-gold-500" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800">
              <GitBranch size={28} className="text-navy-500" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Nenhum fluxo criado</p>
              <p className="text-navy-400 text-sm mt-1">Crie seu primeiro fluxo de trabalho automatizado</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors"
            >
              <Plus size={16} />
              Criar Fluxo
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => {
              const st = STATUS_CONFIG[wf.status]
              return (
                <div
                  key={wf.id}
                  className="group flex flex-col rounded-xl border border-navy-800 bg-navy-900 p-5 hover:border-navy-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                      <GitBranch size={18} className="text-violet-400" />
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.classes}`}>
                      {st.icon}
                      {st.label}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white mb-1 truncate">{wf.name}</h3>
                  {wf.description && (
                    <p className="text-xs text-navy-400 mb-3 line-clamp-2">{wf.description}</p>
                  )}

                  <div className="mt-auto pt-3 flex items-center gap-3 text-[11px] text-navy-500 border-t border-navy-800">
                    {wf.schedule && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {wf.schedule}
                      </span>
                    )}
                    <span>{wf._count.executions} execuções</span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/advogado/workflows/${wf.id}`)}
                      className="flex-1 rounded-lg border border-navy-700 py-1.5 text-xs text-navy-300 hover:border-navy-500 hover:text-white transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRun(wf.id)}
                      disabled={running === wf.id}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-800 px-3 py-1.5 text-xs text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                    >
                      <Play size={11} />
                      {running === wf.id ? 'Executando...' : 'Executar'}
                    </button>
                    <button
                      onClick={() => handleDelete(wf.id)}
                      disabled={deleting === wf.id}
                      className="rounded-lg border border-navy-700 p-1.5 text-navy-500 hover:border-red-800 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
