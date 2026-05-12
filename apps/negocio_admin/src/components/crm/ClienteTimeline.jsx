import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, PhoneCall, Video, Mail, 
  Sparkles, Send, Loader2, Mic, Bot
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'
import { toast } from 'sonner'

const TIPOS_INTERACCION = [
  { id: 'nota', label: 'Nota', icon: MessageSquare, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'llamada', label: 'Llamada', icon: PhoneCall, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  { id: 'reunion', label: 'Reunión', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'ia_insight', label: 'IA Insight', icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
]

export default function ClienteTimeline({ cliente_id }) {
  const { tenant, agentes } = useTenant()
  const [user, setUser] = useState(null)
  const [interacciones, setInteracciones] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [contenido, setContenido] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('nota')
  const [submitting, setSubmitting] = useState(false)

  // AI & Voice to Text state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [metadataIA, setMetadataIA] = useState({})
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const baseContenidoRef = useRef('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    // Inicializar Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-PE'; // O 'es-ES'

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        // Unir el contenido original con lo nuevo dictado
        const separator = baseContenidoRef.current && !baseContenidoRef.current.endsWith(' ') ? ' ' : '';
        setContenido(baseContenidoRef.current + separator + transcript);
      };

      recognition.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [])

  useEffect(() => {
    if (!cliente_id || !tenant?.id) return
    
    async function fetchInteracciones() {
      setLoading(true)
      const { data, error } = await supabase
        .from('cliente_interacciones')
        .select('*')
        .eq('cliente_id', cliente_id)
        .order('created_at', { ascending: false })
        
      if (error) {
        toast.error(`Error al cargar el historial: ${error.message}`)
      } else {
        setInteracciones(data || [])
      }
      setLoading(false)
    }
    
    fetchInteracciones()
  }, [cliente_id, tenant?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!contenido.trim() || !user || !tenant?.id) return
    
    setSubmitting(true)

    // Conexión del "Cerebro IA"
    let sentimiento = 'NEUTRAL'
    let resumen_ia = ''
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (apiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Analiza esta nota comercial. Devuelve ÚNICAMENTE un JSON válido con dos propiedades: 'sentimiento' (que debe ser estrictamente la cadena POSITIVO, NEUTRAL o NEGATIVO) y 'resumen_ia' (un string de máximo 12 palabras que sintetice la interacción).\n\nNota:\n${contenido.trim()}` }]
            }]
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Limpieza estricta de JSON por si Gemini devuelve bloques markdown
          const jsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(jsonText);
          if (parsed.sentimiento) sentimiento = parsed.sentimiento.toUpperCase();
          if (parsed.resumen_ia) resumen_ia = parsed.resumen_ia;
        }
      }
    } catch (err) {
      console.warn("Error al llamar a Gemini:", err)
    }

    // Aseguramos estrictamente que negocio_id esté presente.
    const currentTenantId = tenant?.id || user?.user_metadata?.negocio_id;
    if (!currentTenantId) {
      toast.error('Error crítico: Falta el ID del negocio (tenant) para registrar la nota.');
      setSubmitting(false);
      return;
    }

    const payload = {
      negocio_id: currentTenantId,
      cliente_id: cliente_id,
      agente_id: user.id,
      tipo: tipoSeleccionado,
      contenido: contenido.trim(),
      metadata: metadataIA,
      sentimiento,
      resumen_ia
    }
    
    const { data, error } = await supabase
      .from('cliente_interacciones')
      .insert([payload])
      .select()
      .single()
      
    if (error) {
      toast.error(`Error guardando interacción: ${error.message}`)
    } else {
      setInteracciones([data, ...interacciones])
      setContenido('')
      setMetadataIA(null)
      toast.success('Interacción registrada exitosamente')
    }
    setSubmitting(false)
  }

  const handleEstructurarIA = async () => {
    if (!contenido.trim()) return;
    setIsAnalyzing(true);
    const loadingToastId = toast.loading('Estructurando notas con IA...');

    try {
      const { data, error } = await supabase.functions.invoke('process-dictation', {
        body: { texto_crudo: contenido }
      });

      if (error) throw error;
      
      if (data && data.resumen) {
        setMetadataIA({
          sentimiento: data.sentimiento,
          next_steps: data.next_steps,
          original: contenido
        });

        // Formatear texto en el textarea
        let nuevoContenido = data.resumen + '\n\n';
        if (data.next_steps && data.next_steps.length > 0) {
          nuevoContenido += 'Próximos pasos:\n' + data.next_steps.map(step => `• ${step}`).join('\n');
        }
        
        setContenido(nuevoContenido);
        baseContenidoRef.current = nuevoContenido;
        toast.success('Nota estructurada correctamente', { id: loadingToastId });
      }
    } catch (err) {
      console.error("Error al estructurar:", err);
      toast.error('Ocurrió un error al procesar el dictado con IA.', { id: loadingToastId });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleDictadoIA = () => {
    if (!recognitionRef.current) {
      toast.error('Tu navegador no soporta el dictado por voz. Intenta usar Google Chrome.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      baseContenidoRef.current = contenido
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast('Micrófono activado', {
          description: 'Empieza a hablar para dictar tu nota...',
          icon: <Mic className="text-amber-400" size={16} />
        })
      } catch (e) {
        console.error("Error al iniciar el micrófono:", e)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* ── HEADER ── */}
      <div className="p-5 border-b border-white/5 bg-white/[0.02]">
        <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-400" />
          Timeline del Cliente
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-1">Historial cronológico de interacciones</p>
      </div>

      {/* ── FEED DE INTERACCIONES ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
        {/* Línea vertical de conexión */}
        <div className="absolute left-[39px] top-6 bottom-6 w-px bg-white/10 pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <span className="text-xs font-medium uppercase tracking-widest">Sincronizando timeline...</span>
          </div>
        ) : interacciones.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <Bot size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-400 font-medium text-sm">El timeline está vacío.</p>
            <p className="text-slate-500 text-xs mt-1">Sé el primero en registrar una interacción.</p>
          </div>
        ) : (
          interacciones.map((item, index) => {
            const config = TIPOS_INTERACCION.find(t => t.id === item.tipo) || TIPOS_INTERACCION[0]
            const Icon = config.icon
            const agente = agentes?.find(a => a.id === item.agente_id)
            const nombreAgente = agente ? agente.nombre_completo : 'Usuario'

            return (
              <div key={item.id} className="relative flex gap-4 fade-up" style={{ animationDelay: `${index * 50}ms` }}>
                {/* Icono del Timeline */}
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-slate-700/50 ${config.bg} ${config.border}`}>
                  <Icon size={16} className={config.color} />
                </div>
                
                {/* Contenido de la Tarjeta */}
                <div className="flex-1 glass p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-slate-300">{nombreAgente}</span>
                      <span className="text-[11px] text-slate-500 mx-1.5">•</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 uppercase">
                      {new Date(item.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {item.contenido}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── SMART INPUT ── */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-white/10 overflow-hidden focus-within:border-indigo-500/50 transition-colors">
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            placeholder="Registra una nueva interacción..."
            className="w-full bg-transparent border-none text-sm text-slate-200 placeholder-slate-500 p-4 min-h-[80px] focus:outline-none resize-none"
          />
          
          <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {TIPOS_INTERACCION.filter(t => t.id !== 'ia_insight').map((t) => {
                const isSelected = tipoSeleccionado === t.id
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTipoSeleccionado(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? `${t.bg} ${t.color} ${t.border}` 
                        : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                )
              })}
            </div>
            
            <div className="flex items-center gap-2 pl-2 border-l border-white/10 shrink-0">
              {contenido.trim() && !isListening && (
                <button
                  type="button"
                  onClick={handleEstructurarIA}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 disabled:opacity-50"
                  title="Estructurar con IA"
                >
                  {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span className="hidden sm:inline">Estructurar</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDictadoIA}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors tooltip-trigger relative group ${
                  isListening 
                    ? 'text-white bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                }`}
                title={isListening ? "Detener dictado" : "Dictar a IA"}
              >
                <Mic size={14} />
                {!isListening && <Sparkles size={10} className="absolute top-1.5 right-1.5 opacity-70" />}
              </button>
              
              {contenido.trim() ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Guardar
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={true}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-600 text-white opacity-50 cursor-not-allowed transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

    </div>
  )
}
