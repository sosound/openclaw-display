import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  userId: string
  username: string
  exp: number
}

interface AuthContextType {
  token: string | null
  user: { userId: string; username: string } | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token')
  })
  const [user, setUser] = useState<{ userId: string; username: string } | null>(null)

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token)
        setUser({ userId: decoded.userId, username: decoded.username })
        localStorage.setItem('auth_token', token)
      } catch (error) {
        console.error('Invalid token:', error)
        logout()
      }
    } else {
      setUser(null)
      localStorage.removeItem('auth_token')
    }
  }, [token])

  const login = (newToken: string) => {
    setToken(newToken)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
