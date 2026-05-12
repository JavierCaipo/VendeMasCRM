import { useState, useEffect } from 'react'
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, MessageSquare, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function SentimentChart() {
  const { tenant } = useTenant()
  const [sentData, setSentData] = useState({ positivo: 0, neutral: 0, negativo: 0, total: 0 })
  const [notas, setNotas] = useState([])          // últimas notas con resumen_ia
  const [notaActiva, setNotaActiva] = useState(0) // índice del feed rotativo
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSentiment() {
      if (!tenant?.id) return
      try {
        const unMesAtras = new Date()
        unMesAtras.setMonth(unMesAtras.getMonth() - 1)

        const { data: items, error } = await supabase
          .from('cliente_interacciones')
          .select('sentimiento, resumen_ia, descripcion, cliente:clientes(nombre_razon_social), created_at')
          .eq('negocio_id', tenant.id)
          .gte('created_at', unMesAtras.toISOString())
          .order('created_at', { ascending: false })
          .limit(15)

        if (error) {
          console.error('[SentimentChart] Error:', error)
          return
        }

        // Cálculo de distribución
        let pos = 0, neu = 0, neg = 0
        items?.forEach(item => {
          const s = (item.sentimiento || 'neutral').toLowerCase()
          if (s === 'positivo')      pos++
          else if (s === 'negativo') neg++
          else                       neu++
        })
        setSentData({ positivo: pos, neutral: neu, negativo: neg, total: pos + neu + neg })

        // Feed: usa resumen_ia si existe; si no, descripcion truncada como fallback
        const conTexto = (items || [])
          .filter(i => (i.resumen_ia?.trim() || i.descripcion?.trim()))
          .slice(0, 5)
          .map(i => {
            const texto = i.resumen_ia?.trim() ||
              (i.descripcion?.trim()?.slice(0, 120) + (i.descripcion?.length > 120 ? '...' : '') || '')
            return {
              cliente: i.cliente?.nombre_razon_social || 'Cliente',
              resumen: texto,
              sent: (i.sentimiento || 'neutral').toLowerCase(),
              esIA: !!i.resumen_ia
            }
          })
        setNotas(conTexto)
      } catch (err) {
        console.error('[SentimentChart]', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSentiment()
  }, [tenant?.id])

  // Rotación automática del feed cada 5 segundos
  useEffect(() => {
    if (notas.length < 2) return
    const timer = setInterval(() => {
      setNotaActiva(prev => (prev + 1) % notas.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [notas.length])

  if (loading) return (
    <div className="glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={22} className="animate-spin text-indigo-400" />
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Analizando IA...</span>
      </div>
    </div>
  )

  // ── ESTADO VACÍO ──────────────────────────────────────────────────────────
  if (sentData.total === 0) return (
    <div className="glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between min-h-[200px]">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
          <Sparkles size={22} />
        </div>
        <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/10 uppercase tracking-wider">
          Sentimiento IA
        </span>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 gap-2 py-4">
        <MessageSquare size={28} className="text-slate-600" />
        <p className="text-xs text-slate-500 font-medium text-center leading-relaxed">
          Sin interacciones este mes.<br />
          <span className="text-indigo-400">Registra notas</span> en la Timeline de clientes.
        </p>
      </div>
    </div>
  )

  // ── CÁLCULO DE PORCENTAJES ────────────────────────────────────────────────
  const total = sentData.total
  const pPos = Math.round((sentData.positivo / total) * 100)
  const pNeu = Math.round((sentData.neutral   / total) * 100)
  const pNeg = 100 - pPos - pNeu   // evita errores de redondeo

  // Indicador general
  let emoji = '🟡', sentLabel = 'Neutral', insightColor = 'text-slate-300'
  let InsightIcon = Minus, insightClass = 'text-slate-400'
  if (pPos > 50) {
    emoji = '🟢'; sentLabel = 'Positivo'; insightColor = 'text-emerald-300'
    InsightIcon = TrendingUp; insightClass = 'text-emerald-400'
  } else if (pNeg >= 30) {
    emoji = '🔴'; sentLabel = 'Alerta'; insightColor = 'text-rose-300'
    InsightIcon = TrendingDown; insightClass = 'text-rose-400'
  }

  const notaViva = notas[notaActiva]
  const notaColor = notaViva?.sent === 'positivo'
    ? 'text-emerald-400' : notaViva?.sent === 'negativo'
    ? 'text-rose-400' : 'text-slate-400'

  return (
    <div className="group glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:scale-[1.01] hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 group-hover:scale-110 transition-transform">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sentimiento IA</p>
            <p className={`text-lg font-black ${insightColor} leading-none mt-0.5`}>
              {emoji} {sentLabel}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-1 rounded-full border border-white/10">
          {total} interacc.
        </span>
      </div>

      {/* Barra segmentada */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-black mb-1.5">
          <span className="text-emerald-400">{pPos}% Positivo</span>
          <span className="text-slate-500">{pNeu}% Neutral</span>
          <span className="text-rose-400">{pNeg}% Negativo</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full flex overflow-hidden gap-px">
          <div style={{ width: `${pPos}%` }} className="bg-emerald-500 transition-all duration-1000 rounded-l-full" />
          <div style={{ width: `${pNeu}%` }} className="bg-slate-600 transition-all duration-1000" />
          <div style={{ width: `${pNeg}%` }} className="bg-rose-500 transition-all duration-1000 rounded-r-full" />
        </div>
      </div>

      {/* Feed rotativo de últimas notas IA */}
      {notaViva ? (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3 flex flex-col gap-1.5 min-h-[72px] transition-all duration-500">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider ${notaColor}`}>
                  {notaViva.cliente}
                </span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                  notaViva.esIA
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                    : 'bg-white/5 text-slate-500 border-white/10'
                }`}>
                  {notaViva.esIA ? '✦ IA' : 'Nota'}
                </span>
              </div>
            {notas.length > 1 && (
              <div className="flex gap-1">
                {notas.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setNotaActiva(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === notaActiva ? 'bg-indigo-400' : 'bg-white/20'}`}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-300 font-medium leading-relaxed line-clamp-3">
            {notaViva.resumen}
          </p>
        </div>
      ) : (
        /* Si hay sentimiento pero sin resúmenes IA todavía */
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center gap-2">
          <InsightIcon size={13} className={`shrink-0 ${insightClass}`} />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            {pPos > 50
              ? `${pPos}% de interacciones positivas este mes. ¡Buen trabajo!`
              : pNeg >= 30
              ? `Atención: ${pNeg}% de interacciones negativas. Revisar casos.`
              : `Balance estable — ${pNeu}% neutral este mes.`}
          </p>
        </div>
      )}
    </div>
  )
}
