// ============================================
// CERCO 3 — BusinessManager (Gestión de Negocios)
// src/components/business/BusinessManager.jsx
// ============================================
import { useEffect, useState, useCallback } from 'react'
import {
  Building2, Plus, RefreshCw, Search,
  CheckCircle2, AlertCircle, Loader2, Globe, ToggleLeft, ToggleRight,
  Link2, Copy, Check,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import NewTenantModal from './NewTenantModal'

// ── StatusBadge ──────────────────────────────────────────────
function StatusBadge({ estado }) {
  const isActive = estado === 'activo'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isActive
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
        : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 pulse-dot' : 'bg-rose-400'}`} />
      {isActive ? 'Activo' : 'Suspendido'}
    </span>
  )
}

// ── StatusToggle ─────────────────────────────────────────────
function StatusToggle({ negocio, onToggle, loading }) {
  const isActive = negocio.estado === 'activo'
  return (
    <button
      onClick={() => onToggle(negocio)}
      disabled={loading}
      title={isActive ? 'Suspender negocio' : 'Activar negocio'}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        border transition-all duration-200 disabled:opacity-50 disabled:cursor-wait
        ${isActive
          ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
        }
      `}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isActive ? (
        <ToggleRight size={14} />
      ) : (
        <ToggleLeft size={14} />
      )}
      {isActive ? 'Suspender' : 'Activar'}
    </button>
  )
}

// ── CopyInviteButton ─────────────────────────────────────────
// Solo se renderiza si el negocio tiene al menos una invitación 'pendiente'.
function CopyInviteButton({ negocio, onCopied }) {
  const [justCopied, setJustCopied] = useState(false)

  // Busca la primera invitación pendiente (el JOIN devuelve un array)
  const invitaciones = negocio.invitaciones ?? []
  const pendiente = invitaciones.find(inv => inv.estado === 'pendiente')

  if (!pendiente) return null

  async function handleCopy() {
    const link = `${window.location.origin}/registro?token=${pendiente.id}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Fallback para contextos HTTP sin Clipboard API
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setJustCopied(true)
    onCopied?.('Enlace de invitación copiado ✅')
    setTimeout(() => setJustCopied(false), 2500)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar enlace de invitación pendiente"
      className={`
        flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
        border transition-all duration-200
        ${
          justCopied
            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
            : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
        }
      `}
    >
      {justCopied ? (
        <><Check size={12} /> Copiado</>
      ) : (
        <><Link2 size={12} /> Invitación</>
      )}
    </button>
  )
}

// ── Toast notification ────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border shadow-2xl glass animate-in slide-in-from-bottom-2 ${
      toast.type === 'success'
        ? 'border-emerald-500/30 text-emerald-300'
        : 'border-red-500/30 text-red-300'
    }`}>
      {toast.type === 'success'
        ? <CheckCircle2 size={16} />
        : <AlertCircle   size={16} />
      }
      {toast.msg}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function BusinessManager() {
  const [negocios,     setNegocios]     = useState([])
  const [filtered,     setFiltered]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [togglingId,   setTogglingId]   = useState(null)
  const [toast,        setToast]        = useState(null)
  const [modalOpen,    setModalOpen]    = useState(false)

  // ── Fetch ──────────────────────────────────────────────────
  const fetchNegocios = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('negocios')
      .select('id, nombre, subdominio, estado, fecha_creacion, invitaciones(id, estado)')
      .order('fecha_creacion', { ascending: false })

    if (error) {
      showToast('error', 'Error al cargar negocios: ' + error.message)
    } else {
      setNegocios(data ?? [])
      setFiltered(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNegocios() }, [fetchNegocios])

  // ── Search filter ─────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      negocios.filter(n =>
        n.nombre?.toLowerCase().includes(q) ||
        n.subdominio?.toLowerCase().includes(q)
      )
    )
  }, [search, negocios])

  // ── Toast ─────────────────────────────────────────────────
  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Toggle estado ─────────────────────────────────────────
  async function handleToggle(negocio) {
    const nuevoEstado = negocio.estado === 'activo' ? 'suspendido' : 'activo'
    setTogglingId(negocio.id)

    const { error } = await supabase
      .from('negocios')
      .update({ estado: nuevoEstado })
      .eq('id', negocio.id)

    if (error) {
      showToast('error', `Error al actualizar estado: ${error.message}`)
    } else {
      setNegocios(prev =>
        prev.map(n => n.id === negocio.id ? { ...n, estado: nuevoEstado } : n)
      )
      showToast(
        'success',
        `"${negocio.nombre}" → ${nuevoEstado === 'activo' ? 'Activado ✅' : 'Suspendido ⏸️'}`
      )
    }
    setTogglingId(null)
  }

  // ── Stats ─────────────────────────────────────────────────
  const totalActivos    = negocios.filter(n => n.estado === 'activo').length
  const totalSuspendidos = negocios.filter(n => n.estado === 'suspendido').length

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building2 size={22} className="text-indigo-400" />
            Gestión de Negocios
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Administra todos los tenants del ecosistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNegocios}
            className="p-2 rounded-xl glass border border-white/10 text-slate-400 hover:text-slate-200 transition-all"
            title="Actualizar"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={15} />
            Nuevo Tenant
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Negocios',  value: negocios.length,  color: 'text-slate-100',   border: 'border-white/10'          },
          { label: 'Activos',         value: totalActivos,     color: 'text-emerald-400', border: 'border-emerald-500/20'    },
          { label: 'Suspendidos',     value: totalSuspendidos, color: 'text-rose-400',    border: 'border-rose-500/20'       },
        ].map(({ label, value, color, border }) => (
          <div key={label} className={`glass rounded-xl p-4 border ${border}`}>
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o subdominio…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-500 bg-white/5 border border-white/10 focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      {/* ── Table ── */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando negocios…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Building2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Sin resultados para esta búsqueda' : 'Aún no hay negocios registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full shadow-sm rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Negocio', 'Subdominio', 'Estado', 'Creado', 'Acciones'].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(negocio => (
                  <tr
                    key={negocio.id}
                    className="hover:bg-white/3 transition-colors group"
                  >
                    {/* Nombre */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-400">
                            {negocio.nombre?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="font-medium text-slate-200">{negocio.nombre}</span>
                      </div>
                    </td>

                    {/* Subdominio */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                        <Globe size={11} />
                        {negocio.subdominio}.vendemas.app
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge estado={negocio.estado} />
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {negocio.fecha_creacion
                        ? new Date(negocio.fecha_creacion).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusToggle
                          negocio={negocio}
                          onToggle={handleToggle}
                          loading={togglingId === negocio.id}
                        />
                        <CopyInviteButton
                          negocio={negocio}
                          onCopied={(msg) => showToast('success', msg)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      <NewTenantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchNegocios}
      />

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  )
}
