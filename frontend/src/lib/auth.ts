import Cookies from 'js-cookie'
import api from './api'

export interface User {
  id: string
  email: string
  role: 'SUPERADMIN' | 'REVIEWER' | 'LAWYER' | 'CLIENT'
  firstName: string
  lastName: string
  status: string
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password })
  Cookies.set('access_token', data.accessToken, { expires: 1 / 96 }) // 15min
  Cookies.set('refresh_token', data.refreshToken, { expires: 7 })
  return data.user as User
}

export async function getMe(): Promise<User | null> {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch {
    return null
  }
}

export function logout() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  window.location.href = '/login'
}

export function isAuthenticated() {
  return !!Cookies.get('access_token')
}

export function roleRedirect(role: string): string {
  switch (role) {
    case 'SUPERADMIN': return '/admin/dashboard'
    case 'REVIEWER':   return '/revisor/dashboard'
    case 'LAWYER':     return '/advogado/dashboard'
    case 'CLIENT':     return '/cliente/dashboard'
    default:           return '/login'
  }
}
