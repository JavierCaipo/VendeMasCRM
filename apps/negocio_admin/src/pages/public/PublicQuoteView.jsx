// ============================================
// Client Portal — Luxury White-Label Experience
// src/pages/public/PublicQuoteView.jsx
// ============================================
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  CheckCircle2, XCircle, MessageSquare, Send, 
  Package, Loader2, Building2, Phone, Mail, MapPin,
  Calendar, CreditCard, Sparkles, Share2, Printer, Check
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import confetti from 'canvas-confetti'

export default function PublicQuoteView() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        negocio:negocios(*),
        cliente:clientes(*),
        contacto:cliente_contactos(*),
        detalles:cotizacion_detalles(*, producto:productos(*)),
        comentarios:cotizacion_comentarios(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching quote:', error)
    } else {
      setQuote(data)
      setComments(data.comentarios || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    if (quote) {
      const originalTitle = document.title;
      const clientName = quote.oportunidad?.titulo || quote.cliente?.nombre_razon_social || 'Cliente';
      const correlativo = quote.correlativo || quote.id.toString().slice(0, 8).toUpperCase();
      document.title = `Cotización ${correlativo} - ${clientName}`;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [quote])

  const handleAprobar = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: 'aceptada' })
        .eq('id', id)

      if (error) throw error

      setQuote(prev => ({ ...prev, estado: 'aceptada' }))
      setShowSuccessOverlay(true)
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#f59e0b']
      })
    } catch (error) {
      console.error(error)
      alert('Error al aprobar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSendComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSendingComment(true)
    const { data, error } = await supabase
      .from('cotizacion_comentarios')
      .insert([{
        cotizacion_id: id,
        autor: 'Cliente',
        mensaje: newComment
      }])
      .select()

    if (!error) {
      setComments([...comments, data[0]])
      setNewComment('')
    }
    setSendingComment(false)
  }

  if (loading && !quote) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="animate-spin text-indigo-600" />
        <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-[10px]">Cargando propuesta comercial...</p>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <XCircle size={48} className="text-slate-300 mb-6" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">Propuesta no encontrada</h1>
        <p className="text-slate-500 max-w-xs text-sm">El enlace es inválido o la cotización ha sido eliminada.</p>
      </div>
    )
  }

  const isAccepted = quote.estado === 'aceptada'
  const currency = quote.moneda === 'USD' ? '$' : 'S/'

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 selection:bg-indigo-100 pb-32">
      <style>
        {`
          @media print {
            @page {
              margin: 0;
            }
            body {
              margin: 1.5cm;
            }
          }
        `}
      </style>
      {/* ── CUSTOM HEADER (WHITE LABEL) ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {quote.negocio?.logo_url ? (
              <img src={quote.negocio.logo_url} className="h-8 w-auto object-contain" alt={quote.negocio.nombre} />
            ) : (
              <span className="font-bold text-lg tracking-tight text-slate-900">{quote.negocio?.nombre}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
               <Printer size={18} />
             </button>
             <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
               isAccepted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
             }`}>
               {quote.estado}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-8">
        
        {/* ── QUOTE PAPER ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05),0_20px_25px_-5px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden">
          
          {/* Paper Header */}
          <div className="p-10 md:p-16">
            <div className="flex flex-col md:flex-row justify-between gap-10 mb-16">
              <div className="space-y-4">
                <TextLabel label="Propuesta Preparada Para" />
                <h1 className="text-2xl font-bold text-slate-900">{quote.cliente?.nombre_razon_social}</h1>
                <div className="space-y-1 text-slate-500 text-sm">
                  <p>{quote.cliente?.direccion}</p>
                  <p>{quote.cliente?.tipo_documento}: {quote.cliente?.numero_documento}</p>
                  {quote.contacto && (
                    <p className="pt-2 text-slate-900 font-medium italic">Atn: {quote.contacto.nombre_completo}</p>
                  )}
                </div>
              </div>
              <div className="md:text-right space-y-4">
                <TextLabel label="Cotización" />
                <p className="text-xl font-bold text-slate-900">#{quote.correlativo || quote.id.toString().slice(0, 8).toUpperCase()}</p>
                <div className="text-slate-500 text-sm">
                  <p>{new Date(quote.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p>Validez: 15 días</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <TextLabel label="Detalle de la Propuesta" />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-4 py-3 first:rounded-l-lg">Descripción</th>
                      <th className="px-4 py-3 text-center">Cant</th>
                      <th className="px-4 py-3 text-right">Unitario</th>
                      <th className="px-4 py-3 text-right last:rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {quote.detalles?.map((item, idx) => (
                      <tr key={idx} className="group">
                        <td className="px-4 py-6">
                          <div className="flex items-center gap-4">
                            {item.producto?.fotos?.[0] && (
                              <img src={item.producto.fotos[0]} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{item.producto?.nombre}</p>
                              <p className="text-[10px] text-slate-400">SKU: {item.producto?.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-6 text-center text-slate-600 font-medium">{item.cantidad}</td>
                        <td className="px-4 py-6 text-right text-slate-600 font-medium">
                          {currency}{parseFloat(item.precio_unitario).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-6 text-right font-bold text-slate-900">
                          {currency}{parseFloat(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-10 border-t border-slate-100">
              <div className="w-full max-w-[280px] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-900 font-medium">{currency}{(parseFloat(quote.total)/1.18).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Impuestos (18%)</span>
                  <span className="text-slate-900 font-medium">{currency}{(parseFloat(quote.total) - (parseFloat(quote.total)/1.18)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t-2 border-slate-900">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Inversión Total</span>
                  <span className="text-3xl font-bold text-slate-900">{currency}{parseFloat(quote.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Business Footer */}
          <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-xs font-bold text-slate-900 mb-1">{quote.negocio?.nombre}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{quote.negocio?.sitio_web}</p>
            </div>
            <div className="flex gap-6">
              <ContactInfo icon={Mail} value={quote.negocio?.correo_ventas} />
              <ContactInfo icon={Phone} value={quote.negocio?.telefono} />
            </div>
          </div>
        </div>

        {/* ── COMMENTS ── */}
        <div className="mt-12 max-w-2xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <MessageSquare size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">¿Tienes alguna duda o ajuste?</h3>
          </div>
          
          <div className="space-y-6">
            {comments.map((c, i) => (
              <div key={i} className={`flex flex-col ${c.autor === 'Cliente' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                  c.autor === 'Cliente' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-900 rounded-tl-none shadow-sm border border-slate-100'
                }`}>
                  {c.mensaje}
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-2 px-1 tracking-tighter">
                  {c.autor} • {new Date(c.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendComment} className="relative">
            <textarea
              rows="3"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Escribe aquí tus comentarios..."
              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-sm"
            />
            <button
              disabled={sendingComment || !newComment.trim()}
              className="absolute bottom-4 right-4 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
            >
              {sendingComment ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>

        {/* Branding */}
        <div className="text-center opacity-40 mt-16 pb-10">
          <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-slate-400">Powered by VendeMas Enterprise</p>
        </div>
      </main>

      {/* ── STICKY ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 z-40">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="hidden md:block">
            <p className="text-xs text-slate-500 font-medium">Inversión Final</p>
            <p className="text-xl font-bold text-slate-900">{currency}{parseFloat(quote.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            {isAccepted ? (
              <div className="flex-1 md:w-64 h-14 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold flex items-center justify-center gap-2">
                <Check size={20} />
                PROPUESTA APROBADA
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleAprobar()}
                  disabled={loading}
                  className="flex-1 md:w-64 h-14 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                  APROBAR PROPUESTA
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/10 animate-bounce">
            <Check size={48} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">¡Excelente decisión!</h2>
          <p className="text-slate-500 max-w-sm mb-12">
            La propuesta ha sido aprobada. El equipo de <span className="text-slate-900 font-bold">{quote.negocio?.nombre}</span> ha sido notificado y comenzará el procesamiento.
          </p>
          <button 
            onClick={() => setShowSuccessOverlay(false)}
            className="px-8 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 font-bold hover:bg-slate-100 transition-all"
          >
            Ver Detalle de Propuesta
          </button>
        </div>
      )}
    </div>
  )
}

function TextLabel({ label }) {
  return <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{label}</span>
}

function ContactInfo({ icon: Icon, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={14} className="text-slate-300" />
      <span className="text-xs font-medium">{value}</span>
    </div>
  )
}

