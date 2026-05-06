// ============================================
// CERCO 1 — Módulo Principal de Clientes
// src/pages/ClientesView.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, UploadCloud, Search, Loader2, Edit, Trash2, CheckCircle2, AlertCircle, UserCircle, MessageSquare, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'
import ClienteModal from '../components/clientes/ClienteModal'
import CsvImportModal from '../components/clientes/CsvImportModal'
import ContactosModal from '../components/clientes/ContactosModal'
import ClienteTimeline from '../components/crm/ClienteTimeline'

export default function ClientesView() {
  const { tenant } = useTenant()

  const [clientes, setClientes] = useState([])
  const [comerciales, setComerciales] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [user, setUser]         = useState(null)

  const userRole = user?.user_metadata?.rol || 'comercial'

  // Modals
  const [modalOpen, setModalOpen]       = useState(false)
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [contactosModalOpen, setContactosModalOpen] = useState(false)
  const [clienteToEdit, setClienteToEdit] = useState(null)
  const [clienteForContactos, setClienteForContactos] = useState(null)

  // Drawer Timeline
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const [toast, setToast] = useState(null)

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── 1. Carga inicial (Clientes y Agentes) ──
  const fetchData = useCallback(async () => {
    if (!tenant?.id) return
    setLoading(true)

    const { data: authData } = await supabase.auth.getUser()
    setUser(authData?.user)

    // A. Clientes
    const { data: dataC, error: errC } = await supabase
      .from('clientes')
      .select('*')
      .eq('negocio_id', tenant.id)
      .order('fecha_creacion', { ascending: false })

    // B. Todos los usuarios del negocio (para mapeo completo en el select)
    const { data: dataCom, error: errCom } = await supabase
      .from('usuarios_negocio')
      .select('id, nombre_completo, email, rol')
      .eq('negocio_id', tenant.id)

    if (errC) showToast('error', `Error al cargar clientes: ${errC.message}`)
    if (errCom) console.warn('Error al cargar comerciales:', errCom.message)

    setClientes(dataC || [])
    setFiltered(dataC || [])
    setComerciales(dataCom || [])
    setLoading(false)
  }, [tenant?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── 2. Filtro local ──
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      clientes.filter(c =>
        c.nombre_razon_social?.toLowerCase().includes(q) ||
        c.numero_documento?.toLowerCase().includes(q)
      )
    )
  }, [search, clientes])

  // ── 3. Asignación Rápida (Update Agente) ──
  async function handleAsignarAgente(clienteId, agenteId) {
    // Optimistic UI update
    setClientes(prev => prev.map(c => c.id === clienteId ? { ...c, agente_asignado_id: agenteId } : c))

    const { error } = await supabase
      .from('clientes')
      .update({ agente_asignado_id: agenteId || null })
      .eq('id', clienteId)

    if (error) {
      showToast('error', 'Error al asignar agente.')
      fetchData() // rollback visual en caso de error
    } else {
      showToast('success', 'Agente reasignado')
    }
  }

  // ── 4. Eliminar Cliente ──
  async function handleDelete(cliente) {
    if (!confirm(`¿Eliminar permanentemente a ${cliente.nombre_razon_social}?`)) return
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', cliente.id)

    if (error) {
      showToast('error', `No se pudo eliminar: ${error.message}`)
    } else {
      showToast('success', 'Cliente eliminado')
      fetchData()
    }
  }

  return (
    <div className="space-y-6 fade-up">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-indigo-400" />
            Base de Clientes
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestiona la cartera comercial del negocio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botón Importar CSV */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium glass border border-white/10 hover:bg-white/10 text-slate-300 transition-all"
          >
            <UploadCloud size={15} />
            Importar CSV
          </button>
          
          {/* Botón Nuevo */}
          <button
            onClick={() => { setClienteToEdit(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={15} />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ── Filtro / Búsqueda ── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o documento…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* ── Tabla de Datos ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando base de clientes…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Sin resultados para esta búsqueda' : 'No hay clientes registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Documento</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cliente</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Agente Asignado</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    
                    {/* Documento */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                          {c.tipo_documento}
                        </span>
                        <span className="font-mono text-slate-300">{c.numero_documento}</span>
                      </div>
                    </td>

                    {/* Nombre */}
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-200">{c.nombre_razon_social}</div>
                      {c.direccion && <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={c.direccion}>{c.direccion}</div>}
                    </td>

                    {/* Contacto */}
                    <td className="px-5 py-4 text-xs">
                      {c.email && <div className="text-slate-300">{c.email}</div>}
                      {c.telefono && <div className="text-slate-500">{c.telefono}</div>}
                      {!c.email && !c.telefono && <span className="text-slate-600 italic">Sin datos</span>}
                    </td>

                    {/* Asignación Rápida */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <UserCircle size={14} className={c.agente_asignado_id ? 'text-indigo-400' : 'text-slate-600'} />
                        {userRole === 'admin' ? (
                          <select
                            value={c.agente_asignado_id || ''}
                            onChange={(e) => handleAsignarAgente(c.id, e.target.value)}
                            className="bg-transparent text-xs text-slate-300 border-none focus:ring-0 cursor-pointer outline-none w-full max-w-[140px] truncate"
                          >
                            <option value="" className="bg-slate-900 text-slate-500">-- Sin asignar --</option>
                            {comerciales.map(ag => (
                              <option key={ag.id} value={ag.id} className="bg-slate-900">
                                {ag.nombre_completo || ag.email}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-300 truncate max-w-[140px] inline-block">
                            {(() => {
                              if (!c.agente_asignado_id) return 'Sin asignar';
                              const ag = comerciales.find(a => a.id === c.agente_asignado_id);
                              return ag ? (ag.nombre_completo || ag.email) : 'Desconocido';
                            })()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setClienteSeleccionado(c); setDrawerOpen(true); }}
                          title="Timeline del Cliente"
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => { setClienteForContactos(c); setContactosModalOpen(true); }}
                          title="Contactos B2B"
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        >
                          <Users size={14} />
                        </button>
                        <button
                          onClick={() => { setClienteToEdit(c); setModalOpen(true); }}
                          title="Editar"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          title="Eliminar"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      <ClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clienteToEdit={clienteToEdit}
        onSuccess={(msg) => { showToast('success', msg); fetchData(); }}
        onError={(msg) => showToast('error', msg)}
      />

      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={(msg) => { showToast('success', msg); fetchData(); }}
        onError={(msg) => showToast('error', msg)}
      />

      <ContactosModal
        isOpen={contactosModalOpen}
        onClose={() => setContactosModalOpen(false)}
        cliente={clienteForContactos}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border shadow-2xl glass animate-in slide-in-from-bottom-2 ${
          toast.type === 'success' ? 'border-emerald-500/30 text-emerald-300' : 'border-red-500/30 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Drawer: Timeline ── */}
      {drawerOpen && clienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md h-full bg-[#0B0F19] border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
            {/* Cabecera del Drawer */}
            <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-100 truncate pr-4">
                  {clienteSeleccionado.nombre_razon_social}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Timeline de Interacciones
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cuerpo del Drawer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ClienteTimeline cliente_id={clienteSeleccionado.id} />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
