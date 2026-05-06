import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useTenant } from '../../context/TenantContext'

export default function SentimentChart() {
  const { tenant } = useTenant()
  const [data, setData] = useState({ positivo: 0, neutral: 0, negativo: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSentiment() {
      if (!tenant?.id) return
      
      try {
        // Obtenemos interacciones del último mes
        const unMesAtras = new Date()
        unMesAtras.setMonth(unMesAtras.getMonth() - 1)

        const { data: interacciones, error } = await supabase
          .from('cliente_interacciones')
          .select('metadata')
          .eq('negocio_id', tenant.id)
          .gte('created_at', unMesAtras.toISOString())

        if (error) throw error

        let pos = 0, neu = 0, neg = 0
        interacciones.forEach(item => {
          if (item.metadata && item.metadata.sentimiento) {
            const s = item.metadata.sentimiento.toLowerCase()
            if (s === 'positivo') pos++
            else if (s === 'negativo') neg++
            else neu++ // neutral u otros
          }
        })

        const total = pos + neu + neg
        setData({ positivo: pos, neutral: neu, negativo: neg, total })

      } catch (error) {
        console.error("Error al obtener sentimiento:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSentiment()
  }, [tenant?.id])

  if (loading) {
    return (
      <div className="glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 size={24} className="animate-spin text-indigo-500 mb-3" />
        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Analizando IA...</span>
      </div>
    )
  }

  if (data.total === 0) {
    return (
      <div className="group glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/10 uppercase tracking-wider">
              Sentimiento IA
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium text-center py-4">No hay datos de interacciones recientes.</p>
      </div>
    )
  }

  const pPos = Math.round((data.positivo / data.total) * 100)
  const pNeu = Math.round((data.neutral / data.total) * 100)
  const pNeg = Math.round((data.negativo / data.total) * 100)

  // Generar Insight basado en los datos
  let insightText = ""
  let InsightIcon = Sparkles
  let insightColor = "text-indigo-400"

  if (pPos >= 70) {
    insightText = `El ${pPos}% de tus interacciones son positivas. ¡Buen trabajo en la retención!`
    InsightIcon = TrendingUp
    insightColor = "text-emerald-400"
  } else if (pNeg >= 30) {
    insightText = `Atención: Tienes un ${pNeg}% de interacciones negativas. Sugerimos revisión de casos.`
    InsightIcon = TrendingDown
    insightColor = "text-rose-400"
  } else {
    insightText = `Tus interacciones están balanceadas. El ${pNeu}% tiene sentimiento neutral.`
    InsightIcon = Minus
    insightColor = "text-slate-400"
  }

  return (
    <div className="group glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:scale-[1.02] hover:bg-slate-900/80 transition-all duration-300 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 group-hover:scale-110 transition-transform">
          <Sparkles size={24} />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-full border border-white/10 uppercase tracking-wider">
            Sentimiento IA
          </span>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-emerald-400">{pPos}% Pos</span>
          <span className="text-slate-400">{pNeu}% Neu</span>
          <span className="text-rose-400">{pNeg}% Neg</span>
        </div>
        {/* Segmented Progress Bar */}
        <div className="w-full h-3 bg-white/5 rounded-full flex overflow-hidden">
          <div style={{ width: `${pPos}%` }} className="bg-emerald-500 transition-all duration-1000"></div>
          <div style={{ width: `${pNeu}%` }} className="bg-slate-500 transition-all duration-1000"></div>
          <div style={{ width: `${pNeg}%` }} className="bg-rose-500 transition-all duration-1000"></div>
        </div>
      </div>

      <div className="mt-2 bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-start gap-2">
        <InsightIcon size={14} className={`mt-0.5 shrink-0 ${insightColor}`} />
        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
          {insightText}
        </p>
      </div>
    </div>
  )
}
