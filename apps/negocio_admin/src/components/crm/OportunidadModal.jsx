import { useState, useEffect } from 'react'
import { X, DollarSign, Briefcase, User, Loader2, FileText, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { toast } from 'sonner'

export default function OportunidadModal({
  isOpen,
  onClose,
  onSave,
  oportunidad = null,
  etapas = [],
  etapaPreseleccionada = null
}) {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const defaultFechaCierre = () => {
    const d = new Date()
    d.setDate(d.getDate() + 15)
    return d.toISOString().split('T')[0]  // YYYY-MM-DD
  }

  const [formData, setFormData] = useState({
    titulo: '',
    valor_estimado: 0,
    cliente_id: '',
    etapa_id: '',
    fecha_cierre: defaultFechaCierre()
  })

  // Cargar Clientes para el Dropdown
  useEffect(() => {
    if (!isOpen) return
    const fetchClientes = async () => {
      setLoadingClientes(true)
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('id, nombre_razon_social')
          .eq('negocio_id', tenant.id)
          .order('nombre_razon_social', { ascending: true })
        if (error) throw error
        setClientes(data || [])
      } catch (err) {
        console.error('Error fetching clientes:', err)
        toast.error('Error al cargar clientes')
      } finally {
        setLoadingClientes(false)
      }
    }
    fetchClientes()
  }, [isOpen, tenant.id])

  // Inicializar estado del formulario
  useEffect(() => {
    if (isOpen) {
      if (oportunidad) {
        setFormData({
          titulo: oportunidad.titulo || '',
          valor_estimado: oportunidad.valor_estimado || 0,
          cliente_id: oportunidad.cliente_id || '',
          etapa_id: oportunidad.etapa_id || '',
          fecha_cierre: oportunidad.fecha_cierre || defaultFechaCierre()
        })
      } else {
        setFormData({
          titulo: '',
          valor_estimado: 0,
          cliente_id: '',
          etapa_id: etapaPreseleccionada || (etapas.length > 0 ? etapas[0].id : ''),
          fecha_cierre: defaultFechaCierre()
        })
      }
    }
  }, [isOpen, oportunidad, etapaPreseleccionada, etapas])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.titulo.trim()) {
      return toast.error('El título es obligatorio')
    }
    if (!formData.etapa_id) {
      return toast.error('Debe seleccionar una etapa')
    }

    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      const payload = {
        negocio_id: tenant.id,
        titulo: formData.titulo.trim(),
        valor_estimado: parseFloat(formData.valor_estimado) || 0,
        cliente_id: formData.cliente_id || null,
        etapa_id: formData.etapa_id,
        agente_id: user.id,
        fecha_cierre: formData.fecha_cierre || null
      }

      if (oportunidad?.id) {
        // UPDATE
        const { error } = await supabase
          .from('oportunidades')
          .update(payload)
          .eq('id', oportunidad.id)
        if (error) throw error
        toast.success('Oportunidad actualizada')
      } else {
        // INSERT
        const { error } = await supabase
          .from('oportunidades')
          .insert(payload)
        if (error) throw error
        toast.success('Oportunidad creada')
      }

      onSave() // Refresca el pipeline
      onClose()
    } catch (err) {
      console.error('Error guardando oportunidad:', err)
      toast.error('Error al guardar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      <div className="bg-[#0B0F19] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg relative overflow-hidden flex flex-col">
        {/* Botón de Cierre Absoluto */}
        <X 
          size={20} 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer z-10 transition-colors"
        />

        {/* Cabecera Glassmorphism */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {oportunidad ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Gestión de Pipeline Comercial</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Título de la Oportunidad
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej. Venta de 50 Cascos MSA"
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-lg font-medium"
            />
          </div>

          {/* Valor Estimado + Cierre Estimado — grid 2 columnas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Valor Estimado
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <DollarSign size={18} className="text-indigo-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valor_estimado}
                  onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-emerald-400 focus:outline-none focus:border-indigo-500 transition-all text-lg font-black"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                <Calendar size={11} className="text-amber-400" /> Cierre Estimado
              </label>
              <input
                type="date"
                value={formData.fecha_cierre || ''}
                onChange={(e) => setFormData({ ...formData, fecha_cierre: e.target.value || null })}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-amber-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-bold text-sm"
              />
            </div>
          </div>

          {/* Etapa */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Etapa del Pipeline
            </label>
            <select
              required
              value={formData.etapa_id}
              onChange={(e) => setFormData({ ...formData, etapa_id: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="" disabled>Seleccionar etapa...</option>
              {etapas.map(etapa => (
                <option key={etapa.id} value={etapa.id}>{etapa.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cliente Relacionado */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Cliente Relacionado (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-slate-500" />
              </div>
              <select
                value={formData.cliente_id}
                onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Sin cliente / Lead Frío</option>
                {clientes.map(cli => (
                  <option key={cli.id} value={cli.id}>{cli.nombre_razon_social}</option>
                ))}
              </select>
              {loadingClientes && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <Loader2 size={16} className="text-slate-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
          {oportunidad && (
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(`/cotizaciones/nueva?oportunidad_id=${oportunidad.id}${oportunidad.cliente_id ? '&cliente_id=' + oportunidad.cliente_id : ''}`)
              }}
              className="flex-none p-3 rounded-xl font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center justify-center"
              title="Generar Cotización"
            >
              <FileText size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
