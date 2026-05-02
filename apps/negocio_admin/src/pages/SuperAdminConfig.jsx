// ============================================
// PANEL DE CONTROL GLOBAL (SaaS) — VendeMas CRM
// src/pages/SuperAdminConfig.jsx
// ============================================
import { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Coins,
  Calculator,
  Globe
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function SuperAdminConfig() {
  const [form, setForm] = useState({
    precio_mensual_usd: 0,
    tipo_cambio_pen: 0
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // Cargar configuración inicial (ID = 1)
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
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const { error } = await supabase
        .from('saas_config')
        .update({
          precio_mensual_usd: parseFloat(form.precio_mensual_usd),
          tipo_cambio_pen: parseFloat(form.tipo_cambio_pen),
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)

      if (error) throw error

      showToast('success', 'Configuración global actualizada correctamente')
    } catch (err) {
      console.error('Error saving saas_config:', err)
      showToast('error', 'Error al actualizar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Cálculo en tiempo real
  const precioFinalSoles = (form.precio_mensual_usd * form.tipo_cambio_pen).toFixed(2)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
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
    <div className="max-w-3xl mx-auto p-8 space-y-8 fade-up">
      
      {/* ── Page Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <Globe className="text-indigo-500" /> Panel de Control Global (SaaS)
          </h1>
          <p className="text-slate-400 mt-1 font-medium">
            Gestiona los parámetros base de facturación para toda la plataforma.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <ShieldAlert size={16} className="text-red-400" />
          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Modo SuperAdmin</span>
        </div>
      </div>

      {/* ── Main Config Card ── */}
      <div className="glass rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <Coins size={22} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Configuración de Facturación</h2>
            <p className="text-xs text-slate-500">Estos valores afectan a todos los nuevos checkouts y renovaciones.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Precio Mensual USD */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Precio Mensual Base (USD)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.precio_mensual_usd}
                  onChange={(e) => setForm(prev => ({ ...prev, precio_mensual_usd: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-100 font-bold focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all text-lg placeholder-slate-700"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-1">Costo nominal en dólares americanos por suscripción.</p>
            </div>

            {/* Tipo de Cambio PEN */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                Tipo de Cambio (USD a PEN)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                  <span className="font-bold text-sm">S/</span>
                </div>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={form.tipo_cambio_pen}
                  onChange={(e) => setForm(prev => ({ ...prev, tipo_cambio_pen: e.target.value }))}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-100 font-bold focus:outline-none focus:border-emerald-500/60 focus:bg-white/10 transition-all text-lg placeholder-slate-700"
                  placeholder="0.000"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-1">Tasa de conversión aplicada para el cobro final.</p>
            </div>

          </div>

          {/* ── Estimated Final Price (Real-time) ── */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/5 rounded-3xl border border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                <Calculator size={20} className="text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estimación de Cobro</p>
                <p className="text-sm font-medium text-slate-300">Precio Final estimado al cliente</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                S/ {precioFinalSoles}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">I.G.V. Incluido (Referencial)</p>
            </div>
          </div>

          {/* ── Warning Box ── */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
              <strong className="text-amber-500 uppercase tracking-tighter mr-1">Atención:</strong> 
              Cambiar estos valores actualizará el monto de todas las nuevas suscripciones generadas a partir de este momento. 
              Asegúrate de que el tipo de cambio sea el oficial para evitar discrepancias financieras.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`group relative overflow-hidden px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-3 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save size={16} className="group-hover:scale-110 transition-transform" />
                  Actualizar Precios Globales
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold border shadow-2xl glass animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success'
            ? 'border-emerald-500/30 text-emerald-400'
            : 'border-red-500/30 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {toast.msg}
        </div>
      )}

    </div>
  )
}
