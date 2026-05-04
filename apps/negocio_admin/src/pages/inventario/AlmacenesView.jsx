// ============================================
// CERCO 1 (Addon) — Gestión de Almacenes
// src/pages/inventario/AlmacenesView.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { Warehouse, Plus, Search, Loader2, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function AlmacenesView() {
  const { tenant } = useTenant()
  const [almacenes, setAlmacenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAlm, setEditingAlm] = useState(null)
  const [form, setForm] = useState({ nombre: '', ubicacion: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [userRole, setUserRole] = useState('comercial')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserRole(user?.user_metadata?.rol || 'comercial')
    })
  }, [])

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAlmacenes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('almacenes')
      .select('*')
      .eq('negocio_id', tenant.id)
      .order('nombre', { ascending: true })

    if (error) showToast('error', error.message)
    else setAlmacenes(data || [])
    setLoading(false)
  }, [tenant.id])

  useEffect(() => { fetchAlmacenes() }, [fetchAlmacenes])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const payload = { 
      ...form, 
      negocio_id: tenant.id,
      nombre: form.nombre.trim()
    }

    let error
    if (editingAlm) {
      const { error: err } = await supabase
        .from('almacenes')
        .update(payload)
        .eq('id', editingAlm.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('almacenes')
        .insert([payload])
      error = err
    }

    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', editingAlm ? 'Almacén actualizado' : 'Almacén creado')
      setModalOpen(false)
      setEditingAlm(null)
      setForm({ nombre: '', ubicacion: '' })
      fetchAlmacenes()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este almacén? Se perderá el rastro del stock asociado.')) return
    const { error } = await supabase.from('almacenes').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Almacén eliminado')
      fetchAlmacenes()
    }
  }

  const filtered = almacenes.filter(a => 
    a.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Warehouse size={26} className="text-indigo-400" />
            Almacenes
          </h1>
          <p className="text-slate-400 mt-1">Controla los puntos de almacenamiento de tus productos.</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => { setEditingAlm(null); setForm({ nombre: '', ubicacion: '' }); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Nuevo Almacén
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar almacén..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-slate-400 font-semibold">Nombre</th>
              <th className="px-6 py-4 text-slate-400 font-semibold">Ubicación</th>
              {userRole === 'admin' && <th className="px-6 py-4 text-right text-slate-400 font-semibold">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-slate-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Cargando almacenes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-slate-500 italic">
                  No hay almacenes registrados.
                </td>
              </tr>
            ) : filtered.map(alm => (
              <tr key={alm.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-200">{alm.nombre}</td>
                <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{alm.ubicacion || '—'}</td>
                {userRole === 'admin' && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingAlm(alm); setForm({ nombre: alm.nombre, ubicacion: alm.ubicacion || '' }); setModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(alm.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="relative bg-[#0B0F19] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 fade-up">
            <h2 className="text-lg font-bold text-slate-100">{editingAlm ? 'Editar' : 'Nuevo'} Almacén</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50"
                  placeholder="Ej: Almacén Central"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Ubicación</label>
                <input
                  value={form.ubicacion}
                  onChange={(e) => setForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50"
                  placeholder="Ej: Av. Principal 123"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 glass border border-white/10 hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : editingAlm ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

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
