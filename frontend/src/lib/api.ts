import axios from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = Cookies.get('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${BASE_URL}/auth/refresh`,
            { refreshToken },
          )
          Cookies.set('access_token', data.accessToken, { expires: 1 / 96 })
          Cookies.set('refresh_token', data.refreshToken, { expires: 7 })
          original.headers.Authorization = `Bearer ${data.accessToken}`
          return api(original)
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api
