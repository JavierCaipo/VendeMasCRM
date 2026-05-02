// ============================================
// Login Page — SuperAdmin Auth
// src/pages/Login.jsx
// ============================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
            <Shield size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">SuperAdmin</h1>
          <p className="text-sm text-slate-400 mt-1">VendeMas · Control Global</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-white/15 p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Email <span className="text-indigo-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="superadmin@vendemas.app"
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Contraseña <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white flex items-center justify-center gap-2 transition-all mt-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Autenticando…</> : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Acceso restringido · Solo SuperAdmins autorizados
        </p>
      </div>
    </div>
  )
}
