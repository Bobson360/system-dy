'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { Scale, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

interface FormField {
  id: string
  key: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string
}

interface FormDef {
  workflowId: string
  workflowName: string
  formTitle: string
  formDescription: string | null
  fields: FormField[]
  isActive: boolean
}

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'not_found'

export default function PublicFormPage() {
  const params = useParams()
  const id = params.id as string

  const [state, setState] = useState<PageState>('loading')
  const [form, setForm] = useState<FormDef | null>(null)
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    axios.get(`${BASE_URL}/workflows/${id}/public`)
      .then(({ data }) => {
        setForm(data)
        const initial: Record<string, any> = {}
        data.fields.forEach((f: FormField) => { initial[f.key] = f.type === 'checkbox' ? false : '' })
        setValues(initial)
        setState('ready')
      })
      .catch((e) => {
        setState(e.response?.status === 404 ? 'not_found' : 'error')
      })
  }, [id])

  const setValue = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    form?.fields.forEach((f) => {
      if (f.required && !values[f.key] && values[f.key] !== false) {
        errs[f.key] = 'Campo obrigatório'
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setState('submitting')
    try {
      await axios.post(`${BASE_URL}/workflows/${id}/submit`, values)
      setState('success')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message ?? 'Erro ao enviar formulário. Tente novamente.')
      setState('error')
    }
  }

  const renderField = (field: FormField) => {
    const baseClass = `w-full rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none ${
      errors[field.key]
        ? 'border-red-500 bg-red-500/5 text-white focus:border-red-400'
        : 'border-navy-700 bg-navy-800 text-white placeholder-navy-500 focus:border-gold-500'
    }`

    if (field.type === 'textarea') {
      return (
        <textarea
          value={values[field.key] ?? ''}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`${baseClass} resize-none`}
        />
      )
    }

    if (field.type === 'select') {
      const opts = (field.options ?? '').split('\n').filter(Boolean)
      return (
        <select
          value={values[field.key] ?? ''}
          onChange={(e) => setValue(field.key, e.target.value)}
          className={baseClass}
        >
          <option value="">Selecionar...</option>
          {opts.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!values[field.key]}
            onChange={(e) => setValue(field.key, e.target.checked)}
            className="h-5 w-5 rounded border-navy-600 bg-navy-800 text-gold-500 focus:ring-gold-500"
          />
          <span className="text-sm text-white">{field.label}</span>
        </label>
      )
    }

    return (
      <input
        type={field.type}
        value={values[field.key] ?? ''}
        onChange={(e) => setValue(field.key, e.target.value)}
        placeholder={field.placeholder}
        className={baseClass}
      />
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-navy-800 bg-navy-900 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
            <Scale size={16} className="text-navy-950" />
          </div>
          <span className="text-sm font-bold text-white">Desk-yura</span>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-2xl">

          {/* Loading */}
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="animate-spin text-gold-500" />
              <p className="text-navy-400 text-sm">Carregando formulário...</p>
            </div>
          )}

          {/* Not found */}
          {state === 'not_found' && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <AlertCircle size={40} className="text-navy-500" />
              <div>
                <p className="text-white font-semibold text-lg">Formulário não encontrado</p>
                <p className="text-navy-400 text-sm mt-1">Este link pode ter sido desativado ou não existe.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="rounded-xl border border-red-800 bg-red-500/10 p-6 text-center">
              <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
              <p className="text-white font-medium">{errorMsg || 'Ocorreu um erro inesperado.'}</p>
              <button
                onClick={() => setState('ready')}
                className="mt-4 text-sm text-red-400 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-xl">Enviado com sucesso!</p>
                <p className="text-navy-400 text-sm mt-2">
                  Suas respostas foram recebidas e o fluxo de trabalho foi iniciado.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          {(state === 'ready' || state === 'submitting') && form && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header card */}
              <div className="rounded-2xl border border-navy-800 bg-navy-900 p-6">
                <h1 className="text-xl font-bold text-white">{form.formTitle}</h1>
                {form.formDescription && (
                  <p className="mt-2 text-sm text-navy-400">{form.formDescription}</p>
                )}
                {!form.isActive && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                    <AlertCircle size={13} />
                    Este fluxo está em modo rascunho — as respostas serão processadas normalmente.
                  </div>
                )}
              </div>

              {/* Fields */}
              {form.fields.length === 0 ? (
                <div className="rounded-xl border border-navy-800 bg-navy-900 p-8 text-center">
                  <p className="text-navy-500 text-sm">Este formulário ainda não tem campos configurados.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-navy-800 bg-navy-900 p-6 space-y-5">
                  {form.fields.map((field) => (
                    <div key={field.id}>
                      {field.type !== 'checkbox' && (
                        <label className="block text-sm font-medium text-white mb-1.5">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                      )}
                      {renderField(field)}
                      {errors[field.key] && (
                        <p className="mt-1 text-xs text-red-400">{errors[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={state === 'submitting' || form.fields.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 py-3.5 text-sm font-semibold text-navy-950 hover:bg-gold-400 transition-colors disabled:opacity-50"
              >
                {state === 'submitting' ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Send size={16} /> Enviar</>
                )}
              </button>
            </form>
          )}

        </div>
      </main>

      <footer className="border-t border-navy-800 py-4 text-center text-xs text-navy-600">
        Powered by <span className="text-navy-400">Desk-yura</span>
      </footer>
    </div>
  )
}
