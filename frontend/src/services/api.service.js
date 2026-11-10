import axios from 'axios'

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Auth interceptor - attaches auth token from cookies
const authInterceptor = () => {
  // Request interceptor
  api.interceptors.request.use(
    async (config) => {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.user && data.user.token) {
          config.headers.Authorization = `Bearer ${data.user.token}`
        }
      }
      return config
    },
    (error) => Promise.reject(error)
  )
}

export { api, authInterceptor }