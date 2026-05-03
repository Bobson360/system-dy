'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getMe, roleRedirect } from '@/lib/auth'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    getMe().then((user) => {
      if (!user) router.push('/login')
      else router.push(roleRedirect(user.role))
    })
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-navy-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-700 border-t-gold-500" />
    </div>
  )
}
