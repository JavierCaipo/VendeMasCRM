// ============================================
// CERCO 1 — Gestión de Categorías
// src/pages/inventario/CategoriasView.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { Tags, Plus, Search, Loader2, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function CategoriasView() {
  const { tenant } = useTenant()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [userRole, setUserRole] = useState(undefined)
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
      const rol = user?.rol || user?.user_metadata?.rol || user?.role
      setUserRole(rol)
      setIsLoadingAuth(false)
    })
  }, [])

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCategorias = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('negocio_id', tenant.id)
      .order('nombre', { ascending: true })

    if (error) showToast('error', error.message)
    else setCategorias(data || [])
    setLoading(false)
  }, [tenant.id])

  useEffect(() => { fetchCategorias() }, [fetchCategorias])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    const payload = { 
      ...form, 
      negocio_id: tenant.id,
      nombre: form.nombre.trim()
    }

    let error
    if (editingCat) {
      const { error: err } = await supabase
        .from('categorias')
        .update(payload)
        .eq('id', editingCat.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('categorias')
        .insert([payload])
      error = err
    }

    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', editingCat ? 'Categoría actualizada' : 'Categoría creada')
      setModalOpen(false)
      setEditingCat(null)
      setForm({ nombre: '', descripcion: '' })
      fetchCategorias()
    }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Se desvinculará de los productos.')) return
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) showToast('error', error.message)
    else {
      showToast('success', 'Categoría eliminada')
      fetchCategorias()
    }
  }

  const filtered = categorias.filter(c => 
    c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Tags size={26} className="text-indigo-400" />
            Categorías
          </h1>
          <p className="text-slate-400 mt-1">Organiza tu catálogo para una búsqueda eficiente.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        {isLoadingAuth ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-40 h-11 bg-indigo-500/20 rounded-xl" />
          </div>
        ) : userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingCat(null); setForm({ nombre: '', descripcion: '' }); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={18} />
              Nueva Categoría
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-slate-400 font-semibold">Nombre</th>
              <th className="px-6 py-4 text-slate-400 font-semibold">Descripción</th>
              {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && <th className="px-6 py-4 text-right text-slate-400 font-semibold">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-slate-500">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                  Cargando categorías...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-slate-500 italic">
                  No hay categorías registradas.
                </td>
              </tr>
            ) : filtered.map(cat => (
              <tr key={cat.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-200">{cat.nombre}</td>
                <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{cat.descripcion || '—'}</td>
                {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCat(cat); setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' }); setModalOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
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
            <h2 className="text-lg font-bold text-slate-100">{editingCat ? 'Editar' : 'Nueva'} Categoría</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nombre *</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50"
                  placeholder="Ej: Maquinaria Pesada"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 h-24"
                  placeholder="Opcional..."
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
                {submitting ? <Loader2 size={16} className="animate-spin" /> : editingCat ? 'Actualizar' : 'Crear'}
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
