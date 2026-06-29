'use client'

import { Node } from 'reactflow'
import { X } from 'lucide-react'

const DEMAND_STATUSES = [
  { value: 'DRAFT',          label: 'Rascunho' },
  { value: 'ANALYZING',      label: 'Em Análise' },
  { value: 'PENDING_REVIEW', label: 'Aguardando Revisão' },
  { value: 'REVIEWED',       label: 'Revisado' },
  { value: 'COMPLETED',      label: 'Concluído' },
  { value: 'REJECTED',       label: 'Rejeitado' },
]

interface NodePropertiesProps {
  node: Node | null
  onChange: (nodeId: string, data: any) => void
  onClose: () => void
}

export default function NodeProperties({ node, onChange, onClose }: NodePropertiesProps) {
  if (!node) return null

  const nodeType: string = node.data?.nodeType ?? ''
  const config = node.data?.config ?? {}

  const setLabel = (label: string) => {
    onChange(node.id, { ...node.data, label })
  }

  const setConfig = (key: string, value: string) => {
    onChange(node.id, { ...node.data, config: { ...config, [key]: value } })
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-navy-800 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-800 px-4 py-3">
        <p className="text-sm font-semibold text-white">Propriedades</p>
        <button onClick={onClose} className="text-navy-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-navy-400 mb-1.5">Nome do nó</label>
          <input
            type="text"
            value={node.data?.label ?? ''}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: Verificar categoria"
            className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none"
          />
        </div>

        {/* TRIGGER_SCHEDULE */}
        {nodeType === 'TRIGGER_SCHEDULE' && (
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Expressão Cron</label>
            <input
              type="text"
              value={config.schedule ?? ''}
              onChange={(e) => setConfig('schedule', e.target.value)}
              placeholder="0 9 * * 1-5"
              className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-navy-500 mt-1.5">
              Ex: <code className="text-navy-300">0 9 * * 1-5</code> = seg–sex às 9h
            </p>
          </div>
        )}

        {/* TRIGGER_DEMAND_STATUS */}
        {nodeType === 'TRIGGER_DEMAND_STATUS' && (
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Status que dispara</label>
            <select
              value={config.status ?? ''}
              onChange={(e) => setConfig('status', e.target.value)}
              className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            >
              <option value="">Selecionar...</option>
              {DEMAND_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* CONDITION */}
        {nodeType === 'CONDITION' && (
          <>
            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">Campo</label>
              <input
                type="text"
                value={config.field ?? ''}
                onChange={(e) => setConfig('field', e.target.value)}
                placeholder="Ex: demandCategory"
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">Operador</label>
              <select
                value={config.operator ?? 'equals'}
                onChange={(e) => setConfig('operator', e.target.value)}
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
              >
                <option value="equals">igual a</option>
                <option value="not_equals">diferente de</option>
                <option value="contains">contém</option>
                <option value="gt">maior que</option>
                <option value="lt">menor que</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-400 mb-1.5">Valor</label>
              <input
                type="text"
                value={config.value ?? ''}
                onChange={(e) => setConfig('value', e.target.value)}
                placeholder="Ex: CIVIL"
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {/* ACTION_NOTIFY */}
        {nodeType === 'ACTION_NOTIFY' && (
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Mensagem</label>
            <textarea
              value={config.message ?? ''}
              onChange={(e) => setConfig('message', e.target.value)}
              placeholder="Ex: Sua demanda foi processada com sucesso."
              rows={3}
              className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* ACTION_UPDATE_STATUS */}
        {nodeType === 'ACTION_UPDATE_STATUS' && (
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-1.5">Novo status</label>
            <select
              value={config.status ?? ''}
              onChange={(e) => setConfig('status', e.target.value)}
              className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            >
              <option value="">Selecionar...</option>
              {DEMAND_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* ACCESS_CONTROL */}
        {nodeType === 'ACCESS_CONTROL' && (
          <div>
            <label className="block text-xs font-medium text-navy-400 mb-2">Papéis com acesso</label>
            <div className="space-y-2">
              {['LAWYER', 'CLIENT', 'REVIEWER'].map((role) => {
                const roles: string[] = config.roles ?? []
                return (
                  <label key={role} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roles.includes(role)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...roles, role]
                          : roles.filter((r) => r !== role)
                        setConfig('roles', next as any)
                      }}
                      className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-gold-500 focus:ring-gold-500"
                    />
                    <span className="text-sm text-white">{role}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Nodes sem config */}
        {['TRIGGER_MANUAL', 'TRIGGER_DEMAND_CREATED', 'INPUT_FORM', 'INPUT_DEMAND_DATA',
          'AI_ANALYZE', 'AI_SUMMARIZE', 'ACTION_ASSIGN_REVIEWER'].includes(nodeType) && (
          <p className="text-xs text-navy-500 italic">Este nó não requer configuração adicional.</p>
        )}
      </div>
    </aside>
  )
}
