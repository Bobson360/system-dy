export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Painel esquerdo — brand */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-navy-900 p-12 lg:flex">
        {/* padrão de fundo */}
        <div className="absolute inset-0 bg-auth-pattern opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950/60 via-transparent to-navy-800/40" />

        {/* logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500">
            <svg className="h-6 w-6 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3v6c0 5.25-4.5 9.75-9 11.25C7.5 21.75 3 17.25 3 12V6z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Desk-yura</span>
        </div>

        {/* conteúdo central */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Apoio jurídico<br />
              <span className="text-gold-500">inteligente</span>
            </h1>
            <p className="text-lg text-navy-300">
              Análise de demandas por IA com revisão humana especializada.
              Agilidade sem abrir mão do rigor jurídico.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '⚡', title: 'Análise rápida', desc: 'IA analisa demandas em segundos' },
              { icon: '🔍', title: 'Revisão humana', desc: 'Especialistas validam cada parecer' },
              { icon: '🔒', title: 'Dados isolados', desc: 'Cada cliente vê apenas o seu' },
              { icon: '📊', title: 'Painel completo', desc: 'Gestão financeira e de casos' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-navy-700 bg-navy-800/50 p-4">
                <div className="text-2xl">{item.icon}</div>
                <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-navy-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-navy-500">
          © {new Date().getFullYear()} Desk-yura. Todos os direitos reservados.
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-navy-950 p-8 lg:w-1/2">
        {/* logo mobile */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
            <svg className="h-5 w-5 text-navy-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3v6c0 5.25-4.5 9.75-9 11.25C7.5 21.75 3 17.25 3 12V6z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Desk-yura</span>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
