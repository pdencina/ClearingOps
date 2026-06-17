'use client'

import { useState } from 'react'
import { validateCredentials } from '@/components/auth-provider'
import { Zap, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'

interface User {
  email: string
  name: string
  role: string
  avatar: string
}

interface Props {
  onLogin: (user: User) => void
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800))

    const user = validateCredentials(email, password)
    if (user) {
      onLogin(user)
    } else {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2a] to-[#1a0a2e]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-purple-600/15 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">KLAP CORE</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">Payment Operating System</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              El sistema de pagos<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
                cloud-native de KLAP
              </span>
            </h2>
            <p className="text-base text-white/50 max-w-md leading-relaxed">
              Autorización, clearing, liquidación, fraude y conciliación. 
              Todo en una plataforma cloud-native independiente.
            </p>
            <div className="flex items-center gap-6 text-white/40">
              <div className="text-center">
                <p className="text-2xl font-bold text-white/80">17</p>
                <p className="text-[10px] uppercase tracking-wider">Engines</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white/80">22</p>
                <p className="text-[10px] uppercase tracking-wider">APIs</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white/80">21</p>
                <p className="text-[10px] uppercase tracking-wider">Pantallas</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white/80">100x</p>
                <p className="text-[10px] uppercase tracking-wider">Más rápido</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/20">© 2025 KLAP · Todos los derechos reservados</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">KLAP CORE</h1>
              <p className="text-[10px] text-muted uppercase tracking-[0.3em]">Payment OS</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
            <p className="text-sm text-muted mt-2">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.nombre@klap.cl"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Acceder al Sistema
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <p className="text-[10px] text-muted/50 text-center">
            Conexión cifrada con TLS 1.3 · Sesión expira en 24 horas · Audit log activado
          </p>
        </div>
      </div>
    </div>
  )
}
