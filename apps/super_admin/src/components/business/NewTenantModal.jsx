// ============================================
// CERCO 4 — NewTenantModal (Aprovisionamiento Atómico)
// src/components/business/NewTenantModal.jsx
//
// Estado 1: Formulario de creación
// Estado 2: Éxito — muestra el enlace de invitación generado
// ============================================
import { useState } from 'react'
import {
  X, Building2, User, Loader2,
  CheckCircle2, AlertCircle, Copy, Check,
  ExternalLink, ArrowLeft,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

// ─────────────────────────────────────────────────────────────
// Sub-componente: campo de formulario reutilizable
// ─────────────────────────────────────────────────────────────
function InputField({ label, name, value, onChange, placeholder, type = 'text', required, hint }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">
        {label} {required && <span className="text-indigo-400">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="
          w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500
          bg-white/5 border border-white/10
          focus:outline-none focus:border-indigo-500/60 focus:bg-white/[0.08]
          transition-all duration-150
        "
      />
      {hint && <p className="mt-1 text-[10px] text-slate-500">{hint}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-componente: caja de enlace copiable
// ─────────────────────────────────────────────────────────────
function LinkBox({ link }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback para contextos sin HTTPS
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">Enlace de registro del administrador</p>
      <div className="flex items-stretch gap-2">
        {/* URL display */}
        <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/25 flex items-center">
          <span className="text-xs text-indigo-300 font-mono truncate block w-full">
            {link}
          </span>
        </div>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          title="Copiar al portapapeles"
          className={`
            flex-shrink-0 flex items-center justify-center w-10 rounded-xl border transition-all duration-200
            ${copied
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-100 hover:bg-white/10'
            }
          `}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        {/* Open in new tab */}
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          title="Abrir en nueva pestaña"
          className="flex-shrink-0 flex items-center justify-center w-10 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all duration-200"
        >
          <ExternalLink size={14} />
        </a>
      </div>
      {copied && (
        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
          <Check size={10} /> Enlace copiado al portapapeles
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Estado 2: Vista de éxito con el enlace generado
// ─────────────────────────────────────────────────────────────
function SuccessView({ result, onClose }) {
  const inviteLink = `${window.location.origin}/registro?token=${result.invitacionId}`

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Hero de éxito */}
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">¡Tenant aprovisionado!</h3>
          <p className="text-sm text-slate-400 mt-0.5">
            <span className="text-slate-200 font-medium">{result.negocioNombre}</span> está listo.
          </p>
        </div>
      </div>

      {/* Resumen del aprovisionamiento */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Negocio ID',  value: result.negocioId.slice(0, 8) + '…' },
          { label: 'Subdominio',  value: result.subdominio + '.vendemas.app' },
          { label: 'Admin email', value: result.email },
          { label: 'Rol asignado', value: 'admin_negocio' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-white/4 border border-white/8 px-3 py-2">
            <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
            <p className="text-xs text-slate-200 font-medium truncate" title={value}>{value}</p>
          </div>
        ))}
      </div>

      {/* Enlace de invitación */}
      <LinkBox link={inviteLink} />

      {/* Instrucciones */}
      <p className="text-[11px] text-slate-500 leading-relaxed bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
        📋 Comparte este enlace con el administrador del negocio. El enlace es de un solo uso
        y expira en <strong className="text-slate-400">7 días</strong>.
      </p>

      {/* Botón de cierre */}
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2"
      >
        <ArrowLeft size={14} />
        Volver al listado
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  nombre: '',
  subdominio: '',
  email: '',
  documento: '',
}

export default function NewTenantModal({ isOpen, onClose, onSuccess }) {
  const [form,    setForm]    = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  // result = null → Estado 1 (formulario)
  // result = {...} → Estado 2 (éxito + enlace)
  const [result,  setResult]  = useState(null)

  if (!isOpen) return null

  // ── Handlers ──────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'subdominio') {
      setForm(prev => ({
        ...prev,
        subdominio: value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-'),
      }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  function handleClose() {
    // Al cerrar, si hubo éxito refrescamos la tabla del padre
    if (result) onSuccess?.()
    // Resetear estado interno para la próxima apertura
    setForm(INITIAL_FORM)
    setError(null)
    setResult(null)
    onClose()
  }

  // ── Submit atómico ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    try {
      // ── PASO A: Crear el negocio ───────────────────────────
      const { data: negocio, error: negocioError } = await supabase
        .from('negocios')
        .insert([{
          nombre:     form.nombre.trim(),
          subdominio: form.subdominio.trim(),
          estado:     'activo',
        }])
        .select('id, nombre, subdominio')
        .single()

      if (negocioError) {
        throw new Error(`No se pudo crear el negocio: ${negocioError.message}`)
      }

      // ── PASO B: Capturar el Tenant ID ──────────────────────
      const tenantId = negocio.id

      // ── PASO C: Crear la invitación y capturar su ID ───────
      const { data: invitacion, error: invitacionError } = await supabase
        .from('invitaciones')
        .insert([{
          negocio_id: tenantId,
          email:      form.email.trim().toLowerCase(),
          documento:  form.documento.trim(),
          rol:        'admin_negocio',
          estado:     'pendiente',
        }])
        .select('id')   // ← capturamos el ID para construir el token
        .single()

      if (invitacionError) {
        throw new Error(
          `Negocio creado (ID: ${tenantId.slice(0, 8)}…), ` +
          `pero falló la invitación: ${invitacionError.message}. ` +
          `Por favor crea la invitación manualmente desde la BD.`
        )
      }

      // ── Éxito total → transición al Estado 2 ──────────────
      setResult({
        negocioId:     negocio.id,
        negocioNombre: negocio.nombre,
        subdominio:    negocio.subdominio,
        email:         form.email.trim().toLowerCase(),
        invitacionId:  invitacion.id,  // UUID del registro en invitaciones → token
      })
      setForm(INITIAL_FORM)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — solo cierra si estamos en el formulario */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={result ? undefined : handleClose}
      />

      {/* Modal card */}
      <div 
        className="relative glass border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header — cambia según el estado */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              result
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-indigo-500/20 border-indigo-500/30'
            }`}>
              {result
                ? <CheckCircle2 size={18} className="text-emerald-400" />
                : <Building2    size={18} className="text-indigo-400"  />
              }
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {result ? 'Tenant creado' : 'Nuevo Tenant'}
              </h2>
              <p className="text-xs text-slate-400">
                {result ? 'Enlace de acceso generado' : 'Aprovisionamiento atómico'}
              </p>
            </div>
          </div>
          {/* X solo visible en el formulario; en éxito usamos el botón principal */}
          {!result && (
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Estado 2: Vista de éxito ── */}
        {result ? (
          <SuccessView result={result} onClose={handleClose} />
        ) : (
          /* ── Estado 1: Formulario ── */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Sección: Datos del Negocio ── */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                <Building2 size={12} />
                Datos del Negocio
              </legend>
              <div className="space-y-3">
                <InputField
                  label="Nombre del Negocio"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Café Central Lima"
                  required
                />
                <InputField
                  label="Subdominio"
                  name="subdominio"
                  value={form.subdominio}
                  onChange={handleChange}
                  placeholder="cafe-central"
                  required
                  hint={form.subdominio ? `URL: ${form.subdominio}.vendemas.app` : undefined}
                />
              </div>
            </fieldset>

            {/* ── Sección: Datos del Administrador ── */}
            <fieldset>
              <legend className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
                <User size={12} />
                Datos del Administrador
              </legend>
              <div className="space-y-3">
                <InputField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@negocio.com"
                  required
                />
                <InputField
                  label="DNI / RUC"
                  name="documento"
                  value={form.documento}
                  onChange={handleChange}
                  placeholder="Ej: 12345678 o 20123456789"
                  required
                />
              </div>
            </fieldset>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Aprovisionando…
                  </>
                ) : (
                  'Crear Tenant'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
