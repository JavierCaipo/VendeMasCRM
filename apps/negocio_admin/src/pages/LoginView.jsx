import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck, Loader2, AlertCircle, Eye, EyeOff, Lock, Mail, CheckCircle2
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// ── Sub-componente: InputField ────────────────────────────────
function InputField({ label, icon: Icon, name, type = 'text', value, onChange,
                      placeholder, error, required, suffix }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label} {required && <span className="text-indigo-400">*</span>}
      </label>
      <div className={`
        flex items-center gap-2 px-3 py-2.5 rounded-xl
        bg-white/5 border transition-all duration-150
        ${error ? 'border-red-500/60' : 'border-white/10 focus-within:border-indigo-500/60'}
      `}>
        {Icon && <Icon size={15} className="text-slate-500 flex-shrink-0" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none min-w-0"
        />
        {suffix}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState(null)
  const [plgSuccess, setPlgSuccess] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const registered = searchParams.get('registered')
    const plg = searchParams.get('plg')

    if (emailParam) {
      setForm(prev => ({ ...prev, email: emailParam }))
    }
    if (registered === 'true' && plg === 'true') {
      setPlgSuccess(true)
    }
  }, [searchParams])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setGlobalError('Credenciales inválidas. Verifica tu email y contraseña.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-up">

        {/* ── Logo / Branding ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
            <ShieldCheck size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">VendeMas Business</h1>
          <p className="text-sm text-slate-400 mt-1">Portal de acceso para administradores</p>
        </div>

        {/* ── Card principal ── */}
        <div className="glass rounded-2xl border border-white/12 shadow-2xl overflow-hidden">
          {/* Header de la tarjeta */}
          <div className="px-6 pt-6 pb-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
                <Lock size={16} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Iniciar Sesión</h2>
                <p className="text-xs text-slate-400">Ingresa tus credenciales para continuar</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Banner PLG Exitoso */}
            {plgSuccess && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <p className="font-bold text-white uppercase tracking-wider mb-0.5 text-[9px]">¡Portal Starter Creado!</p>
                  <p className="leading-relaxed">Tu CRM Next-Gen 2035 ha sido provisionado. Inicia sesión para comenzar.</p>
                </div>
              </div>
            )}

            {/* Error global */}
            {globalError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{globalError}</span>
              </div>
            )}

            {/* Campo: Email */}
            <InputField
              label="Email"
              icon={Mail}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
            />

            {/* Campo: Contraseña */}
            <InputField
              label="Contraseña"
              icon={Lock}
              name="password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Autenticando…</>
              ) : (
                <><ShieldCheck size={16} /> Iniciar Sesión</>
              )}
            </button>

            <div className="mt-6 text-center text-sm text-slate-400">
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                Crea tu portal SaaS
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Plataforma segura · VendeMas SaaS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
