// ============================================
// Vista: Actualizar Contraseña (Invitaciones)
// src/pages/ActualizarPassword.jsx
// ============================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2
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

export default function ActualizarPassword() {
  const navigate = useNavigate()

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // Validaciones básicas
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.password
      })

      if (updateError) throw updateError

      setSuccess(true)

      // Pequeña espera para mostrar el éxito antes de redirigir
      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (err) {
      console.error('Error actualizando contraseña:', err)
      setError(err.message || 'No se pudo actualizar la contraseña.')
      setLoading(false)
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
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Configura tu cuenta</h1>
          <p className="text-sm text-slate-400 mt-1">Ingresa una contraseña segura para acceder a tu panel</p>
        </div>

        {/* ── Card principal ── */}
        <div className="glass rounded-3xl border border-white/12 shadow-2xl overflow-hidden relative">

          {/* Overlay de Éxito */}
          {success && (
            <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">¡Contraseña configurada!</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Tu cuenta ha sido activada correctamente. Redirigiendo al panel...
              </p>
            </div>
          )}

          {/* Header de la tarjeta */}
          <div className="px-8 pt-8 pb-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
                <Lock size={18} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 tracking-tight">Establecer Contraseña</h2>
                <p className="text-xs text-slate-500 mt-0.5">Define tu llave de acceso personalizada</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

            {/* Error global */}
            {error && (
              <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs animate-in slide-in-from-top-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Nueva Contraseña */}
            <InputField
              label="Nueva Contraseña"
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
                  className="text-slate-500 hover:text-slate-300 transition-colors px-1"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Confirmar Contraseña */}
            <InputField
              label="Confirmar Contraseña"
              icon={ShieldCheck}
              name="confirmPassword"
              type={showPwd ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-white text-slate-950 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5 active:scale-[0.98]"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin text-indigo-600" /> Guardando...</>
                ) : (
                  <>Activar Cuenta</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-8">
          Seguridad de Datos Protegida por Supabase Auth
        </p>
      </div>
    </div>
  )
}
