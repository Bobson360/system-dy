'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import api from '@/lib/api'
import Topbar from '@/components/dashboard/Topbar'

const schema = z.object({
  firstName: z.string().min(2, 'Nome muito curto'),
  lastName:  z.string().min(2, 'Sobrenome muito curto'),
  email:     z.string().email('E-mail inválido'),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  phone:     z.string().optional(),
  cpfCnpj:   z.string().optional(),
  address:   z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NovoClientePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await api.post('/clients', data)
      router.push('/advogado/clientes')
    } catch (err: any) {
      setServerError(err.response?.data?.message ?? 'Erro ao cadastrar cliente.')
    }
  }

  return (
    <div className="flex flex-col">
      <Topbar
        title="Novo cliente"
        subtitle="Cadastre um cliente vinculado à sua conta"
        actions={
          <Link
            href="/advogado/clientes"
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nome" error={errors.firstName?.message}>
              <input {...register('firstName')} placeholder="João" className={inputCls} />
            </Field>
            <Field label="Sobrenome" error={errors.lastName?.message}>
              <input {...register('lastName')} placeholder="Silva" className={inputCls} />
            </Field>
          </div>

          <Field label="E-mail" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="joao@email.com" className={inputCls} />
          </Field>

          <Field label="Senha de acesso" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" className={inputCls} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Telefone" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="(11) 99999-9999" className={inputCls} />
            </Field>
            <Field label="CPF / CNPJ" error={errors.cpfCnpj?.message}>
              <input {...register('cpfCnpj')} placeholder="000.000.000-00" className={inputCls} />
            </Field>
          </div>

          <Field label="Endereço" error={errors.address?.message}>
            <input {...register('address')} placeholder="Rua, número, bairro, cidade" className={inputCls} />
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold-500 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60 transition-colors"
          >
            <UserPlus size={16} />
            {isSubmitting ? 'Cadastrando...' : 'Cadastrar cliente'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder-navy-500 focus:border-gold-500 focus:outline-none'

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
