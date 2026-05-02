import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { Settings, Plus, DollarSign, GripVertical } from 'lucide-react'
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

function SortableLead({ lead, onClick }) {
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

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all cursor-grab group glass shadow-sm hover:shadow-indigo-500/10"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-bold text-slate-200 line-clamp-2 leading-snug">{lead.titulo}</h4>
      </div>
      <div className="flex items-center gap-1.5 mt-3">
        <span className="text-xs font-black text-slate-300">
          ${parseFloat(lead.valor_estimado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
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
          <SortableLead key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
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
  const [loading, setLoading] = useState(true)
  const [etapas, setEtapas] = useState([])
  const [oportunidades, setOportunidades] = useState([])
  const [configOpen, setConfigOpen] = useState(false)
  const [newEtapaNombre, setNewEtapaNombre] = useState('')

  // Estado para Modal de Oportunidad
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [oportunidadToEdit, setOportunidadToEdit] = useState(null)
  const [etapaPreseleccionada, setEtapaPreseleccionada] = useState(null)

  // Estado para Drag Overlay
  const [activeId, setActiveId] = useState(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Evita clicks accidentales
      },
    })
  )

  const fetchPipelineData = async () => {
    try {
      setLoading(true)
      
      const [resEtapas, resOportunidades] = await Promise.all([
        supabase
          .from('pipeline_etapas')
          .select('*')
          .eq('negocio_id', tenant.id)
          .order('orden', { ascending: true }),
        supabase
          .from('oportunidades')
          .select('*')
          .eq('negocio_id', tenant.id)
          .order('fecha_creacion', { ascending: false })
      ])

      if (resEtapas.error) throw resEtapas.error
      if (resOportunidades.error) throw resOportunidades.error

      setEtapas(resEtapas.data || [])
      setOportunidades(resOportunidades.data || [])
    } catch (error) {
      console.error('Error fetching pipeline:', error)
      toast.error('Error al cargar pipeline: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenant?.id) fetchPipelineData()
  }, [tenant?.id])

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
      fetchPipelineData()
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
    setOportunidades(prev => prev.map(o => o.id === activeCardId ? { ...o, etapa_id: destinoId } : o))

    // 2. Persistencia en Supabase
    try {
      const { error } = await supabase
        .from('oportunidades')
        .update({ etapa_id: destinoId })
        .eq('id', activeCardId)
      
      if (error) throw error
    } catch (err) {
      toast.error('Error al mover oportunidad: ' + err.message)
      fetchPipelineData() // Rollback en caso de error
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

  return (
    <div className="h-full flex flex-col fade-up">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CRM Pipeline</h1>
          <p className="text-sm text-slate-400 mt-1">Tablero comercial Data-Driven</p>
        </div>
        <button
          onClick={() => setConfigOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors border border-white/10"
        >
          <Settings size={16} />
          <span className="text-sm font-bold">Configurar Pipeline</span>
        </button>
      </div>

      {/* TABLERO KANBAN CON DND-CONTEXT */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto gap-6 p-6 h-[calc(100vh-100px)] custom-scrollbar">
          {etapas.map(etapa => {
            const leads = oportunidades.filter(o => o.etapa_id === etapa.id)
            const color = etapa.color || 'indigo' 
            const totalValor = leads.reduce((acc, lead) => acc + (parseFloat(lead.valor_estimado) || 0), 0)

            return (
              <div 
                key={etapa.id}
                className="min-w-[300px] max-w-[300px] flex flex-col snap-start shrink-0 h-full"
              >
                {/* Etapa Header (Cristal) */}
                <div className="p-4 mb-4 glass rounded-2xl border border-white/10 flex flex-col" style={{ borderBottomColor: `var(--color-${color}-500, #6366f1)` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-black uppercase tracking-wider text-sm text-${color}-400`}>{etapa.nombre}</h3>
                      <span className="bg-white/10 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {leads.length}
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
                      ${totalValor.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Zona de Carga Dinámica */}
                <DroppableColumn 
                  etapa={etapa} 
                  leads={leads} 
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
        onSave={fetchPipelineData}
        oportunidad={oportunidadToEdit}
        etapas={etapas}
        etapaPreseleccionada={etapaPreseleccionada}
      />
    </div>
  )
}
