import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Desk-yura — Plataforma Jurídica',
  description: 'Apoio jurídico inteligente com análise por IA e revisão humana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-navy-950 text-white antialiased">{children}</body>
    </html>
  )
}
