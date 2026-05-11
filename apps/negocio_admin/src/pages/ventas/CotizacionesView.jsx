// ============================================
// CERCO 3 — Gestor de Cotizaciones
// src/pages/ventas/CotizacionesView.jsx
// ============================================
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Search, Filter, Loader2, 
  Eye, Download, Send, CheckCircle2, AlertCircle, Clock,
  MessageCircle, Link, X, Share2
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { PDFDownloadLink } from '@react-pdf/renderer'
import CotizacionPDF from '../../components/ventas/CotizacionPDF'
import { toast } from 'sonner'

const MENSAJES_ESTRATEGICOS = [
  "Hola {cliente}, espero que estés muy bien. 👋 Te comparto la propuesta {correlativo} enfocada en potenciar la eficiencia de tu operación. Puedes ver los detalles aquí: {url}",
  "Estimado {cliente}, un gusto saludarte. Adjunto la cotización {correlativo} con las soluciones técnicas que conversamos. Revisión y aprobación en línea: {url}",
  "Hola {cliente}! 👋 He preparado la propuesta {correlativo} priorizando la seguridad y calidad que tu proyecto exige. Detalles completos en: {url}",
  "Qué tal {cliente}? Aquí tienes la propuesta comercial {correlativo}. Mi objetivo es ser tu aliado estratégico en este crecimiento. Link seguro: {url}",
  "Hola {cliente}, te envío la cotización {correlativo}. Hemos ajustado los costos para ofrecerte la mejor rentabilidad del mercado. Mírala aquí: {url}",
  "Estimado {cliente}, te comparto la propuesta {correlativo} con los tiempos de entrega optimizados que solicitaste. Gestión en línea: {url}",
  "Hola {cliente}! 👋 Adjunto la solución {correlativo}. Quedo atento a tus comentarios para iniciar cuanto antes. Enlace a la propuesta: {url}",
  "Hola {cliente}, espero que tengas un excelente día. Te envío la cotización {correlativo} diseñada para maximizar tu productividad. Revísala aquí: {url}",
  "Estimado {cliente}, un placer saludarte. Aquí tienes la propuesta {correlativo} con las certificaciones de calidad incluidas. Link: {url}",
  "Hola {cliente}! 👋 Te comparto la propuesta comercial {correlativo}. Estamos listos para ser parte de tu éxito. Detalles: {url}",
  "Qué tal {cliente}? Te envío la cotización {correlativo} con el soporte técnico premium que nos caracteriza. Ver portal: {url}",
  "Hola {cliente}, te adjunto la propuesta {correlativo}. Hemos simplificado el proceso para tu mayor comodidad. Revisa y aprueba aquí: {url}",
  "Estimado {cliente}, un gusto saludarte. Te envío la propuesta {correlativo} enfocada en la durabilidad y alto rendimiento. Link: {url}",
  "Hola {cliente}! 👋 He preparado la cotización {correlativo} pensando en el ahorro operativo de tu negocio. Detalles: {url}",
  "Hola {cliente}, te comparto la propuesta {correlativo}. Calidad garantizada para los estándares de tu empresa. Ver aquí: {url}",
  "Estimado {cliente}, aquí tienes la cotización {correlativo}. Transparencia y compromiso en cada detalle. Enlace seguro: {url}",
  "Hola {cliente}! 👋 Te envío la propuesta {correlativo}. Innovación constante para tus necesidades actuales. Portal de cliente: {url}",
  "Qué tal {cliente}? Adjunto la propuesta comercial {correlativo} con la flexibilidad que tu operación requiere. Link: {url}",
  "Hola {cliente}, espero que estés bien. Te envío la cotización {correlativo} con garantía extendida incluida. Revísala aquí: {url}",
  "Estimado {cliente}, un placer. Te comparto la propuesta {correlativo} para fortalecer nuestra alianza comercial. Detalles: {url}",
  "Hola {cliente}! 👋 Te envío la propuesta {correlativo} con el respaldo técnico que tu equipo necesita. Ver en línea: {url}",
  "Hola {cliente}, te adjunto la cotización {correlativo}. Precisión y rapidez para tus requerimientos. Enlace: {url}",
  "Estimado {cliente}, un gusto. Aquí tienes la propuesta {correlativo} con los mejores insumos del sector. Gestión rápida: {url}",
  "Hola {cliente}! 👋 Te comparto la cotización {correlativo}. Juntos llevaremos tu proyecto al siguiente nivel. Detalles: {url}",
  "Qué tal {cliente}? Te envío la propuesta {correlativo}. Disponibilidad inmediata para tu tranquilidad. Ver aquí: {url}"
];

export default function CotizacionesView() {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('all')
  const [chatQuote, setChatQuote] = useState(null)
  const [blinkId, setBlinkId] = useState(null) // ID que recibe animación de aprobación

  const formatNumber = (num) => {
    return (parseFloat(num) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleWhatsApp = (q) => {
    const urlPublica = `${window.location.origin}/c/${q.id}`;
    const mensajeBase = MENSAJES_ESTRATEGICOS[Math.floor(Math.random() * MENSAJES_ESTRATEGICOS.length)];
    const mensaje = mensajeBase
      .replace('{cliente}', q.clientes?.nombre_razon_social || 'estimado cliente')
      .replace('{correlativo}', q.correlativo)
      .replace('{url}', urlPublica);
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  }

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('id, negocio_id, cliente_id, contacto_id, oportunidad_id, agente_id, correlativo, moneda, tipo_cambio, total, estado, fecha_creacion, clientes(nombre_razon_social, numero_documento), agente:perfiles(nombre_completo), contacto:cliente_contactos(id, nombre_completo, cargo, email, telefono)')
      .eq('negocio_id', tenant.id)
      .order('fecha_creacion', { ascending: false })

    if (error) console.error(error)
    else setCotizaciones(data || [])
    setLoading(false)
  }, [tenant.id])

  useEffect(() => { fetchCotizaciones() }, [fetchCotizaciones])

  // ── REALTIME: escucha cambios de estado desde el portal del cliente ─────────────────
  useEffect(() => {
    if (!tenant?.id) return
    const channel = supabase
      .channel('cotizaciones_cambios')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cotizaciones', filter: `negocio_id=eq.${tenant.id}` },
        (payload) => {
          const updated = payload.new
          // Actualizar estado local sin re-fetch
          setCotizaciones(prev =>
            prev.map(c => c.id === updated.id ? { ...c, estado: updated.estado } : c)
          )
          // Activar blink si fue ACEPTADA (desde el portal público)
          if ((updated.estado || '').toLowerCase() === 'aceptada') {
            setBlinkId(updated.id)
            setTimeout(() => setBlinkId(null), 15000)
          }
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [tenant?.id])

  const filtered = cotizaciones.filter(c => {
    const matchesSearch = c.clientes?.nombre_razon_social.toLowerCase().includes(search.toLowerCase()) || 
                         c.correlativo?.toLowerCase().includes(search.toLowerCase()) ||
                         c.id.toString().includes(search)
    const matchesEstado = estadoFilter === 'all' || c.estado === estadoFilter
    return matchesSearch && matchesEstado
  })

  const updateStatus = async (id, newStatus) => {
    // Optimistic UI Update
    setCotizaciones(prev => prev.map(cot => 
      cot.id === id ? { ...cot, estado: newStatus } : cot
    ))

    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: newStatus })
        .eq('id', id)
        
      if (error) throw error
      toast.success('Estado de cotización actualizado')
    } catch (err) {
      toast.error('Error al actualizar: ' + err.message)
      fetchCotizaciones() // Rollback
    }
  }

  const getStatusBadge = (cotizacion) => {
    const estado = cotizacion.estado || 'borrador'
    const isBlink = cotizacion.id === blinkId
    const styles = {
      borrador:  'bg-slate-500/15 text-slate-400 border-slate-500/30',
      enviada:   'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      aceptada:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      rechazada: 'bg-red-500/15 text-red-400 border-red-500/30'
    }
    // Efecto High-Impact de aprobación recibida en tiempo real
    const blinkClass = isBlink
      ? 'animate-pulse !border-2 !border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.7)] !bg-emerald-500/30 scale-105'
      : ''
    return (
      <select
        value={estado}
        onChange={(e) => updateStatus(cotizacion.id, e.target.value)}
        className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border cursor-pointer outline-none transition-all appearance-none text-center ${styles[estado] || styles.borrador} ${blinkClass}`}
        style={{ textAlignLast: 'center' }}
      >
        <option value="borrador" className="bg-slate-900 text-slate-300">Borrador</option>
        <option value="enviada" className="bg-slate-900 text-indigo-300">Enviada</option>
        <option value="aceptada" className="bg-slate-900 text-emerald-300">Aceptada</option>
        <option value="rechazada" className="bg-slate-900 text-red-300">Rechazada</option>
      </select>
    )
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <FileText size={26} className="text-indigo-400" />
            Cotizaciones
          </h1>
          <p className="text-slate-400 mt-1">Gestiona tus propuestas comerciales y presupuestos.</p>
        </div>
        <button
          onClick={() => navigate('/cotizaciones/nueva')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus size={18} />
          Nueva Cotización
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:grid sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente o ID..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={estadoFilter}
            onChange={e => setEstadoFilter(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none"
          >
            <option value="all" className="bg-slate-900">Todos los estados</option>
            <option value="borrador" className="bg-slate-900">Borrador</option>
            <option value="enviada" className="bg-slate-900">Enviada</option>
            <option value="aceptada" className="bg-slate-900">Aceptada</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Correlativo</th>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-center">Estado</th>
              <th className="px-6 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center text-slate-500">
                  <Loader2 size={24} className="animate-spin mx-auto mb-3 text-indigo-500" />
                  Cargando cotizaciones...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center text-slate-500 italic">
                  No se encontraron cotizaciones.
                </td>
              </tr>
            ) : filtered.map(q => (
              <tr key={q.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-bold">
                  #{q.correlativo || q.id.toString().slice(0,6)}
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-200 font-medium">{q.clientes?.nombre_razon_social}</p>
                  <p className="text-[10px] text-slate-500">{q.clientes?.numero_documento}</p>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {new Date(q.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-slate-100 font-bold">
                  {q.moneda === 'USD' ? '$' : 'S/'} {formatNumber(q.total)}
                </td>
                <td className="px-6 py-4 text-center">
                  {getStatusBadge(q)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 1. Ver Portal */}
                    <button 
                      title="Ver Portal Público" 
                      onClick={() => window.open('/c/' + q.id, '_blank')}
                      className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all"
                    >
                      <Eye size={18} />
                    </button>
                    
                    {/* 2. WhatsApp */}
                    <button 
                      title="Enviar por WhatsApp"
                      onClick={() => handleWhatsApp(q)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
                    >
                      <MessageCircle size={18} />
                    </button>

                    {/* 3. Chat Interno */}
                    <button 
                      title="Chat de Seguimiento"
                      onClick={() => setChatQuote(q)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all"
                    >
                      <Send size={16} />
                    </button>

                    {/* 4. PDF */}
                    <PDFAction cotizacionId={q.id} tenant={tenant} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modals */}
      {chatQuote && (
        <ChatModal 
          quote={chatQuote} 
          onClose={() => setChatQuote(null)} 
        />
      )}
    </div>
  )
}

function ChatModal({ quote, onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMsg, setNewMsg] = useState('')

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('cotizacion_comentarios')
      .select('*')
      .eq('cotizacion_id', quote.id)
      .order('fecha_creacion', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }, [quote.id])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleSend(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    const { error } = await supabase
      .from('cotizacion_comentarios')
      .insert([{
        cotizacion_id: quote.id,
        autor: 'Agente Comercial',
        mensaje: newMsg
      }])
    if (!error) {
      setNewMsg('')
      fetchMessages()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass rounded-3xl border border-white/10 flex flex-col h-[600px] shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div>
            <h3 className="text-sm font-bold text-white">Chat de Cotización</h3>
            <p className="text-[10px] text-indigo-400 font-mono">#{quote.correlativo || quote.id.toString().slice(0,6)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? <div className="text-center py-20 text-slate-500 text-xs animate-pulse">Cargando historial...</div> : 
           messages.length === 0 ? <div className="text-center py-20 text-slate-500 text-xs italic">Sin mensajes todavía.</div> :
           messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.autor === 'Cliente' ? 'items-start' : 'items-end'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                m.autor === 'Cliente' ? 'bg-white/5 text-slate-200 rounded-tl-none border border-white/10' : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                {m.mensaje}
              </div>
              <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 px-1">{m.autor}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
          <input 
            autoFocus
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Responder al cliente..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500/50"
          />
          <button className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

function PDFAction({ cotizacionId, tenant }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handlePrepare() {
    setLoading(true)
    const { data: quote, error } = await supabase
      .from('cotizaciones')
      .select('*, cliente:clientes(nombre_razon_social), detalles:cotizacion_detalles(*, producto:productos(*)), agente:perfiles(nombre_completo), contacto:cliente_contactos(*)')
      .eq('id', cotizacionId)
      .single()

    if (error) {
      console.error(error)
      alert('Error al cargar datos del PDF')
    } else {
      setData(quote)
    }
    setLoading(false)
  }

  if (data) {
    const primerProd = data.detalles?.[0]?.producto?.nombre?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) || 'Varios';
    const fecha = new Date(data.fecha_creacion).toLocaleDateString('es-PE').replace(/\//g, '-');
    const nombreArchivo = `${data.correlativo}_${fecha}_${primerProd}.pdf`;

    return (
      <PDFDownloadLink 
        document={<CotizacionPDF cotizacion={data} tenant={tenant} />} 
        fileName={nombreArchivo}
        className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center justify-center"
      >
        {({ loading: pdfLoading }) => (
          pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />
        )}
      </PDFDownloadLink>
    )
  }

  return (
    <button 
      onClick={handlePrepare}
      disabled={loading}
      title="Preparar PDF"
      className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all disabled:opacity-50"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
    </button>
  )
}
