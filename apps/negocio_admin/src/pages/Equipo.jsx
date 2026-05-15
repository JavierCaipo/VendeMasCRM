// ============================================
// Módulo de Gestión de Equipo (RRHH)
// src/pages/Equipo.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  Plus, 
  Shield, 
  UserX, 
  UserCheck, 
  Loader2, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  ShieldCheck,
  X,
  Target,
  Save,
  Edit2
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'

export default function Equipo() {
  const { tenant } = useTenant()

  const [usuarios, setUsuarios] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Inline edit meta
  const [editingMetaId, setEditingMetaId] = useState(null)
  const [editingMetaValue, setEditingMetaValue] = useState('')

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'user'
  })

  const [toast, setToast] = useState(null)

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── 1. Carga inicial de usuarios ──
  const fetchUsuarios = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)

    const { data, error } = await supabase
      .from('usuarios_negocio')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('error', `Error al cargar equipo: ${error.message}`)
    } else {
      setUsuarios(data || [])
      setFiltered(data || [])
    }
    setLoading(false)
  }, [tenant?.id])

  useEffect(() => {
    fetchUsuarios()
  }, [fetchUsuarios])

  // ── 2. Filtro local ──
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      usuarios.filter(u =>
        u.nombre_completo?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      )
    )
  }, [search, usuarios])

  // ── 3. Cambio de Estado (Activo / Suspendido) ──
  async function toggleStatus(usuario) {
    const nuevoEstado = usuario.estado === 'activo' ? 'suspendido' : 'activo'
    
    // Update optimista
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, estado: nuevoEstado } : u))

    const { error } = await supabase
      .from('usuarios_negocio')
      .update({ estado: nuevoEstado })
      .eq('id', usuario.id)

    if (error) {
      showToast('error', `Error al actualizar estado: ${error.message}`)
      fetchUsuarios() // Rollback
    } else {
      showToast('success', `Usuario ${nuevoEstado === 'activo' ? 'activado' : 'suspendido'}`)
    }
  }

  // ── 3.5 Actualizar Meta de Ventas ──
  async function saveMeta(usuarioId) {
    const metaNum = parseFloat(editingMetaValue) || 0
    setUsuarios(prev => prev.map(u => u.id === usuarioId ? { ...u, meta_ventas_mensual: metaNum } : u))
    setEditingMetaId(null)

    const { error } = await supabase
      .from('usuarios_negocio')
      .update({ meta_ventas_mensual: metaNum })
      .eq('id', usuarioId)

    if (error) {
      showToast('error', `Error guardando meta: ${error.message}`)
      fetchUsuarios()
    } else {
      showToast('success', 'Meta de ventas actualizada')
    }
  }

  // ── 4. Invitación Real (Edge Function) ──
  async function handleInvite(e) {
    e.preventDefault()
    if (!tenant?.id) return
    
    setIsSaving(true)
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: form.email,
          nombre_completo: form.nombre,
          rol: form.rol,
          negocio_id: tenant.id,
          nombre_negocio: tenant.nombre
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      showToast('success', 'Invitación enviada con éxito')
      setInviteModalOpen(false)
      setForm({ nombre: '', email: '', rol: 'user' })
      fetchUsuarios() // Recargar lista
    } catch (err) {
      console.error('Error invitando usuario:', err)
      showToast('error', err.message || 'Error al enviar invitación')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 fade-up">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-indigo-400" />
            Gestión de Equipo
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Administra los accesos y roles de tus comerciales
          </p>
        </div>
        
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={15} />
          Invitar Comercial
        </button>
      </div>

      {/* ── Filtro / Búsqueda ── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* ── Tabla de Usuarios ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando equipo…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Sin resultados para esta búsqueda' : 'No hay miembros en el equipo'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Miembro</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Meta Mensual</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                    
                    {/* Miembro */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {u.nombre_completo?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-200">{u.nombre_completo || 'Sin nombre'}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="px-5 py-4">
                      {u.rol === 'admin' ? (
                        <div className="flex items-center gap-1.5 text-amber-400">
                          <Shield size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Administrador</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Comercial</span>
                        </div>
                      )}
                    </td>

                    {/* Meta Mensual */}
                    <td className="px-5 py-4">
                      {editingMetaId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="0"
                            autoFocus
                            value={editingMetaValue}
                            onChange={(e) => setEditingMetaValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveMeta(u.id);
                              if (e.key === 'Escape') setEditingMetaId(null);
                            }}
                            className="w-24 px-2 py-1 bg-black/40 border border-indigo-500/50 rounded-lg text-xs text-slate-100 focus:outline-none"
                          />
                          <button onClick={() => saveMeta(u.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Save size={14} />
                          </button>
                          <button onClick={() => setEditingMetaId(null)} className="text-slate-500 hover:text-slate-400">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/meta">
                          <span className="text-xs font-black text-slate-300">
                            S/ {(u.meta_ventas_mensual || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </span>
                          {u.rol === 'user' && (
                            <button 
                              onClick={() => {
                                setEditingMetaId(u.id);
                                setEditingMetaValue(u.meta_ventas_mensual || 0);
                              }}
                              className="text-slate-500 hover:text-indigo-400 opacity-0 group-hover/meta:opacity-100 transition-opacity"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        u.estado === 'activo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${u.estado === 'activo' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {u.estado}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        title={u.estado === 'activo' ? 'Suspender Acceso' : 'Activar Acceso'}
                        className={`p-2 rounded-xl border transition-all ${
                          u.estado === 'activo'
                            ? 'border-white/5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20'
                            : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.estado === 'activo' ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de Invitación ── */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* SIBLING 1: Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInviteModalOpen(false)}
          />
          {/* SIBLING 2: Card */}
          <div className="relative z-10 glass w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-indigo-400" />
                Invitar nuevo miembro
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="juan@empresa.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Rol en la empresa</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({...form, rol: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                >
                  <option value="user" className="bg-slate-900">Usuario (Acceso estándar)</option>
                  <option value="admin" className="bg-slate-900">Administrador (Control total)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSaving ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border shadow-2xl glass animate-in slide-in-from-bottom-2 ${
          toast.type === 'success' ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

    </div>
  )
}
