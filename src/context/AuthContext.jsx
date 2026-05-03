import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'vaad_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { localStorage.removeItem(STORAGE_KEY) }
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
