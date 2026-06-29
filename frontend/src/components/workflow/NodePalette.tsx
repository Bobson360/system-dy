'use client'

import {
  Play, Clock, FilePlus, ArrowRightCircle,
  ClipboardList, FileText, GitBranch,
  Brain, Sparkles, Bell, RefreshCw, UserCheck, Shield,
} from 'lucide-react'

const GROUPS = [
  {
    label: 'Gatilhos',
    color: 'emerald',
    items: [
      { nodeType: 'TRIGGER_MANUAL',         label: 'Início Manual',      icon: <Play size={14} /> },
      { nodeType: 'TRIGGER_SCHEDULE',       label: 'Agendamento',        icon: <Clock size={14} /> },
      { nodeType: 'TRIGGER_DEMAND_CREATED', label: 'Nova Demanda',       icon: <FilePlus size={14} /> },
      { nodeType: 'TRIGGER_DEMAND_STATUS',  label: 'Mudança de Status',  icon: <ArrowRightCircle size={14} /> },
    ],
  },
  {
    label: 'Dados de Entrada',
    color: 'slate',
    items: [
      { nodeType: 'INPUT_FORM',        label: 'Formulário',       icon: <ClipboardList size={14} /> },
      { nodeType: 'INPUT_DEMAND_DATA', label: 'Dados da Demanda', icon: <FileText size={14} /> },
    ],
  },
  {
    label: 'Lógica',
    color: 'amber',
    items: [
      { nodeType: 'CONDITION', label: 'Condição (Se/Senão)', icon: <GitBranch size={14} /> },
    ],
  },
  {
    label: 'Inteligência Artificial',
    color: 'violet',
    items: [
      { nodeType: 'AI_ANALYZE',   label: 'Analisar com IA', icon: <Brain size={14} /> },
      { nodeType: 'AI_SUMMARIZE', label: 'Resumir com IA',  icon: <Sparkles size={14} /> },
    ],
  },
  {
    label: 'Ações',
    color: 'blue',
    items: [
      { nodeType: 'ACTION_NOTIFY',          label: 'Notificar',        icon: <Bell size={14} /> },
      { nodeType: 'ACTION_UPDATE_STATUS',   label: 'Atualizar Status', icon: <RefreshCw size={14} /> },
      { nodeType: 'ACTION_ASSIGN_REVIEWER', label: 'Atribuir Revisor', icon: <UserCheck size={14} /> },
    ],
  },
  {
    label: 'Acesso',
    color: 'orange',
    items: [
      { nodeType: 'ACCESS_CONTROL', label: 'Controle de Acesso', icon: <Shield size={14} /> },
    ],
  },
]

const COLOR_DOT: Record<string, string> = {
  emerald: 'bg-emerald-400',
  slate:   'bg-slate-400',
  amber:   'bg-amber-400',
  violet:  'bg-violet-400',
  blue:    'bg-blue-400',
  orange:  'bg-orange-400',
}

const COLOR_ITEM: Record<string, string> = {
  emerald: 'border-emerald-800 hover:border-emerald-500 hover:bg-emerald-500/10 text-emerald-300',
  slate:   'border-slate-700 hover:border-slate-500 hover:bg-slate-500/10 text-slate-300',
  amber:   'border-amber-800 hover:border-amber-500 hover:bg-amber-500/10 text-amber-300',
  violet:  'border-violet-800 hover:border-violet-500 hover:bg-violet-500/10 text-violet-300',
  blue:    'border-blue-800 hover:border-blue-500 hover:bg-blue-500/10 text-blue-300',
  orange:  'border-orange-800 hover:border-orange-500 hover:bg-orange-500/10 text-orange-300',
}

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow-nodetype', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-navy-800 bg-navy-900 overflow-y-auto">
      <div className="border-b border-navy-800 px-4 py-3">
        <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Componentes</p>
        <p className="text-[10px] text-navy-600 mt-0.5">Arraste para o canvas</p>
      </div>

      <div className="flex-1 space-y-4 p-3">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-1.5 w-1.5 rounded-full ${COLOR_DOT[group.color]}`} />
              <p className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider">
                {group.label}
              </p>
            </div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <div
                  key={item.nodeType}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.nodeType)}
                  className={`
                    flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2
                    text-xs font-medium transition-all active:cursor-grabbing select-none
                    ${COLOR_ITEM[group.color]}
                  `}
                >
                  <span className="shrink-0 opacity-70">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
