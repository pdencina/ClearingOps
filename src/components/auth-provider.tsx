'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { LoginScreen } from '@/components/login-screen'
import { Sidebar } from '@/components/sidebar'

interface User {
  email: string
  name: string
  role: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({ user: null, logout: () => {} })

export function useAuth() {
  return useContext(AuthContext)
}

// Credenciales válidas para la demo
const VALID_USERS: Record<string, { password: string; user: User }> = {
  'pablo.encina@klap.cl': {
    password: 'klap2025',
    user: { email: 'pablo.encina@klap.cl', name: 'Pablo Encina', role: 'Administrador', avatar: 'PE' },
  },
  'admin@klap.cl': {
    password: 'admin123',
    user: { email: 'admin@klap.cl', name: 'Admin KLAP', role: 'Super Admin', avatar: 'AK' },
  },
  'demo@klap.cl': {
    password: 'demo',
    user: { email: 'demo@klap.cl', name: 'Usuario Demo', role: 'Viewer', avatar: 'UD' },
  },
}

export function validateCredentials(email: string, password: string): User | null {
  const entry = VALID_USERS[email.toLowerCase()]
  if (entry && entry.password === password) return entry.user
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for saved session
    const saved = localStorage.getItem('klap_session')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = (loggedUser: User) => {
    setUser(loggedUser)
    localStorage.setItem('klap_session', JSON.stringify(loggedUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('klap_session')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-muted">Cargando KLAP CORE...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={login} />
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 overflow-auto min-h-screen">
          {children}
        </main>
      </div>
    </AuthContext.Provider>
  )
}
