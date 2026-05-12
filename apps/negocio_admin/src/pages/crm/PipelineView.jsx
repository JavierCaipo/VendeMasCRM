import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { Settings, Plus, DollarSign, GripVertical, User, Calendar, RefreshCw, Clock, Wand2, Flame } from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  useDroppable,
  closestCorners
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import OportunidadModal from '../../components/crm/OportunidadModal'

// ── COMPONENTES INTERNOS DE DND-KIT ─────────────────────────────

function SortableLead({ lead, onClick, etapa }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: lead.id,
    data: { type: 'Opportunity', lead }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const diasInactivo = lead.fecha_creacion 
    ? Math.floor((new Date() - new Date(lead.fecha_creacion)) / (1000 * 60 * 60 * 24))
    : 0;

  const isDealRot = diasInactivo > 7 && etapa?.nombre && /borrador|propuesta|negociaci[oó]n/i.test(etapa.nombre);

  // Simulated AI probability formula
  const nombreEtapa = (etapa?.nombre || '').toLowerCase();
  let calcBase = 20;
  if (nombreEtapa.includes('prospecto')) calcBase = 20;
  else if (nombreEtapa.includes('calificado')) calcBase = 30;
  else if (nombreEtapa.includes('propuesta')) calcBase = 50;
  else if (nombreEtapa.includes('negociaci')) calcBase = 80;
  else if (nombreEtapa.includes('cerrado') || nombreEtapa.includes('ganad')) calcBase = 100;
  
  const discount = isDealRot ? (diasInactivo * 2) : 0;
  const baseProb = Math.max(5, calcBase - discount);
  const probColor = baseProb > 70 ? 'text-emerald-400' : baseProb > 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all cursor-grab group glass shadow-sm hover:shadow-indigo-500/10"
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug">{lead.titulo}</h4>
        {isDealRot && (
          <button 
            onClick={(e) => { e.stopPropagation(); toast('Sugerencia IA', { description: 'Próximamente: Sugerir mensaje de re-enganche con IA', icon: '🪄' }) }}
            className="shrink-0 p-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
            title="Sugerir mensaje de re-enganche con IA"
          >
            <Wand2 size={14} />
          </button>
        )}
      </div>
      
      {/* Indicadores de Lead Scoring y Deal Rot */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
          <Flame size={10} className={probColor} />
          <span className={`text-[9px] font-bold ${probColor}`}>{baseProb}%</span>
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${isDealRot ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
          <Clock size={10} />
          <span className="text-[9px] font-bold">{diasInactivo} días</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-xs font-black text-slate-300">
          ${parseFloat(lead.valor_estimado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        {lead.cliente && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">
            <User size={10} className="text-indigo-400" />
            <span className="text-[9px] font-bold text-slate-400 truncate max-w-[80px]">
              {lead.cliente.nombre_razon_social}
            </span>
          </div>
        )}
      </div>
      {/* Badge: Cierre Estimado */}
      {lead.fecha_cierre && (() => {
        const cierre = new Date(lead.fecha_cierre + 'T00:00:00')
        const hoy = new Date(); hoy.setHours(0,0,0,0)
        const vencida = cierre < hoy
        const label = cierre.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
        return (
          <div className={`flex items-center gap-1 mt-2 px-2 py-0.5 rounded-lg w-fit text-[9px] font-bold border ${
            vencida
              ? 'bg-red-500/10 border-red-500/25 text-red-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <Calendar size={9} />
            Cierre: {label}{vencida ? ' ⚠️' : ''}
          </div>
        )
      })()}
    </div>
  )
}

function DroppableColumn({ etapa, leads, onLeadClick, onAddClick }) {
  const { setNodeRef } = useDroppable({
    id: etapa.id,
    data: { type: 'Column', etapa }
  })

  return (
    <div 
      ref={setNodeRef}
      className="bg-white/5 rounded-xl p-3 flex flex-col gap-3 min-h-[150px] overflow-y-auto custom-scrollbar flex-1 border border-white/5"
    >
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        {leads.map(lead => (
          <SortableLead key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} etapa={etapa} />
        ))}
      </SortableContext>
      
      {leads.length === 0 && (
        <button onClick={() => onAddClick(etapa.id)} className="w-full py-4 rounded-xl border border-dashed border-white/10 text-slate-500 text-xs font-bold hover:bg-white/5 hover:text-slate-300 hover:border-white/20 transition-all flex items-center justify-center gap-2">
          <Plus size={14} /> Añadir oportunidad
        </button>
      )}
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────

export default function PipelineView() {
  const { tenant } = useTenant()
  const [configOpen, setConfigOpen] = useState(false)
  const [newEtapaNombre, setNewEtapaNombre] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [oportunidadToEdit, setOportunidadToEdit] = useState(null)
  const [etapaPreseleccionada, setEtapaPreseleccionada] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Drag Overlay
  const [activeId, setActiveId] = useState(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Evita clicks accidentales
      },
    })
  )

  const fetchPipelineData = async () => {
    if (!tenant?.id) return null
    try {
      const [resEtapas, resOportunidades] = await Promise.all([
        supabase
          .from('pipeline_etapas')
          .select('id, nombre, orden, color, negocio_id')
          .eq('negocio_id', tenant.id)
          .order('orden', { ascending: true }),
        supabase
          .from('oportunidades')
          .select('id, titulo, valor_estimado, etapa_id, negocio_id, cliente_id, fecha_creacion, fecha_cierre, cliente:clientes(nombre_razon_social), cotizaciones(moneda, tipo_cambio)')
          .eq('negocio_id', tenant.id)
          .order('fecha_creacion', { ascending: false })
      ])

      if (resEtapas.error) throw resEtapas.error
      if (resOportunidades.error) throw resOportunidades.error

      return { etapas: resEtapas.data || [], oportunidades: resOportunidades.data || [] }
    } catch (error) {
      console.error('Error fetching pipeline:', error)
      toast.error('Error al cargar pipeline: ' + error.message)
      return null
    }
  }

  const { data, isLoading: loading, mutate } = useSWR(tenant?.id ? ['pipeline', tenant.id] : null, fetchPipelineData)
  const etapas = data?.etapas || []
  const oportunidades = data?.oportunidades || []

  const handleAddEtapa = async () => {
    if (!newEtapaNombre.trim()) return
    const orden = etapas.length > 0 ? Math.max(...etapas.map(e => e.orden)) + 1 : 1
    
    try {
      const { error } = await supabase
        .from('pipeline_etapas')
        .insert({
          negocio_id: tenant.id,
          nombre: newEtapaNombre.trim(),
          orden
        })
      
      if (error) throw error
      
      toast.success('Etapa creada')
      setNewEtapaNombre('')
      mutate()
    } catch (err) {
      toast.error('Error al crear etapa: ' + err.message)
    }
  }

  // ── LÓGICA DE DRAG AND DROP ─────────────────────────────────

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeCardId = active.id
    let destinoId = over.id // Por defecto, asumimos que droppeó sobre la columna

    // Si droppeó sobre otra tarjeta SortableLead, obtenemos el etapa_id de esa tarjeta
    const targetLead = oportunidades.find(o => o.id === over.id)
    if (targetLead) {
      destinoId = targetLead.etapa_id
    }

    // Verificación rápida con active.data.current para early return
    const etapaOriginal = active.data.current?.lead?.etapa_id
    if (etapaOriginal === destinoId) return // Retorna sin hacer nada si no cambió de columna

    // Optimistic UI Update
    const newOportunidades = oportunidades.map(o => o.id === activeCardId ? { ...o, etapa_id: destinoId } : o)
    mutate({ etapas, oportunidades: newOportunidades }, false)

    // 2. Persistencia en Supabase
    try {
      const { error } = await supabase
        .from('oportunidades')
        .update({ etapa_id: destinoId })
        .eq('id', activeCardId)
      
      if (error) throw error
      mutate() // Revalidar desde BD
    } catch (err) {
      toast.error('Error al mover oportunidad: ' + err.message)
      mutate() // Rollback en caso de error
    }
  }

  const activeLeadData = useMemo(() => {
    return oportunidades.find(o => o.id === activeId)
  }, [activeId, oportunidades])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    )
  }

  // ── SYNC FORZADO ──────────────────────────────────────────────────────────
  const syncCotizaciones = async () => {
    if (!tenant?.id || isSyncing) return
    setIsSyncing(true)
    try {
      const { data: huerfanas } = await supabase
        .from('cotizaciones')
        .select('id, total, cliente_id, agente_id, correlativo, estado, clientes(nombre_razon_social)')
        .eq('negocio_id', tenant.id)
        .is('oportunidad_id', null)

      if (!huerfanas || huerfanas.length === 0) {
        toast.success('Todo sincronizado — no hay registros pendientes')
        return
      }

      const primeraEtapa = etapas[0]
      const ultimaEtapa  = etapas[etapas.length - 1]
      if (!primeraEtapa) { toast.error('Configura al menos una etapa primero'); return }

      let creadas = 0
      for (const cot of huerfanas) {
        const estadoNorm = (cot.estado || '').toLowerCase()
        const etapaTarget = estadoNorm === 'aceptada' ? ultimaEtapa : primeraEtapa
        const { data: newOp, error: opErr } = await supabase
          .from('oportunidades')
          .insert([{
            negocio_id: tenant.id,
            cliente_id: cot.cliente_id,
            agente_id: cot.agente_id,
            etapa_id: etapaTarget.id,
            titulo: `Cot. ${cot.correlativo || cot.id.slice(0,6)} — ${cot.clientes?.nombre_razon_social || 'Cliente'}`,
            valor_estimado: parseFloat(cot.total) || 0,
          }])
          .select('id').single()
        if (!opErr && newOp) {
          await supabase.from('cotizaciones').update({ oportunidad_id: newOp.id }).eq('id', cot.id)
          creadas++
        }
      }
      toast.success(`✅ ${creadas} oportunidad(es) sincronizada(s)`)
      mutate()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="h-full flex flex-col fade-up">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CRM Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Tablero comercial Data-Driven</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncCotizaciones}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors border border-emerald-500/20 disabled:opacity-50"
          >
            <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
            <span className="text-sm font-bold">{isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}</span>
          </button>
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/10"
          >
            <Settings size={16} />
            <span className="text-sm font-bold">Configurar Pipeline</span>
          </button>
        </div>
      </div>

      {/* TABLERO KANBAN CON DND-CONTEXT */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row overflow-x-auto gap-6 p-6 h-[calc(100vh-100px)] custom-scrollbar snap-x snap-mandatory pb-4 hide-scrollbar">
          {etapas.map(etapa => {
            // ── ANTI-INVISIBILIDAD: calcular etapaIds UNA SOLA VEZ fuera del máp ──
            // Se hace dentro del map pero usa el array etapas capturado en el closure.
            // Null-safe: String(null)==="null" no está en el Set de UUIDs reales.
            const etapaIds = new Set(etapas.map(e => String(e.id)))
            const leads = oportunidades.filter(o => String(o.etapa_id) === String(etapa.id))
            // Huérfanos: etapa_id es null O apunta a una etapa que ya no existe
            const orphans = etapa.id === etapas[0]?.id
              ? oportunidades.filter(o => o.etapa_id === null || !etapaIds.has(String(o.etapa_id)))
              : []
            const allLeads = [...leads, ...orphans]
            const color = etapa.color || 'indigo' 
            // Multimoneda: valor_estimado se asume en USD (columna no tiene moneda propia)
            // Para futura paridad, usar el tipo de cambio del negocio como referencia
            const tcRef = tenant?.tipo_cambio_usd_pen || 3.8

            // ── MISIÓN 1+2: Moneda real desde JOIN de cotizaciones ────────────────
            // Convierte cada oportunidad a USD usando la moneda de su cotización vinculada
            const toUSDLead = (lead) => {
              const v  = parseFloat(lead.valor_estimado) || 0
              const cot = lead.cotizaciones?.[0]
              const mon = (cot?.moneda || 'PEN').toUpperCase()
              const tc  = parseFloat(cot?.tipo_cambio) || tcRef
              return mon === 'USD' ? v : v / tc
            }
            const totalValorUSD = allLeads.reduce((acc, lead) => acc + toUSDLead(lead), 0)

            // Determinar si mostrar en S/ o $ según la moneda predominante de la columna
            const hayPEN = allLeads.some(l => {
              const mon = (l.cotizaciones?.[0]?.moneda || 'PEN').toUpperCase()
              return mon === 'PEN'
            })
            const simbolo = hayPEN ? 'S/' : '$'
            const totalMostrado = hayPEN
              ? totalValorUSD * tcRef  // USD → PEN para mostrar en soles
              : totalValorUSD

            return (
              <div 
                key={etapa.id}
                className="min-w-[85vw] md:min-w-[300px] w-[85vw] md:w-[300px] flex flex-col snap-center shrink-0 h-full"
              >
                {/* Etapa Header (Cristal) */}
                <div className="p-4 mb-4 glass rounded-2xl border border-white/10 flex flex-col" style={{ borderBottomColor: `var(--color-${color}-500, #6366f1)` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-black uppercase tracking-wider text-sm text-${color}-400`}>{etapa.nombre}</h3>
                      <span className="bg-white/10 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {allLeads.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setEtapaPreseleccionada(etapa.id)
                        setOportunidadToEdit(null)
                        setIsModalOpen(true)
                      }}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium tracking-wide">Valor Estimado</span>
                    <span className={`text-sm font-black text-${color}-400`}>
                      {simbolo} {totalMostrado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Zona de Carga Dinámica */}
                <DroppableColumn 
                  etapa={etapa} 
                  leads={allLeads} 
                  onLeadClick={(lead) => {
                    setOportunidadToEdit(lead)
                    setIsModalOpen(true)
                  }}
                  onAddClick={(etapaId) => {
                    setEtapaPreseleccionada(etapaId)
                    setOportunidadToEdit(null)
                    setIsModalOpen(true)
                  }}
                />
              </div>
            )
          })}

          {/* Añadir Etapa Rápida */}
          {etapas.length === 0 && (
            <div className="min-w-[300px] w-[300px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-500 h-[150px]">
              <p className="text-sm font-medium text-center">No hay etapas configuradas.</p>
              <button 
                onClick={() => setConfigOpen(true)}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-xs font-bold rounded-xl"
              >
                Crear Primera Etapa
              </button>
            </div>
          )}
        </div>

        {/* DRAG OVERLAY (FANTASMA) */}
        <DragOverlay>
          {activeId && activeLeadData ? (
            <div className="p-4 bg-white/5 border border-indigo-500/50 rounded-xl glass shadow-2xl opacity-90 scale-105 cursor-grabbing">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug">{activeLeadData.titulo}</h4>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-xs font-black text-slate-300">
                  ${parseFloat(activeLeadData.valor_estimado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* MODAL CONFIGURACION */}
      {configOpen && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center z-50 p-4">
          <div className="glass rounded-[2rem] border border-white/10 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Settings className="text-indigo-400" />
              Configurar Etapas (Data-Driven)
            </h2>
            
            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {etapas.map(etapa => (
                <div key={etapa.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <GripVertical size={16} className="text-slate-500 cursor-grab" />
                    <span className="text-sm font-bold text-slate-200">{etapa.nombre}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">Orden: {etapa.orden}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-8">
              <input 
                type="text" 
                value={newEtapaNombre}
                onChange={e => setNewEtapaNombre(e.target.value)}
                placeholder="Nombre de la nueva etapa..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
              />
              <button 
                onClick={handleAddEtapa}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setConfigOpen(false)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl text-sm font-bold transition-all"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OPORTUNIDAD */}
      <OportunidadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => mutate()}
        oportunidad={oportunidadToEdit}
        etapas={etapas}
        etapaPreseleccionada={etapaPreseleccionada}
      />
    </div>
  )
}
