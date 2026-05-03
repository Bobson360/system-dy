import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  DRAFT:          { label: 'Rascunho',         className: 'bg-navy-700 text-navy-300' },
  ANALYZING:      { label: 'Analisando IA',    className: 'bg-blue-500/20 text-blue-400' },
  PENDING_REVIEW: { label: 'Aguarda revisão',  className: 'bg-yellow-500/20 text-yellow-400' },
  REVIEWED:       { label: 'Revisado',         className: 'bg-green-500/20 text-green-400' },
  COMPLETED:      { label: 'Concluído',        className: 'bg-green-500/20 text-green-400' },
  REJECTED:       { label: 'Rejeitado',        className: 'bg-red-500/20 text-red-400' },
  ACTIVE:         { label: 'Ativo',            className: 'bg-green-500/20 text-green-400' },
  INACTIVE:       { label: 'Inativo',          className: 'bg-navy-700 text-navy-400' },
  PENDING_APPROVAL:{ label: 'Aguarda aprovação',className: 'bg-yellow-500/20 text-yellow-400' },
  BLOCKED:        { label: 'Bloqueado',        className: 'bg-red-500/20 text-red-400' },
  PAID:           { label: 'Pago',             className: 'bg-green-500/20 text-green-400' },
  PENDING:        { label: 'Pendente',         className: 'bg-yellow-500/20 text-yellow-400' },
  OVERDUE:        { label: 'Vencido',          className: 'bg-red-500/20 text-red-400' },
  CANCELLED:      { label: 'Cancelado',        className: 'bg-navy-700 text-navy-400' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, className: 'bg-navy-700 text-navy-300' }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
