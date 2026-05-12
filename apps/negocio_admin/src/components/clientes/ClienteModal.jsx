// ============================================
// CERCO 2 — Modal de Creación/Edición
// src/components/clientes/ClienteModal.jsx
// ============================================
import { useState, useEffect } from 'react'
import { X, User, FileText, Loader2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

const INITIAL_FORM = {
  tipo_documento: 'DNI',
  numero_documento: '',
  nombre_razon_social: '',
  email: '',
  telefono: '',
  direccion: '',
  tarifa_asignada: 'C',
  agente_asignado_id: '',
  descripcion_empresa: '',
}

export default function ClienteModal({ isOpen, onClose, onSuccess, onError, clienteToEdit }) {
  const { tenant } = useTenant()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [comerciales, setComerciales] = useState([])
  const [userRole, setUserRole] = useState('comercial')

  useEffect(() => {
    async function loadAuthAndTeam() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: dbUser } = await supabase.from('usuarios_negocio').select('rol').eq('id', user.id).single()
        setUserRole(dbUser?.rol || 'comercial')
        
        if (tenant?.id) {
          const { data: team } = await supabase.from('usuarios_negocio').select('id, nombre_completo, email').eq('negocio_id', tenant.id)
          if (team) setComerciales(team)
        }
      }
    }
    if (isOpen) loadAuthAndTeam()
  }, [isOpen, tenant?.id])

  useEffect(() => {
    if (isOpen) {
      if (clienteToEdit) {
        setForm({
          tipo_documento: clienteToEdit.tipo_documento || 'DNI',
          numero_documento: clienteToEdit.numero_documento || '',
          nombre_razon_social: clienteToEdit.nombre_razon_social || '',
          email: clienteToEdit.email || '',
          telefono: clienteToEdit.telefono || '',
          direccion: clienteToEdit.direccion || '',
          tarifa_asignada: clienteToEdit.tarifa_asignada || 'C',
          agente_asignado_id: clienteToEdit.agente_asignado_id || '',
          descripcion_empresa: clienteToEdit.descripcion_empresa || '',
        })
      } else {
        setForm(INITIAL_FORM)
      }
    }
  }, [isOpen, clienteToEdit])

  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)

    try {
      const payload = {
        ...form,
        negocio_id: tenant.id,
      }

      if (!payload.agente_asignado_id) {
        delete payload.agente_asignado_id
      }

      let error

      if (clienteToEdit) {
        // UPDATE
        const { error: updErr } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', clienteToEdit.id)
        error = updErr
      } else {
        // VERIFICACIÓN DE DUPLICADOS EN INSERT
        if (form.numero_documento) {
          const { data: existente } = await supabase
            .from('clientes')
            .select('id')
            .eq('numero_documento', form.numero_documento)
            .eq('negocio_id', tenant.id)
            .limit(1)
            .maybeSingle()
            
          if (existente) {
            onError?.('Este cliente ya está registrado')
            setLoading(false)
            return
          }
        }

        // INYECCIÓN DE COMERCIAL EN INSERT
        if (userRole === 'comercial') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            payload.agente_asignado_id = user.id
          }
        }

        // INSERT
        const { error: insErr } = await supabase
          .from('clientes')
          .insert([payload])
        error = insErr
      }

      if (error) {
        // Verificar si es error UNIQUE (suele ser código 23505)
        if (error.code === '23505' || error.message?.toLowerCase().includes('unique')) {
          onError?.(`El documento ${form.numero_documento} ya está registrado en tu base de datos.`)
        } else {
          onError?.(`Error: ${error.message}`)
        }
      } else {
        onSuccess?.(clienteToEdit ? 'Cliente actualizado correctamente' : 'Cliente registrado exitosamente')
        onClose()
      }
    } catch (err) {
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className="bg-slate-900 w-full max-w-2xl max-h-[85vh] mt-10 sm:mt-0 overflow-y-auto rounded-xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <User size={18} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-100 break-words">
                {clienteToEdit ? `Editar: ${clienteToEdit.nombre_razon_social || 'Cliente'}` : 'Nuevo Cliente'}
              </h2>
              <p className="text-xs text-slate-400">Información de facturación y contacto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Documento</label>
              <select
                name="tipo_documento"
                value={form.tipo_documento}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="DNI" className="bg-slate-900">DNI</option>
                <option value="RUC" className="bg-slate-900">RUC</option>
                <option value="CE" className="bg-slate-900">CE</option>
                <option value="PASAPORTE" className="bg-slate-900">PASAPORTE</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Número <span className="text-indigo-400">*</span></label>
              <input
                name="numero_documento"
                value={form.numero_documento}
                onChange={handleChange}
                required
                placeholder="Ej: 12345678"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre o Razón Social <span className="text-indigo-400">*</span></label>
            <input
              name="nombre_razon_social"
              value={form.nombre_razon_social}
              onChange={handleChange}
              required
              placeholder="Nombre del cliente o empresa"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="cliente@email.com"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="+51 999 999 999"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dirección</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Dirección fiscal o de entrega"
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tarifa Asignada</label>
              <select
                name="tarifa_asignada"
                value={form.tarifa_asignada}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="A" className="bg-slate-900">Tarifa A (Mayorista)</option>
                <option value="B" className="bg-slate-900">Tarifa B (Especial)</option>
                <option value="C" className="bg-slate-900">Tarifa C (Normal)</option>
              </select>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Descripción / Actividad de la Empresa
            </label>
            <textarea
              name="descripcion_empresa"
              value={form.descripcion_empresa || ''}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Ej: Contratista minero especializado en movimiento de tierras..."
            />
          </div>

          {userRole === 'admin' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Agente Asignado</label>
              <select
                name="agente_asignado_id"
                value={form.agente_asignado_id}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-100 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="" className="bg-slate-900 text-slate-500">-- Sin asignar --</option>
                {comerciales.map(ag => (
                  <option key={ag.id} value={ag.id} className="bg-slate-900">
                    {ag.nombre_completo || ag.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Guardando…</>
              ) : (
                <><Save size={15} /> Guardar Cliente</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
