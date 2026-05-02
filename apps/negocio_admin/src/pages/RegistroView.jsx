// ============================================
// CERCO 3 — RegistroView (La Puerta de Entrada)
// src/pages/RegistroView.jsx
//
// Flujo:
//   1. Lee ?token= de la URL
//   2. Valida el token contra la tabla `invitaciones`
//   3. Muestra el email pre-cargado y solicita documento + password
//   4. Valida documento antes de llamar a signUp
//   5. Redirige al dashboard en caso de éxito
// ============================================
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck, Loader2, AlertCircle, Eye, EyeOff,
  CheckCircle2, Lock, User, Mail, FileText,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// ── Fases del componente ─────────────────────────────────────
// 'loading'   → validando token en Supabase
// 'invalid'   → token ausente, expirado o no encontrado
// 'form'      → formulario listo para rellenar
// 'submitting'→ en proceso de signUp
// 'success'   → registro exitoso (breve antes del redirect)

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
export default function RegistroView() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token')

  // Estado de fase
  const [fase,       setFase]       = useState('loading')   // loading | invalid | form | submitting | success
  const [invitacion, setInvitacion] = useState(null)        // { id, email, documento, negocio_id }

  // Estado del formulario
  const [form, setForm] = useState({
    email: '',
    empresa: '',
    documento: '',
    password: '',
    confirmar: ''
  })
  const [showPwd, setShowPwd] = useState(false)
  const [showPwd2, setShowPwd2] = useState(false)

  // Errores por campo
  const [fieldErrors, setFieldErrors] = useState({})
  // Error global
  const [globalError, setGlobalError] = useState(null)

  // ── Fase 1: Validar token al montar ───────────────────────
  useEffect(() => {
    if (!token) {
      setFase('form')
      return
    }

    async function validarToken() {
      const { data, error } = await supabase
        .from('invitaciones')
        .select('id, email, documento, estado, negocio_id')
        .eq('id', token)
        .single()

      if (error || !data) {
        setFase('invalid')
        return
      }

      // Token encontrado pero ya usado
      if (data.estado !== 'pendiente') {
        setFase('invalid')
        setGlobalError(
          data.estado === 'aceptada'
            ? 'Este enlace ya fue utilizado. Inicia sesión directamente.'
            : 'Este enlace ha expirado o fue revocado.'
        )
        return
      }

      setInvitacion(data)
      setFase('form')
    }

    validarToken()
  }, [token])

  // ── Handlers de formulario ────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Limpiar error del campo al escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // ── Fase 2: Submit (El Candado) ───────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setGlobalError(null)
    const errors = {}

    // ── Validación: Modo Invitado ──
    if (token && invitacion) {
      if (form.documento.trim() !== invitacion.documento?.trim()) {
        errors.documento = 'El documento no coincide con el registrado en la invitación.'
      }
    }

    // ── Validación: Modo Dueño SaaS ──
    if (!token) {
      if (!form.email.trim()) {
        errors.email = 'El correo electrónico es obligatorio.'
      } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        errors.email = 'Formato de correo inválido.'
      }
    }

    // ── Validación: contraseña ──
    if (form.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres.'
    }

    // ── Validación: confirmación ──
    if (form.password !== form.confirmar) {
      errors.confirmar = 'Las contraseñas no coinciden.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFase('submitting')

    // ── signUp con Supabase Auth ──
    const signUpOptions = {
      email:    token ? invitacion.email : form.email,
      password: form.password,
      options: {
        data: {
          rol: token ? 'admin_negocio' : 'propietario',
          documento: form.documento,
          ...(token ? { negocio_id: invitacion.negocio_id } : { empresa: form.empresa })
        },
      },
    }

    const { error: signUpError } = await supabase.auth.signUp(signUpOptions)

    if (signUpError) {
      setGlobalError(signUpError.message)
      setFase('form')
      return
    }

    // ── Marcar invitación como aceptada (Solo si aplica) ──
    if (token && invitacion) {
      await supabase
        .from('invitaciones')
        .update({ estado: 'aceptada' })
        .eq('id', invitacion.id)
    }

    // ── Éxito → breve estado visual y redirect ──
    setFase('success')
    setTimeout(() => navigate('/'), 2200)
  }

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div className="bg-mesh min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-up">

        {/* ── Logo / Branding ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
            <ShieldCheck size={28} className="text-indigo-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">VendeMas Business</h1>
          <p className="text-sm text-slate-400 mt-1">
            {token ? 'Portal de registro de administradores' : 'Crea tu cuenta de Dueño SaaS'}
          </p>
        </div>

        {/* ── Card principal ── */}
        <div className="glass rounded-2xl border border-white/12 shadow-2xl overflow-hidden">

          {/* ── FASE: loading ── */}
          {fase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-slate-400">Validando enlace de invitación…</p>
            </div>
          )}

          {/* ── FASE: invalid ── */}
          {fase === 'invalid' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-100 mb-1">Enlace inválido</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {globalError ?? 'Este enlace de invitación no existe, ya fue usado o ha expirado.'}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                Si crees que esto es un error, contacta a tu administrador de sistema.
              </p>
            </div>
          )}

          {/* ── FASE: success ── */}
          {fase === 'success' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <CheckCircle2 size={30} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 mb-1">¡Cuenta creada!</h2>
                <p className="text-sm text-slate-400">Redirigiendo a tu dashboard…</p>
              </div>
              <Loader2 size={18} className="text-indigo-400 animate-spin" />
            </div>
          )}

          {/* ── FASE: form | submitting ── */}
          {(fase === 'form' || fase === 'submitting') && (
            <>
              {/* Header de la tarjeta */}
              <div className="px-6 pt-6 pb-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center">
                    <Lock size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      {token ? 'Activar cuenta' : 'Registro Maestro'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {token ? 'Completa tu registro para acceder' : 'Configura tu portal de negocio'}
                    </p>
                  </div>
                </div>

                {/* Modo Invitado: Email pre-cargado */}
                {token && invitacion && (
                  <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
                    <Mail size={14} className="text-indigo-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 leading-none mb-0.5">Cuenta registrada para</p>
                      <p className="text-sm font-medium text-indigo-300 truncate">{invitacion.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

                {/* Error global */}
                {globalError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{globalError}</span>
                  </div>
                )}

                {/* Modo Dueño: Campos adicionales */}
                {!token && (
                  <>
                    <InputField
                      label="Correo Electrónico"
                      icon={Mail}
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ejemplo@correo.com"
                      error={fieldErrors.email}
                      required
                    />
                    <InputField
                      label="Nombre de tu Empresa (Opcional)"
                      icon={ShieldCheck}
                      name="empresa"
                      value={form.empresa}
                      onChange={handleChange}
                      placeholder="Mi Negocio SaaS"
                    />
                  </>
                )}

                {/* Campo: Documento */}
                <InputField
                  label="DNI / RUC"
                  icon={FileText}
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                  placeholder="Ingresa tu documento de identidad"
                  error={fieldErrors.documento}
                  required
                />

                {/* Divisor */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] text-slate-600 uppercase tracking-wider">Contraseña de acceso</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Campo: Contraseña */}
                <InputField
                  label="Contraseña"
                  icon={Lock}
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  error={fieldErrors.password}
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

                {/* Campo: Confirmar contraseña */}
                <InputField
                  label="Confirmar contraseña"
                  icon={Lock}
                  name="confirmar"
                  type={showPwd2 ? 'text' : 'password'}
                  value={form.confirmar}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  error={fieldErrors.confirmar}
                  required
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPwd2(p => !p)}
                      className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                    >
                      {showPwd2 ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />

                {/* Indicador de fortaleza (visual) */}
                {form.password.length > 0 && (
                  <PasswordStrength password={form.password} />
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={fase === 'submitting'}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all mt-2 shadow-lg shadow-indigo-500/20"
                >
                  {fase === 'submitting' ? (
                    <><Loader2 size={16} className="animate-spin" /> Creando cuenta…</>
                  ) : (
                    <><ShieldCheck size={16} /> Activar mi cuenta</>
                  )}
                </button>
                
                <div className="mt-6 text-center text-sm text-slate-400">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                    Inicia sesión aquí
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          Plataforma segura · VendeMas SaaS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

// ── PasswordStrength — indicador visual ───────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ caracteres',  ok: password.length >= 8 },
    { label: 'Mayúscula',      ok: /[A-Z]/.test(password) },
    { label: 'Número',         ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length

  const barColor = score === 3 ? 'bg-emerald-500' : score === 2 ? 'bg-amber-500' : 'bg-red-500'
  const barLabel = score === 3 ? 'Fuerte' : score === 2 ? 'Media' : 'Débil'

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              i < score ? barColor : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map(({ label, ok }) => (
            <span key={label} className={`text-[10px] flex items-center gap-0.5 ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span className={`w-1 h-1 rounded-full ${ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              {label}
            </span>
          ))}
        </div>
        <span className={`text-[10px] font-medium ${
          score === 3 ? 'text-emerald-400' : score === 2 ? 'text-amber-400' : 'text-red-400'
        }`}>{barLabel}</span>
      </div>
    </div>
  )
}
