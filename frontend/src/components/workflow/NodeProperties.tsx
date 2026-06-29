'use client'

import { useState } from 'react'
import { Node } from 'reactflow'
import {
  X, Plus, Trash2, GripVertical, Copy, Check,
  Link, ChevronDown, ChevronUp,
} from 'lucide-react'

const DEMAND_STATUSES = [
  { value: 'DRAFT',          label: 'Rascunho' },
  { value: 'ANALYZING',      label: 'Em Análise' },
  { value: 'PENDING_REVIEW', label: 'Aguardando Revisão' },
  { value: 'REVIEWED',       label: 'Revisado' },
  { value: 'COMPLETED',      label: 'Concluído' },
  { value: 'REJECTED',       label: 'Rejeitado' },
]

const DEMAND_CATEGORIES = [
  { value: 'CIVIL',       label: 'Civil' },
  { value: 'CRIMINAL',    label: 'Criminal' },
  { value: 'LABOR',       label: 'Trabalhista' },
  { value: 'FAMILY',      label: 'Família' },
  { value: 'CONSUMER',    label: 'Consumidor' },
  { value: 'CORPORATE',   label: 'Empresarial' },
  { value: 'TAX',         label: 'Tributário' },
  { value: 'REAL_ESTATE', label: 'Imobiliário' },
  { value: 'OTHER',       label: 'Outro' },
]

const FIELD_TYPES = [
  { value: 'text',     label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'email',    label: 'E-mail' },
  { value: 'phone',    label: 'Telefone' },
  { value: 'number',   label: 'Número' },
  { value: 'date',     label: 'Data' },
  { value: 'select',   label: 'Seleção' },
  { value: 'checkbox', label: 'Caixa de seleção' },
]

const NOTIFY_ROLES = [
  { value: 'LAWYER',   label: 'Advogado responsável' },
  { value: 'CLIENT',   label: 'Cliente' },
  { value: 'REVIEWER', label: 'Revisor' },
]

interface FormField {
  id: string
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string
}

interface NodePropertiesProps {
  node: Node | null
  onChange: (nodeId: string, data: any) => void
  onClose: () => void
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-navy-400 mb-1.5">{children}</label>
}

function Input({ value, onChange, placeholder, className = '', ...rest }: any) {
  return (
    <input
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none ${className}`}
      {...rest}
    />
  )
}

function Select({ value, onChange, children }: any) {
  return (
    <select
      value={value ?? ''}
      onChange={onChange}
      className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
    >
      {children}
    </select>
  )
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-navy-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 bg-navy-800 text-xs font-semibold text-navy-300 hover:bg-navy-750"
      >
        {title}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )
}

// ─── Form Builder ─────────────────────────────────────────────────────────────

function FormFieldBuilder({ fields, onChange }: { fields: FormField[]; onChange: (f: FormField[]) => void }) {
  const addField = () => {
    const id = `field_${Date.now()}`
    onChange([...fields, { id, key: id, label: 'Novo campo', type: 'text', required: false }])
  }

  const removeField = (id: string) => onChange(fields.filter((f) => f.id !== id))

  const updateField = (id: string, key: string, value: any) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)))

  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={field.id} className="rounded-lg border border-navy-700 bg-navy-850 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <GripVertical size={12} className="text-navy-600" />
              <span className="text-xs font-semibold text-white">Campo {idx + 1}</span>
            </div>
            <button onClick={() => removeField(field.id)} className="text-navy-600 hover:text-red-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Rótulo</Label>
              <Input
                value={field.label}
                onChange={(e: any) => updateField(field.id, 'label', e.target.value)}
                placeholder="Ex: Nome completo"
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={field.type} onChange={(e: any) => updateField(field.id, 'type', e.target.value)}>
                {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <Label>Chave interna</Label>
            <Input
              value={field.key}
              onChange={(e: any) => updateField(field.id, 'key', e.target.value.replace(/\s/g, '_').toLowerCase())}
              placeholder="Ex: nome_completo"
              className="font-mono text-xs"
            />
          </div>

          {field.type !== 'checkbox' && (
            <div>
              <Label>Placeholder</Label>
              <Input
                value={field.placeholder ?? ''}
                onChange={(e: any) => updateField(field.id, 'placeholder', e.target.value)}
                placeholder="Texto de exemplo no campo"
              />
            </div>
          )}

          {field.type === 'select' && (
            <div>
              <Label>Opções (uma por linha)</Label>
              <textarea
                value={field.options ?? ''}
                onChange={(e) => updateField(field.id, 'options', e.target.value)}
                placeholder={"Opção 1\nOpção 2\nOpção 3"}
                rows={3}
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-xs text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => updateField(field.id, 'required', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
            />
            <span className="text-xs text-navy-300">Campo obrigatório</span>
          </label>
        </div>
      ))}

      <button
        onClick={addField}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-navy-600 py-2 text-xs text-navy-400 hover:border-gold-500 hover:text-gold-400 transition-colors"
      >
        <Plus size={13} />
        Adicionar campo
      </button>
    </div>
  )
}

// ─── Share URL ─────────────────────────────────────────────────────────────────

function ShareUrl({ workflowId }: { workflowId: string }) {
  const [copied, setCopied] = useState(false)
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.deskyura.com'
  const url = `${base}/f/${workflowId}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-navy-400">
        Qualquer pessoa com este link pode acessar e preencher o formulário.
      </p>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-xs text-navy-300 font-mono truncate">
          {url}
        </div>
        <button
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-700 px-3 py-2 text-xs text-navy-300 hover:border-gold-500 hover:text-gold-400 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function NodeProperties({ node, onChange, onClose }: NodePropertiesProps) {
  if (!node) return null

  const nodeType: string = node.data?.nodeType ?? ''
  const config: any = node.data?.config ?? {}
  const workflowId = typeof window !== 'undefined'
    ? window.location.pathname.split('/').at(-1) ?? ''
    : ''

  const setLabel = (label: string) => onChange(node.id, { ...node.data, label })
  const setConfig = (key: string, value: any) =>
    onChange(node.id, { ...node.data, config: { ...config, [key]: value } })

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-navy-800 bg-navy-900">
      <div className="flex items-center justify-between border-b border-navy-800 px-4 py-3">
        <p className="text-sm font-semibold text-white">Propriedades</p>
        <button onClick={onClose} className="text-navy-500 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Label */}
        <Section title="Identificação">
          <div>
            <Label>Nome do nó</Label>
            <Input
              value={node.data?.label ?? ''}
              onChange={(e: any) => setLabel(e.target.value)}
              placeholder="Ex: Verificar categoria"
            />
          </div>
        </Section>

        {/* ── TRIGGER_SCHEDULE ─────────────────────────────────── */}
        {nodeType === 'TRIGGER_SCHEDULE' && (
          <Section title="Agendamento">
            <div>
              <Label>Expressão Cron</Label>
              <Input
                value={config.schedule ?? ''}
                onChange={(e: any) => setConfig('schedule', e.target.value)}
                placeholder="0 9 * * 1-5"
                className="font-mono"
              />
            </div>
            <div className="rounded-lg bg-navy-800 p-2.5 space-y-1">
              {[
                ['0 9 * * 1-5', 'Seg–Sex às 9h'],
                ['0 8 * * *',   'Todo dia às 8h'],
                ['0 12 * * 1',  'Segunda ao meio-dia'],
                ['0 0 1 * *',   'Primeiro dia do mês'],
              ].map(([expr, label]) => (
                <button
                  key={expr}
                  onClick={() => setConfig('schedule', expr)}
                  className="flex w-full items-center justify-between text-xs hover:text-gold-400 transition-colors"
                >
                  <span className="text-navy-400">{label}</span>
                  <code className="text-navy-500 font-mono">{expr}</code>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* ── TRIGGER_DEMAND_CREATED ───────────────────────────── */}
        {nodeType === 'TRIGGER_DEMAND_CREATED' && (
          <Section title="Filtro de Demanda">
            <div>
              <Label>Categoria (opcional)</Label>
              <Select value={config.category ?? ''} onChange={(e: any) => setConfig('category', e.target.value)}>
                <option value="">Qualquer categoria</option>
                {DEMAND_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </div>
          </Section>
        )}

        {/* ── TRIGGER_DEMAND_STATUS ────────────────────────────── */}
        {nodeType === 'TRIGGER_DEMAND_STATUS' && (
          <Section title="Mudança de Status">
            <div>
              <Label>De (opcional)</Label>
              <Select value={config.fromStatus ?? ''} onChange={(e: any) => setConfig('fromStatus', e.target.value)}>
                <option value="">Qualquer status</option>
                {DEMAND_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Para</Label>
              <Select value={config.status ?? ''} onChange={(e: any) => setConfig('status', e.target.value)}>
                <option value="">Selecionar...</option>
                {DEMAND_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
          </Section>
        )}

        {/* ── INPUT_FORM ───────────────────────────────────────── */}
        {nodeType === 'INPUT_FORM' && (
          <>
            <Section title="Informações do Formulário">
              <div>
                <Label>Título do formulário</Label>
                <Input
                  value={config.formTitle ?? ''}
                  onChange={(e: any) => setConfig('formTitle', e.target.value)}
                  placeholder="Ex: Solicitação de Análise Jurídica"
                />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <textarea
                  value={config.formDescription ?? ''}
                  onChange={(e) => setConfig('formDescription', e.target.value)}
                  placeholder="Explique o objetivo deste formulário..."
                  rows={2}
                  className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
                />
              </div>
            </Section>

            <Section title="Campos do Formulário">
              <FormFieldBuilder
                fields={config.fields ?? []}
                onChange={(fields) => setConfig('fields', fields)}
              />
            </Section>

            <Section title="Acesso ao Formulário" defaultOpen={false}>
              <div>
                <Label>Quem pode preencher</Label>
                <Select value={config.accessLevel ?? 'LINK'} onChange={(e: any) => setConfig('accessLevel', e.target.value)}>
                  <option value="LINK">Qualquer pessoa com o link</option>
                  <option value="CLIENT">Apenas clientes cadastrados</option>
                  <option value="LAWYER">Apenas advogados</option>
                </Select>
              </div>
              <div>
                <Label>Link de acesso</Label>
                <ShareUrl workflowId={workflowId} />
              </div>
            </Section>
          </>
        )}

        {/* ── INPUT_DEMAND_DATA ────────────────────────────────── */}
        {nodeType === 'INPUT_DEMAND_DATA' && (
          <Section title="Campos a Incluir">
            {['title', 'body', 'category', 'status', 'clientName', 'clientEmail'].map((field) => {
              const selected: string[] = config.fields ?? ['title', 'body', 'category']
              return (
                <label key={field} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(field)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, field]
                        : selected.filter((f) => f !== field)
                      setConfig('fields', next)
                    }}
                    className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
                  />
                  <span className="text-xs text-white font-mono">{field}</span>
                </label>
              )
            })}
          </Section>
        )}

        {/* ── CONDITION ────────────────────────────────────────── */}
        {nodeType === 'CONDITION' && (
          <Section title="Regra da Condição">
            <div>
              <Label>Campo</Label>
              <Input
                value={config.field ?? ''}
                onChange={(e: any) => setConfig('field', e.target.value)}
                placeholder="Ex: demandCategory"
                className="font-mono"
              />
              <p className="text-[10px] text-navy-500 mt-1">Use a chave interna de um campo de formulário ou dado da demanda</p>
            </div>
            <div>
              <Label>Operador</Label>
              <Select value={config.operator ?? 'equals'} onChange={(e: any) => setConfig('operator', e.target.value)}>
                <option value="equals">é igual a</option>
                <option value="not_equals">é diferente de</option>
                <option value="contains">contém</option>
                <option value="not_contains">não contém</option>
                <option value="gt">maior que</option>
                <option value="lt">menor que</option>
                <option value="is_empty">está vazio</option>
                <option value="is_not_empty">não está vazio</option>
              </Select>
            </div>
            {!['is_empty', 'is_not_empty'].includes(config.operator ?? '') && (
              <div>
                <Label>Valor</Label>
                <Input
                  value={config.value ?? ''}
                  onChange={(e: any) => setConfig('value', e.target.value)}
                  placeholder="Ex: CIVIL"
                />
              </div>
            )}
          </Section>
        )}

        {/* ── AI_ANALYZE ───────────────────────────────────────── */}
        {nodeType === 'AI_ANALYZE' && (
          <Section title="Configuração da IA">
            <div>
              <Label>Foco da análise</Label>
              {['Riscos jurídicos', 'Ações recomendadas', 'Prazo prescricional', 'Jurisprudência', 'Resumo executivo'].map((focus) => {
                const selected: string[] = config.focusAreas ?? ['Riscos jurídicos', 'Ações recomendadas']
                return (
                  <label key={focus} className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(focus)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selected, focus]
                          : selected.filter((f) => f !== focus)
                        setConfig('focusAreas', next)
                      }}
                      className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
                    />
                    <span className="text-xs text-white">{focus}</span>
                  </label>
                )
              })}
            </div>
            <div>
              <Label>Instrução adicional (opcional)</Label>
              <textarea
                value={config.customPrompt ?? ''}
                onChange={(e) => setConfig('customPrompt', e.target.value)}
                placeholder="Ex: Considere especialmente a legislação do estado de SP"
                rows={3}
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>
          </Section>
        )}

        {/* ── AI_SUMMARIZE ─────────────────────────────────────── */}
        {nodeType === 'AI_SUMMARIZE' && (
          <Section title="Configuração do Resumo">
            <div>
              <Label>Formato de saída</Label>
              <Select value={config.format ?? 'paragraph'} onChange={(e: any) => setConfig('format', e.target.value)}>
                <option value="paragraph">Parágrafo</option>
                <option value="bullets">Lista de pontos</option>
                <option value="structured">Estruturado (seções)</option>
              </Select>
            </div>
            <div>
              <Label>Tamanho máximo</Label>
              <Select value={config.maxLength ?? 'medium'} onChange={(e: any) => setConfig('maxLength', e.target.value)}>
                <option value="short">Curto (até 100 palavras)</option>
                <option value="medium">Médio (até 300 palavras)</option>
                <option value="long">Longo (até 600 palavras)</option>
              </Select>
            </div>
          </Section>
        )}

        {/* ── ACTION_NOTIFY ─────────────────────────────────────── */}
        {nodeType === 'ACTION_NOTIFY' && (
          <Section title="Configuração de Notificação">
            <div>
              <Label>Destinatário</Label>
              {NOTIFY_ROLES.map((r) => {
                const selected: string[] = config.recipients ?? ['LAWYER']
                return (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...selected, r.value]
                          : selected.filter((f) => f !== r.value)
                        setConfig('recipients', next)
                      }}
                      className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
                    />
                    <span className="text-xs text-white">{r.label}</span>
                  </label>
                )
              })}
            </div>
            <div>
              <Label>Mensagem</Label>
              <textarea
                value={config.message ?? ''}
                onChange={(e) => setConfig('message', e.target.value)}
                placeholder="Ex: Sua demanda foi processada e está pronta para revisão."
                rows={3}
                className="w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={config.channel ?? 'in_app'} onChange={(e: any) => setConfig('channel', e.target.value)}>
                <option value="in_app">Notificação no sistema</option>
                <option value="email">E-mail</option>
                <option value="both">Sistema + E-mail</option>
              </Select>
            </div>
          </Section>
        )}

        {/* ── ACTION_UPDATE_STATUS ─────────────────────────────── */}
        {nodeType === 'ACTION_UPDATE_STATUS' && (
          <Section title="Atualização de Status">
            <div>
              <Label>Novo status</Label>
              <Select value={config.status ?? ''} onChange={(e: any) => setConfig('status', e.target.value)}>
                <option value="">Selecionar...</option>
                {DEMAND_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </div>
            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                value={config.reason ?? ''}
                onChange={(e: any) => setConfig('reason', e.target.value)}
                placeholder="Ex: Processado automaticamente pelo fluxo"
              />
            </div>
          </Section>
        )}

        {/* ── ACTION_ASSIGN_REVIEWER ───────────────────────────── */}
        {nodeType === 'ACTION_ASSIGN_REVIEWER' && (
          <Section title="Atribuição de Revisor">
            <div>
              <Label>Modo de seleção</Label>
              <Select value={config.mode ?? 'auto'} onChange={(e: any) => setConfig('mode', e.target.value)}>
                <option value="auto">Automático (disponível)</option>
                <option value="round_robin">Rotativo</option>
                <option value="least_busy">Menos ocupado</option>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifyReviewer ?? true}
                onChange={(e) => setConfig('notifyReviewer', e.target.checked)}
                className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
              />
              <span className="text-xs text-white">Notificar revisor por e-mail</span>
            </label>
          </Section>
        )}

        {/* ── ACCESS_CONTROL ───────────────────────────────────── */}
        {nodeType === 'ACCESS_CONTROL' && (
          <>
            <Section title="Permissões de Acesso">
              <div>
                <Label>Quem pode executar este fluxo</Label>
                {['LAWYER', 'CLIENT', 'REVIEWER'].map((role) => {
                  const roles: string[] = config.roles ?? ['LAWYER']
                  return (
                    <label key={role} className="flex items-center gap-2 cursor-pointer mb-1.5">
                      <input
                        type="checkbox"
                        checked={roles.includes(role)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...roles, role]
                            : roles.filter((r) => r !== role)
                          setConfig('roles', next)
                        }}
                        className="h-3.5 w-3.5 rounded border-navy-600 bg-navy-800 text-gold-500"
                      />
                      <span className="text-xs text-white">{role}</span>
                    </label>
                  )
                })}
              </div>
              <div>
                <Label>Visibilidade do resultado</Label>
                <Select value={config.resultVisibility ?? 'LAWYER'} onChange={(e: any) => setConfig('resultVisibility', e.target.value)}>
                  <option value="LAWYER">Apenas advogado</option>
                  <option value="LAWYER_CLIENT">Advogado + cliente</option>
                  <option value="ALL">Todos os envolvidos</option>
                </Select>
              </div>
            </Section>

            <Section title="Link de Acesso Externo" defaultOpen={false}>
              <ShareUrl workflowId={workflowId} />
            </Section>
          </>
        )}
      </div>
    </aside>
  )
}
