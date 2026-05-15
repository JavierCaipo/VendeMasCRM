// ============================================
// CERCO 3 — Vista de Catálogo (Grid)
// src/pages/inventario/CatalogoView.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { 
  PackageSearch, Plus, Search, Filter, Loader2, 
  FileText, FileCheck, Edit, Trash2, 
  CheckCircle2, AlertCircle, Box, FileSpreadsheet,
  LayoutGrid, List
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import ProductoForm from '../../components/inventario/ProductoForm'
import CsvProductModal from '../../components/inventario/CsvProductModal'

export default function CatalogoView() {
  const { tenant } = useTenant()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  
  const [formOpen, setFormOpen] = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productoToEdit, setProductoToEdit] = useState(null)
  const [productoToDelete, setProductoToDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const [userRole, setUserRole] = useState('user')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
      const rol = user?.rol || user?.user_metadata?.rol || user?.role || 'user'
      setUserRole(rol)
    })
  }, [])

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchCatalogData = useCallback(async () => {
    setLoading(true)
    
    // 1. Fetch Categorias
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .eq('negocio_id', tenant.id)
    setCategorias(cats || [])

    // 2. Fetch Productos + Join con Categorias + Stock
    const { data: prods, error } = await supabase
      .from('productos')
      .select(`
        *,
        categorias (nombre),
        stock:inventario (stock_actual, almacen_id)
      `)
      .eq('negocio_id', tenant.id)
      .order('fecha_creacion', { ascending: false })

    if (error) showToast('error', error.message)
    else setProductos(prods || [])
    
    setLoading(false)
  }, [tenant.id])

  useEffect(() => { fetchCatalogData() }, [fetchCatalogData])

  const handleDelete = async () => {
    if (!productoToDelete) return
    const prod = productoToDelete
    
    try {
      // 0. Borrado Físico de Storage (Imágenes y Docs)
      const pathsToDelete = []
      
      if (prod.fotos && Array.isArray(prod.fotos)) {
        prod.fotos.forEach(foto => {
          if (typeof foto === 'string' && foto.includes('/productos/')) {
            const parts = foto.split('/productos/')
            if (parts.length > 1) pathsToDelete.push(parts[1])
          }
        })
      }

      if (prod.url_ficha_tecnica && prod.url_ficha_tecnica.includes('/productos/')) {
        const parts = prod.url_ficha_tecnica.split('/productos/')
        if (parts.length > 1) pathsToDelete.push(parts[1])
      }

      if (prod.url_certificado_calidad && prod.url_certificado_calidad.includes('/productos/')) {
        const parts = prod.url_certificado_calidad.split('/productos/')
        if (parts.length > 1) pathsToDelete.push(parts[1])
      }

      if (pathsToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('productos')
          .remove(pathsToDelete)
          
        if (storageError) {
          console.warn('No se pudieron borrar los archivos físicos:', storageError)
        }
      }

      // 1. Limpieza de Relaciones (Inventario)
      // Nota: No tiene negocio_id, filtramos solo por producto_id
      const { error: invErr } = await supabase
        .from('inventario')
        .delete()
        .eq('producto_id', prod.id)
      
      if (invErr) throw invErr

      // 2. Borrado del Producto (Multitenancia)
      const { error: prodErr } = await supabase
        .from('productos')
        .delete()
        .eq('id', prod.id)
        .eq('negocio_id', tenant.id)

      if (prodErr) throw prodErr
      
      showToast('success', 'Producto y stock eliminados con éxito')
      setDeleteModalOpen(false)
      setProductoToDelete(null)
      fetchCatalogData()
    } catch (err) {
      console.error('Error al eliminar:', err)
      showToast('error', `Error al eliminar: ${err.message}`)
    }
  }

  const filtered = productos.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) || 
                         p.sku?.toLowerCase().includes(search.toLowerCase())
    const matchesCat = catFilter === 'all' || p.categoria_id === catFilter
    return matchesSearch && matchesCat
  })

  console.log("🔐 AUDITORÍA DE ROL:", { user: currentUser, userRole });

  return (
    <div className="space-y-6 fade-up">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <PackageSearch size={26} className="text-indigo-400" />
            Catálogo de Productos
          </h1>
          <p className="text-slate-400 mt-1">Gestión avanzada de artículos y fichas técnicas.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={16} className="text-slate-500 hidden sm:block" />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="w-full sm:w-48 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="all" className="bg-slate-900">Todas las categorías</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.nombre}</option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            title="Vista Cuadrícula"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            title="Vista Lista"
          >
            <List size={18} />
          </button>
        </div>

        {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-sm font-bold transition-all"
            >
              <FileSpreadsheet size={18} />
              Carga Masiva
            </button>
            <button
              onClick={() => { setProductoToEdit(null); setFormOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25"
            >
              <Plus size={18} />
              Nuevo Producto
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-500">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Sincronizando catálogo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-20 flex flex-col items-center justify-center text-center border border-white/5">
          <Box size={48} className="text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-400">Sin resultados</h3>
          <p className="text-sm text-slate-500 max-w-xs mt-1">
            No se encontraron productos con los filtros aplicados o tu catálogo está vacío.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(prod => {
            const totalStock = prod.stock?.reduce((acc, s) => acc + (s.stock_actual || 0), 0) || 0
            const mainImg = prod.fotos?.[0] || 'https://via.placeholder.com/300x200?text=Sin+Foto'

            return (
              <div key={prod.id} className="group relative glass border border-white/10 rounded-3xl overflow-hidden flex flex-col transition-all hover:border-indigo-500/30 hover:translate-y-[-4px]">
                
                {/* Media Container */}
                <div className="h-48 relative overflow-hidden bg-slate-900">
                  <img src={mainImg} alt={prod.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {prod.url_ficha_tecnica && (
                      <a 
                        href={prod.url_ficha_tecnica} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-indigo-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer pointer-events-auto" 
                        title="Ver Ficha Técnica"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={14} />
                      </a>
                    )}
                    {prod.url_certificado_calidad && (
                      <a 
                        href={prod.url_certificado_calidad}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-lg bg-emerald-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer pointer-events-auto" 
                        title="Ver Certificado de Calidad"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileCheck size={14} />
                      </a>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-[10px] font-mono font-bold text-indigo-300">{prod.sku || 'SIN-SKU'}</span>
                  </div>
                </div>

                {/* Info Container */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {prod.categorias?.nombre || 'General'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mb-4 leading-snug">{prod.nombre}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Precio Normal</p>
                      <p className="text-lg font-black text-slate-100">${parseFloat(prod.precio_c || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Stock Total</p>
                      <p className={`text-sm font-bold ${totalStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalStock} und
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Overlay */}
                {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setProductoToEdit(prod); setFormOpen(true); }}
                      className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => { setProductoToDelete(prod); setDeleteModalOpen(true); }}
                      className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* List View (Table) */
        <div className="glass rounded-3xl border border-white/10 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Producto</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">SKU</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Precio Normal</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">Stock</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(prod => {
                const totalStock = prod.stock?.reduce((acc, s) => acc + (s.stock_actual || 0), 0) || 0
                const mainImg = prod.fotos?.[0] || 'https://via.placeholder.com/300x200?text=Sin+Foto'

                return (
                  <tr key={prod.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={mainImg} className="w-10 h-10 rounded-lg object-cover border border-white/10 bg-slate-900" />
                        <span className="text-sm font-bold text-slate-200">{prod.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-indigo-400">{prod.sku || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {prod.categorias?.nombre || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-slate-100">${parseFloat(prod.precio_c || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-bold ${totalStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {prod.url_ficha_tecnica && (
                          <a 
                            href={prod.url_ficha_tecnica} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title="Ver Ficha Técnica"
                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText size={14} />
                          </a>
                        )}
                        {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
                          <>
                            <button
                              onClick={() => { setProductoToEdit(prod); setFormOpen(true); }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => { setProductoToDelete(prod); setDeleteModalOpen(true); }}
                              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ProductoForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        productoToEdit={productoToEdit}
        onSuccess={msg => { showToast('success', msg); fetchCatalogData(); }}
        onError={msg => showToast('error', msg)}
      />

      <CsvProductModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={msg => { showToast('success', msg); fetchCatalogData(); }}
        onError={msg => showToast('error', msg)}
      />

      {/* Modal de Confirmación de Borrado */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-100 text-center mb-2">¿Eliminar Producto?</h3>
            <p className="text-slate-400 text-center text-sm mb-8">
              Esta acción eliminará <span className="text-white font-bold">{productoToDelete?.nombre}</span> y todas sus existencias en almacenes. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setProductoToDelete(null); }}
                className="flex-1 px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg shadow-red-500/25"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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
