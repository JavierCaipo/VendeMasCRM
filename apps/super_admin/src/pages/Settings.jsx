// ============================================
// Settings Page — Panel de Configuración Global (SaaS)
// src/pages/Settings.jsx
// ============================================
import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Coins,
  Calculator,
  Globe,
  ShieldAlert,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Settings() {
  const [form, setForm] = useState({
    precio_mensual_usd: 0,
    tipo_cambio_pen: 0
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchSaaSConfig()
  }, [])

  async function fetchSaaSConfig() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('saas_config')
        .select('*')
        .eq('id', 1)
        .single()

      if (error) throw error

      if (data) {
        setForm({
          precio_mensual_usd: data.precio_mensual_usd || 0,
          tipo_cambio_pen: data.tipo_cambio_pen || 0
        })
        setLastUpdated(data.updated_at)
      }
    } catch (err) {
      console.error('Error loading saas_config:', err)
      showToast('error', 'Error al cargar la configuración global')
    } finally {
      setIsLoading(false)
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const precio = parseFloat(form.precio_mensual_usd)
    const tc     = parseFloat(form.tipo_cambio_pen)

    if (!precio || precio <= 0) {
      showToast('error', 'El precio mensual debe ser mayor a 0')
      return
    }
    if (!tc || tc <= 0) {
      showToast('error', 'El tipo de cambio debe ser mayor a 0')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('saas_config')
        .update({
          precio_mensual_usd: precio,
          tipo_cambio_pen: tc,
          updated_at: now
        })
        .eq('id', 1)

      if (error) throw error

      setLastUpdated(now)
      showToast('success', 'Configuración global actualizada correctamente')
    } catch (err) {
      console.error('Error saving saas_config:', err)
      showToast('error', 'Error al actualizar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Cálculo en tiempo real
  const precioUsd     = parseFloat(form.precio_mensual_usd) || 0
  const tipoCambio    = parseFloat(form.tipo_cambio_pen) || 0
  const precioFinalPEN = (precioUsd * tipoCambio).toFixed(2)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">
            Accediendo al Núcleo SaaS...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-up">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Globe className="text-indigo-500" size={26} />
            Configuraciones Globales
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Parámetros de facturación que aplican a toda la plataforma VendeMas.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <ShieldAlert size={14} className="text-red-400" />
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">SuperAdmin</span>
        </div>
      </div>

      {/* ── Main Config Card ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <Coins size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Configuración de Facturación</h2>
              <p className="text-[11px] text-slate-500">Estos valores afectan a todos los nuevos checkouts y renovaciones.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchSaaSConfig}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-indigo-400 transition-all"
            title="Recargar configuración"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Precio Mensual USD */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Precio Suscripción PRO (USD)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.precio_mensual_usd}
                  onChange={(e) => setForm(prev => ({ ...prev, precio_mensual_usd: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-bold focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all text-lg placeholder-slate-700"
                  placeholder="29.00"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-1">Monto nominal en USD que la Edge Function <code className="text-indigo-400/70">mp-checkout</code> leerá.</p>
            </div>

            {/* Tipo de Cambio PEN */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Tipo de Cambio Global (USD → PEN)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <span className="font-bold text-sm">S/</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  required
                  value={form.tipo_cambio_pen}
                  onChange={(e) => setForm(prev => ({ ...prev, tipo_cambio_pen: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-100 font-bold focus:outline-none focus:border-emerald-500/60 focus:bg-white/10 transition-all text-lg placeholder-slate-700"
                  placeholder="3.800"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-1">Tasa de conversión fallback si el tenant no tiene una propia.</p>
            </div>

          </div>

          {/* ── Preview en tiempo real ── */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/5 rounded-2xl border border-white/10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <Calculator size={18} className="text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estimación de Cobro</p>
                <p className="text-xs font-medium text-slate-400">Precio final estimado al cliente</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                S/ {precioFinalPEN}
              </p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                = US$ {precioUsd.toFixed(2)} × {tipoCambio.toFixed(3)}
              </p>
            </div>
          </div>

          {/* ── Warning ── */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
            <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
              <strong className="text-amber-500 uppercase tracking-tighter mr-1">Atención:</strong>
              Cambiar estos valores actualizará el monto de todas las nuevas suscripciones generadas a partir de este momento.
              Las suscripciones ya activas en MercadoPago NO se ven afectadas retroactivamente.
            </p>
          </div>

          {/* ── Actions ── */}
          <div className="pt-2 flex items-center justify-between">
            {lastUpdated && (
              <p className="text-[10px] text-slate-600">
                Última actualización: {new Date(lastUpdated).toLocaleString('es-PE')}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className={`ml-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border shadow-2xl glass animate-in slide-in-from-bottom-2 duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-500/30 text-emerald-400'
            : 'border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

    </div>
  )
}
