// ============================================
// CERCO 3 — Módulo de Configuración
// src/pages/ConfiguracionView.jsx
// ============================================
import { useState, useEffect } from 'react'
import { Settings2, Save, Loader2, CheckCircle2, AlertCircle, ImagePlus, Zap, ShieldCheck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'
import { useFreemium } from '../hooks/useFreemium'
import PaywallModal from '../components/common/PaywallModal'

export default function ConfiguracionView() {
  const { tenant, refreshTenant } = useTenant()
  const { checkLimit } = useFreemium()
  
  const [form, setForm] = useState({
    nombre: '',
    subdominio: '',
    ruc: '',
    telefono: '',
    correo_ventas: '',
    sitio_web: '',
    redes_sociales: '',
    logo_url: '',
    tipo_cambio_usd_pen: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast,   setToast]   = useState(null)
  const [paywall, setPaywall] = useState({ open: false, reason: '' })
  const [isLoadingCancel, setIsLoadingCancel] = useState(false)

  // Cargar datos iniciales del contexto
  useEffect(() => {
    if (tenant) {
      setForm({
        nombre: tenant.nombre || '',
        subdominio: tenant.subdominio || '',
        ruc: tenant.ruc || '',
        telefono: tenant.telefono || '',
        correo_ventas: tenant.correo_ventas || '',
        sitio_web: tenant.sitio_web || '',
        redes_sociales: tenant.redes_sociales || '',
        logo_url: tenant.logo_url || '',
        tipo_cambio_usd_pen: tenant.tipo_cambio_usd_pen || ''
      })
    }
  }, [tenant])

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleCancelSubscription() {
    if (!window.confirm("¿Estás seguro de que deseas cancelar tu suscripción PRO? Perderás acceso a la Marca Blanca y otras funciones premium de inmediato.")) return;
    
    setIsLoadingCancel(true);
    try {
      // By-pass local para pruebas en entorno de desarrollo
      const response = await fetch('http://127.0.0.1:54321/functions/v1/mp-cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocio_id: tenant.id })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al procesar la cancelación");

      showToast('success', 'Suscripción cancelada. Has vuelto al Plan Gratuito.');
      await refreshTenant();
    } catch (err) {
      console.error("Cancelation error:", err);
      showToast('error', err.message);
    } finally {
      setIsLoadingCancel(false);
    }
  }

  const [uploading, setUploading] = useState(false)

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // --- INTERCEPTOR DE MARCA BLANCA ---
    const limitStatus = checkLimit('WHITE_LABEL')
    if (!limitStatus.allowed) {
      setPaywall({ open: true, reason: limitStatus.reason })
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${tenant.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      setForm(prev => ({ ...prev, logo_url: publicUrl }))
      showToast('success', 'Logo subido correctamente (Presiona Guardar para aplicar)')
    } catch (error) {
      showToast('error', 'Error al subir logo: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return

    setLoading(true)
    
    try {
      const payloadLimpio = {
        nombre: form.nombre.trim(),
        ruc: form.ruc.trim(),
        telefono: form.telefono.trim(),
        correo_ventas: form.correo_ventas.trim(),
        sitio_web: form.sitio_web.trim(),
        redes_sociales: form.redes_sociales.trim(),
        tipo_cambio_usd_pen: parseFloat(form.tipo_cambio_usd_pen) || null,
        logo_url: form.logo_url
      }

      const { error } = await supabase
        .from('negocios')
        .update(payloadLimpio)
        .eq('id', tenant.id)

      if (error) throw error

      await refreshTenant()
      showToast('success', 'Configuración guardada correctamente')
    } catch (error) {
      showToast('error', 'Error BD: ' + (error.message || JSON.stringify(error)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-up">
      
      {/* ── Page Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings2 size={26} className="text-indigo-400" />
          Configuración del Negocio
        </h1>
        <p className="text-slate-400 mt-1">
          Administra la identidad y preferencias de tu tenant.
        </p>
      </div>

      {/* ── Mi Suscripción ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Mi Suscripción</h2>
            <p className="text-xs text-slate-500">Gestiona el nivel de acceso y facturación de tu cuenta.</p>
          </div>
          {tenant?.plan === 'pro' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">VendeMas PRO Activo</span>
            </div>
          ) : (
            <div className="bg-slate-500/10 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Gratuito</span>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {tenant?.plan === 'pro' ? (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-300 font-medium">¡Gracias por ser parte de VendeMas PRO!</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tienes acceso ilimitado a Marca Blanca, PDFs Luxury y nuestro Motor Anti-Spam de WhatsApp.
                </p>
              </div>
              <button 
                type="button"
                onClick={handleCancelSubscription}
                disabled={isLoadingCancel}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingCancel ? 'Cancelando...' : 'Cancelar Suscripción'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-sm text-slate-300 font-medium">Lleva tu negocio al siguiente nivel</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Desbloquea la marca blanca, reportes avanzados y soporte prioritario hoy mismo.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setPaywall({ open: true, reason: 'Potencia tu negocio con las herramientas exclusivas de nuestra versión profesional.' })}
                className="bg-white text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg shadow-white/5 active:scale-95"
              >
                <Zap size={14} fill="currentColor" />
                Mejorar a PRO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-semibold text-slate-200">Identidad de la Marca</h2>
          <p className="text-xs text-slate-500">Estos datos son visibles para tus clientes.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Logo del Negocio */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div 
              onClick={() => document.getElementById('logo-upload').click()}
              className="relative w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all group overflow-hidden"
            >
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-indigo-400">
                  {uploading ? <Loader2 size={24} className="animate-spin" /> : <ImagePlus size={24} />}
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Subir Logo</span>
                </div>
              )}
              {/* Overlay on hover */}
              {form.logo_url && !uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <ImagePlus size={20} className="text-white" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <Loader2 size={20} className="text-indigo-400 animate-spin" />
                </div>
              )}
            </div>
            <input 
              id="logo-upload"
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleLogoUpload} 
              disabled={uploading}
            />
            <p className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-widest">Identidad de Marca</p>
          </div>
          
          {/* Subdominio (Solo Lectura) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Subdominio (URL de acceso)
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 rounded-l-xl bg-white/5 border border-white/10 border-r-0 text-sm text-slate-500">
                https://
              </span>
              <input
                type="text"
                value={form.subdominio}
                readOnly
                disabled
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-sm text-slate-300 font-mono focus:outline-none opacity-60 cursor-not-allowed"
              />
              <span className="px-3 py-2.5 rounded-r-xl bg-white/5 border border-white/10 border-l-0 text-sm text-slate-500">
                .vendemas.app
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              El subdominio es único e inmutable. Contacta a soporte si requieres un cambio.
            </p>
          </div>

          {/* Nombre del Negocio */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nombre Comercial <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              required
              placeholder="Ej: Mi Restaurante S.A.C."
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RUC */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">RUC</label>
              <input
                type="text"
                value={form.ruc}
                onChange={(e) => setForm(prev => ({ ...prev, ruc: e.target.value }))}
                placeholder="Ej: 20123456789"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Tipo de Cambio */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de Cambio Base (USD a PEN)</label>
              <input
                type="number"
                step="0.001"
                value={form.tipo_cambio_usd_pen}
                onChange={(e) => setForm(prev => ({ ...prev, tipo_cambio_usd_pen: e.target.value }))}
                placeholder="Ej: 3.80"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Teléfono de Contacto</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="Ej: +51 987 654 321"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Correo de Ventas */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Correo de Ventas</label>
              <input
                type="email"
                value={form.correo_ventas}
                onChange={(e) => setForm(prev => ({ ...prev, correo_ventas: e.target.value }))}
                placeholder="Ej: ventas@minegocio.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Sitio Web */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Sitio Web</label>
              <input
                type="url"
                value={form.sitio_web}
                onChange={(e) => setForm(prev => ({ ...prev, sitio_web: e.target.value }))}
                placeholder="Ej: https://www.minegocio.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>
            
            {/* Redes Sociales */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Redes Sociales (Ej: @MiNegocio)</label>
              <input
                type="text"
                value={form.redes_sociales}
                onChange={(e) => setForm(prev => ({ ...prev, redes_sociales: e.target.value }))}
                placeholder="Ej: Instagram: @minegocio | LinkedIn: Mi Negocio"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border shadow-2xl glass animate-in slide-in-from-bottom-2 ${
          toast.type === 'success'
            ? 'border-emerald-500/30 text-emerald-300'
            : 'border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
      {/* ── Paywall Modal ── */}
      <PaywallModal 
        isOpen={paywall.open} 
        onClose={() => setPaywall({ open: false, reason: '' })} 
        reason={paywall.reason} 
      />

    </div>
  )
}
