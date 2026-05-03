import Link from 'next/link'
import { Clock } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function PendentePage() {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-500/20">
        <Clock size={40} className="text-gold-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Conta em análise</h2>
        <p className="text-navy-400">
          Seu cadastro está sendo revisado pela equipe Desk-yura.
          Assim que aprovado, você receberá um e-mail com as instruções de acesso.
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
