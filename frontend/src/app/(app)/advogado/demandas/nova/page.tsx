'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'

const schema = z.object({
  clientId:  z.string().uuid('Selecione um cliente'),
  category:  z.enum(['CIVIL', 'CRIMINAL', 'LABOR', 'FAMILY', 'CONSUMER'], {
    required_error: 'Selecione uma categoria',
  }),
  title: z.string().min(5, 'Título muito curto (mín. 5 caracteres)'),
  body:  z.string().min(20, 'Descrição muito curta (mín. 20 caracteres)'),
})

type FormData = z.infer<typeof schema>

interface ClientOption {
  id: string
  user: { firstName: string; lastName: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  LABOR: 'Trabalhista',
  FAMILY: 'Família',
  CONSUMER: 'Consumidor',
}

export default function NovaDemandaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId') ?? ''

  const [clients, setClients]     = useState<ClientOption[]>([])
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { clientId: preselectedClientId },
  })

  useEffect(() => {
    api
      .get('/clients?limit=200')
      .then(({ data }) => setClients(data.data))
      .catch(() => {})
  }, [])

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const { data: demand } = await api.post('/demands', data)
      router.push(`/advogado/demandas/${demand.id}`)
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? 'Erro ao criar demanda.')
    }
  }

  return (
    <div className="flex flex-col">
      <Topbar
        title="Nova demanda"
        subtitle="Descreva a demanda jurídica do cliente"
        actions={
          <Link
            href="/advogado/demandas"
            className="flex items-center gap-2 rounded-lg border border-navy-700 px-4 py-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Voltar
          </Link>
        }
      />

      <div className="flex-1 p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto max-w-2xl space-y-6 rounded-xl border border-navy-800 bg-navy-900 p-8"
        >
          {serverError && (
            <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{serverError}</p>
          )}

          <Field label="Cliente" error={errors.clientId?.message}>
            <select {...register('clientId')} className={selectCls}>
              <option value="">Selecione um cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.firstName} {c.user.lastName}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Categoria" error={errors.category?.message}>
            <select {...register('category')} className={selectCls}>
              <option value="">Selecione uma categoria...</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Título" error={errors.title?.message}>
            <input
              {...register('title')}
              placeholder="Ex: Revisão de contrato de prestação de serviços"
              className={inputCls}
            />
          </Field>

          <Field label="Descrição detalhada" error={errors.body?.message}>
            <textarea
              {...register('body')}
              rows={8}
              placeholder="Descreva em detalhes a situação jurídica, os fatos relevantes e o que o cliente necessita..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          <p className="rounded-lg bg-navy-800 px-4 py-3 text-xs text-navy-400">
            A demanda será salva como rascunho. Você poderá submeter para análise de IA na tela de detalhes.
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
          >
            <Send size={15} />
            {isSubmitting ? 'Salvando...' : 'Salvar rascunho'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none'

const selectCls =
  'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-navy-400">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
