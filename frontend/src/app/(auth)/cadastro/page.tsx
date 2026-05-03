'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User, Mail, Lock, Eye, EyeOff, Phone,
  Briefcase, MapPin, AlertCircle, CheckCircle2,
} from 'lucide-react'
import api from '@/lib/api'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

const ESPECIALIDADES = [
  { value: 'CIVIL',        label: 'Direito Civil' },
  { value: 'CRIMINAL',     label: 'Direito Criminal' },
  { value: 'LABOR',        label: 'Direito Trabalhista' },
  { value: 'FAMILY',       label: 'Direito de Família' },
  { value: 'CONSUMER',     label: 'Direito do Consumidor' },
  { value: 'CORPORATE',    label: 'Direito Empresarial' },
  { value: 'TAX',          label: 'Direito Tributário' },
  { value: 'REAL_ESTATE',  label: 'Direito Imobiliário' },
  { value: 'OTHER',        label: 'Outros' },
]

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName:  z.string().min(2, 'Mínimo 2 caracteres'),
  email:     z.string().email('E-mail inválido'),
  phone:     z.string().optional(),
  oabNumber: z.string().min(5, 'Informe o número OAB completo'),
  oabState:  z.string().length(2, 'Selecione o estado'),
  specialty: z.string().min(1, 'Selecione uma especialidade'),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [serverError, setServerError]   = useState('')
  const [success, setSuccess]           = useState(false)
  const [step, setStep]                 = useState<1 | 2>(1)

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function goToStep2() {
    const ok = await trigger(['firstName', 'lastName', 'email', 'phone'])
    if (ok) setStep(2)
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      await api.post('/lawyers/register', {
        firstName:   data.firstName,
        lastName:    data.lastName,
        email:       data.email,
        phone:       data.phone,
        oabNumber:   `OAB/${data.oabState} ${data.oabNumber}`,
        oabState:    data.oabState,
        specialties: [data.specialty],
        password:    data.password,
      })
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setServerError(
        Array.isArray(msg) ? msg[0] : msg ?? 'Erro ao realizar cadastro.',
      )
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Cadastro enviado!</h2>
          <p className="text-navy-400">
            Seu cadastro foi recebido e está aguardando aprovação do administrador.
            Você receberá um e-mail assim que sua conta for ativada.
          </p>
        </div>
        <Link href="/login">
          <Button variant="ghost" className="w-48">
            Voltar para o login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* cabeçalho */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Criar conta</h2>
        <p className="text-sm text-navy-400">
          Cadastro exclusivo para advogados
        </p>
      </div>

      {/* stepper */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                s === step
                  ? 'bg-gold-500 text-navy-950'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-navy-700 text-navy-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            <span className={`text-xs ${s === step ? 'text-white' : 'text-navy-500'}`}>
              {s === 1 ? 'Dados pessoais' : 'OAB & Acesso'}
            </span>
            {s < 2 && <div className="mx-2 h-px w-8 bg-navy-700" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Nome"
                placeholder="João"
                icon={<User size={14} />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Sobrenome"
                placeholder="Silva"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="E-mail profissional"
              type="email"
              placeholder="joao@escritorio.com"
              icon={<Mail size={14} />}
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Telefone (opcional)"
              type="tel"
              placeholder="(11) 99999-9999"
              icon={<Phone size={14} />}
              {...register('phone')}
            />
            <Button type="button" onClick={goToStep2}>
              Continuar
            </Button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Número OAB"
                  placeholder="123456"
                  icon={<Briefcase size={14} />}
                  error={errors.oabNumber?.message}
                  {...register('oabNumber')}
                />
              </div>
              <Select
                label="Estado"
                error={errors.oabState?.message}
                options={[
                  { value: '', label: 'UF' },
                  ...ESTADOS_BR.map((e) => ({ value: e, label: e })),
                ]}
                {...register('oabState')}
              />
            </div>

            <Select
              label="Principal especialidade"
              error={errors.specialty?.message}
              options={[
                { value: '', label: 'Selecione...' },
                ...ESPECIALIDADES,
              ]}
              {...register('specialty')}
            />

            {/* senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-200">Senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-navy-400 transition-colors duration-200 focus:outline-none focus:ring-1 ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-navy-600 focus:border-gold-500 focus:ring-gold-500'
                  }`}
                  {...register('password')}
                />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-navy-200">Confirmar senha</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
                  <Lock size={14} />
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-navy-400 transition-colors duration-200 focus:outline-none focus:ring-1 ${
                    errors.confirm
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-navy-600 focus:border-gold-500 focus:ring-gold-500'
                  }`}
                  {...register('confirm')}
                />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200">
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-400">{errors.confirm.message}</p>}
            </div>

            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-sm text-red-400">{serverError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} className="w-1/3">
                Voltar
              </Button>
              <Button type="submit" loading={isSubmitting} className="flex-1">
                Criar conta
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-navy-500">
        Já tem conta?{' '}
        <Link href="/login" className="text-gold-500 hover:text-gold-400 font-medium transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  )
}
