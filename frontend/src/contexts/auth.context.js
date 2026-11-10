import { createContext, useContext, useState, useEffect } from 'react'

// Auth Context
const AuthContext = createContext()

const useAuth = () => {
  const { user, isLoading, login, logout } = useContext(AuthContext)
  return { user, isLoading, login, logout }
}

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error('Auth fetch error', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  const login = async (credentials) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { credentials: 'include' })
    setUser(null)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
)

export { useAuth, AuthProvider }