'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Node, Edge } from 'reactflow'
import api from '@/lib/api'
import dynamic from 'next/dynamic'
import {
  Save, Play, ArrowLeft, CheckCircle2, AlertCircle,
  Clock, Loader2, ChevronDown,
} from 'lucide-react'

// React Flow must be client-only
const WorkflowEditor = dynamic(
  () => import('@/components/workflow/WorkflowEditor'),
  { ssr: false, loading: () => <EditorSkeleton /> },
)

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-navy-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-700 border-t-violet-500" />
    </div>
  )
}

interface Execution {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  startedAt: string
  finishedAt: string | null
  error: string | null
}

const RUN_STATUS = {
  PENDING:   { classes: 'text-navy-400',   icon: <Clock size={12} /> },
  RUNNING:   { classes: 'text-amber-400',  icon: <Loader2 size={12} className="animate-spin" /> },
  COMPLETED: { classes: 'text-emerald-400', icon: <CheckCircle2 size={12} /> },
  FAILED:    { classes: 'text-red-400',    icon: <AlertCircle size={12} /> },
}

export default function WorkflowEditorPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [name, setName] = useState('Carregando...')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>('DRAFT')
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [executions, setExecutions] = useState<Execution[]>([])
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showExec, setShowExec] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get(`/workflows/${id}`).then(({ data }) => {
      setName(data.name)
      setDescription(data.description ?? '')
      setStatus(data.status)
      setNodes((data.nodes as Node[]) ?? [])
      setEdges((data.edges as Edge[]) ?? [])
      setExecutions(data.executions ?? [])
      setLoaded(true)
    })
  }, [id])

  const onFlowChange = useCallback((n: Node[], e: Edge[]) => {
    setNodes(n)
    setEdges(e)
    setSaved(false)
  }, [])

  async function save() {
    setSaving(true)
    try {
      await api.put(`/workflows/${id}`, { name, description, status, nodes, edges })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function runWorkflow() {
    setRunning(true)
    try {
      await api.put(`/workflows/${id}`, { nodes, edges })
      const { data } = await api.post(`/workflows/${id}/execute`, { input: {} })
      setExecutions((prev) => [data, ...prev].slice(0, 10))
      setShowExec(true)
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Erro ao executar')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-navy-950">
      {/* Top bar */}
      <header className="flex shrink-0 items-center gap-3 border-b border-navy-800 bg-navy-900 px-4 py-2.5">
        <button
          onClick={() => router.push('/advogado/workflows')}
          className="text-navy-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none border-b border-gold-500 w-full max-w-xs"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-white hover:text-gold-400 transition-colors truncate max-w-xs"
            >
              {name}
            </button>
          )}
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-navy-700 bg-navy-800 px-2 py-1 text-xs text-white focus:border-gold-500 focus:outline-none"
        >
          <option value="DRAFT">Rascunho</option>
          <option value="ACTIVE">Ativo</option>
          <option value="PAUSED">Pausado</option>
          <option value="ARCHIVED">Arquivado</option>
        </select>

        <button
          onClick={() => setShowExec(!showExec)}
          className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-1.5 text-xs text-navy-300 hover:border-navy-500 hover:text-white transition-colors"
        >
          Histórico
          <ChevronDown size={12} className={showExec ? 'rotate-180' : ''} />
          {executions.length > 0 && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-navy-700 text-[9px]">
              {executions.length}
            </span>
          )}
        </button>

        <button
          onClick={runWorkflow}
          disabled={running}
          className="flex items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {running ? 'Executando...' : 'Executar'}
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={13} />
          ) : (
            <Save size={13} />
          )}
          {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </header>

      {/* Execution history panel */}
      {showExec && (
        <div className="shrink-0 border-b border-navy-800 bg-navy-900 px-4 py-3">
          <p className="text-xs font-semibold text-navy-400 mb-2 uppercase tracking-wider">Últimas execuções</p>
          {executions.length === 0 ? (
            <p className="text-xs text-navy-600">Nenhuma execução ainda.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {executions.map((ex) => {
                const cfg = RUN_STATUS[ex.status]
                return (
                  <div key={ex.id} className="shrink-0 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 min-w-[180px]">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.classes}`}>
                      {cfg.icon}
                      {ex.status}
                    </div>
                    <p className="text-[10px] text-navy-500 mt-1">
                      {new Date(ex.startedAt).toLocaleString('pt-BR')}
                    </p>
                    {ex.error && (
                      <p className="text-[10px] text-red-400 mt-0.5 truncate">{ex.error}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Flow editor */}
      <div className="flex-1 overflow-hidden">
        {loaded && (
          <WorkflowEditor
            initialNodes={nodes}
            initialEdges={edges}
            onChange={onFlowChange}
          />
        )}
      </div>
    </div>
  )
}
