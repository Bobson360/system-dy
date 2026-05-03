'use client'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-navy-200">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full rounded-lg border bg-navy-800 px-4 py-2.5 text-white',
          'border-navy-600 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500',
          'transition-colors duration-200',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-navy-800">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  ),
)

Select.displayName = 'Select'
export default Select
