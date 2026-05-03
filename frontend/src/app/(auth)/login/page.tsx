'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { login, roleRedirect } from '@/lib/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError('')
    try {
      const user = await login(data.email, data.password)
      router.push(roleRedirect(user.role))
    } catch (err: any) {
      const msg = err?.response?.data?.message
      if (Array.isArray(msg)) {
        setServerError(msg[0])
      } else if (typeof msg === 'string') {
        setServerError(msg)
      } else {
        setServerError('Erro ao realizar login. Tente novamente.')
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* cabeçalho */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
        <p className="text-sm text-navy-400">
          Entre com suas credenciais para acessar a plataforma
        </p>
      </div>

      {/* formulário */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-navy-200">Senha</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full rounded-lg border bg-white/5 py-2.5 pl-10 pr-10 text-white placeholder-navy-400 transition-colors duration-200 focus:outline-none focus:ring-1 ${
                errors.password
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-navy-600 focus:border-gold-500 focus:ring-gold-500'
              }`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-200 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>

        {/* erro do servidor */}
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <Button type="submit" loading={isSubmitting} className="mt-2">
          Entrar na plataforma
        </Button>
      </form>

      {/* divisor */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy-800" />
        </div>
        <div className="relative flex justify-center text-xs text-navy-500">
          <span className="bg-navy-950 px-3">Novo por aqui?</span>
        </div>
      </div>

      {/* cadastro */}
      <div className="space-y-3 text-center">
        <p className="text-sm text-navy-400">
          Advogado e quer usar a plataforma?
        </p>
        <Link href="/cadastro">
          <Button variant="ghost">
            Criar conta de advogado
          </Button>
        </Link>
      </div>
    </div>
  )
}
