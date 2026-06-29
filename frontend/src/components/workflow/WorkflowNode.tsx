'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  Play, Clock, FilePlus, ArrowRightCircle,
  ClipboardList, FileText, GitBranch,
  Brain, Sparkles,
  Bell, RefreshCw, UserCheck, Shield,
} from 'lucide-react'

export type WorkflowNodeType =
  | 'TRIGGER_MANUAL' | 'TRIGGER_SCHEDULE' | 'TRIGGER_DEMAND_CREATED' | 'TRIGGER_DEMAND_STATUS'
  | 'INPUT_FORM' | 'INPUT_DEMAND_DATA'
  | 'CONDITION'
  | 'AI_ANALYZE' | 'AI_SUMMARIZE'
  | 'ACTION_NOTIFY' | 'ACTION_UPDATE_STATUS' | 'ACTION_ASSIGN_REVIEWER'
  | 'ACCESS_CONTROL'

const NODE_META: Record<WorkflowNodeType, { icon: React.ReactNode; color: string; label: string }> = {
  TRIGGER_MANUAL:         { icon: <Play size={16} />,           color: 'emerald', label: 'Início Manual' },
  TRIGGER_SCHEDULE:       { icon: <Clock size={16} />,          color: 'emerald', label: 'Agendamento' },
  TRIGGER_DEMAND_CREATED: { icon: <FilePlus size={16} />,       color: 'emerald', label: 'Nova Demanda' },
  TRIGGER_DEMAND_STATUS:  { icon: <ArrowRightCircle size={16}/>, color: 'emerald', label: 'Mudança de Status' },
  INPUT_FORM:             { icon: <ClipboardList size={16} />,  color: 'slate',   label: 'Formulário' },
  INPUT_DEMAND_DATA:      { icon: <FileText size={16} />,       color: 'slate',   label: 'Dados da Demanda' },
  CONDITION:              { icon: <GitBranch size={16} />,      color: 'amber',   label: 'Condição' },
  AI_ANALYZE:             { icon: <Brain size={16} />,          color: 'violet',  label: 'Analisar com IA' },
  AI_SUMMARIZE:           { icon: <Sparkles size={16} />,       color: 'violet',  label: 'Resumir com IA' },
  ACTION_NOTIFY:          { icon: <Bell size={16} />,           color: 'blue',    label: 'Notificar' },
  ACTION_UPDATE_STATUS:   { icon: <RefreshCw size={16} />,      color: 'blue',    label: 'Atualizar Status' },
  ACTION_ASSIGN_REVIEWER: { icon: <UserCheck size={16} />,      color: 'blue',    label: 'Atribuir Revisor' },
  ACCESS_CONTROL:         { icon: <Shield size={16} />,         color: 'orange',  label: 'Controle de Acesso' },
}

const COLOR_CLASSES: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  emerald: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-400 bg-emerald-500/20',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
  slate: {
    border: 'border-slate-500',
    bg: 'bg-slate-500/10',
    icon: 'text-slate-400 bg-slate-500/20',
    badge: 'bg-slate-500/20 text-slate-300',
  },
  amber: {
    border: 'border-amber-500',
    bg: 'bg-amber-500/10',
    icon: 'text-amber-400 bg-amber-500/20',
    badge: 'bg-amber-500/20 text-amber-300',
  },
  violet: {
    border: 'border-violet-500',
    bg: 'bg-violet-500/10',
    icon: 'text-violet-400 bg-violet-500/20',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400 bg-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    icon: 'text-orange-400 bg-orange-500/20',
    badge: 'bg-orange-500/20 text-orange-300',
  },
}

const isTrigger = (nodeType: WorkflowNodeType) => nodeType.startsWith('TRIGGER')
const isTerminal = (nodeType: WorkflowNodeType) => nodeType === 'ACCESS_CONTROL'

function WorkflowNode({ data, selected }: NodeProps) {
  const nodeType = data.nodeType as WorkflowNodeType
  const meta = NODE_META[nodeType] ?? { icon: null, color: 'slate', label: nodeType }
  const colors = COLOR_CLASSES[meta.color]

  return (
    <div
      className={`
        min-w-[180px] rounded-xl border-2 ${colors.border} ${colors.bg}
        backdrop-blur-sm shadow-lg transition-all duration-150
        ${selected ? 'ring-2 ring-white/30 shadow-xl' : ''}
      `}
    >
      {!isTrigger(nodeType) && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-white/40 !border-white/60"
        />
      )}

      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colors.icon}`}>
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {data.label || meta.label}
          </p>
          {data.config && Object.keys(data.config).length > 0 && (
            <p className="text-[10px] text-white/50 truncate mt-0.5">
              {Object.values(data.config).filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      {!isTerminal(nodeType) && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-white/40 !border-white/60"
        />
      )}
    </div>
  )
}

export default memo(WorkflowNode)
