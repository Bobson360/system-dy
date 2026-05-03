import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'gold' | 'green' | 'red' | 'purple'
}

const colorMap = {
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  gold:   'bg-gold-500/10 text-gold-500 border-gold-500/20',
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-5 transition-colors hover:border-navy-700">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-navy-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-navy-500">{subtitle}</p>}
        </div>
        <div className={cn('rounded-lg border p-2.5', colorMap[color])}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.value >= 0 ? 'text-green-400' : 'text-red-400'}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-navy-500">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
