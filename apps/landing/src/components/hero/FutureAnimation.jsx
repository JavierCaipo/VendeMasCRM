import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, TrendingUp, Shield, CheckCircle2, User, Zap } from 'lucide-react'

export default function FutureAnimation() {
  // Configuración de animaciones para efecto flotante en perspectiva
  const floatingAnimation = (delay) => ({
    y: [0, -10, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay
    }
  })

  return (
    <div className="relative w-full aspect-[16/10] md:aspect-[16/9] rounded-[2.5rem] bg-slate-950/20 border border-white/5 overflow-hidden flex items-center justify-center p-6 md:p-12">
      {/* Fondo Radial de Brillo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,rgba(16,185,129,0.03)_50%,transparent_100%)] pointer-events-none" />
      
      {/* Rejilla Cyberpunk sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* COMPOSICIÓN BENTO BOX SUPERPUESTA EN PERSPECTIVA */}
      <div className="relative w-full h-full max-w-4xl flex items-center justify-center">
        
        {/* TARJETA 1: CENTRO (Mini-Dashboard de IA) */}
        <motion.div
          animate={floatingAnimation(0)}
          className="absolute z-20 w-[90%] md:w-[60%] glass border border-white/10 rounded-3xl p-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
        >
          {/* Header del Dashboard */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sentiment AI Engine</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/10" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
              <div className="w-2 h-2 rounded-full bg-white/10" />
            </div>
          </div>

          {/* Métricas Principales */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Indicador de Cierre</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  95%
                </span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  Caliente
                </span>
              </div>
            </div>

            {/* Barra de progreso animada */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Análisis de Interacción</span>
                <span>Alta Probabilidad</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "95%" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>

            {/* Lista de Actividad Reciente */}
            <div className="rounded-2xl bg-white/3 border border-white/5 p-3 space-y-2 text-left">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Último Evento</span>
                <span>Hace 2 min</span>
              </div>
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Zap size={12} className="text-indigo-400" />
                Prospecto <span className="text-white font-bold">Aceros del Pacífico</span> descargó Ficha Técnica PRO.
              </p>
            </div>
          </div>
        </motion.div>

        {/* TARJETA 2: FLOTANDO IZQUIERDA (WhatsApp Anti-Spam Widget) */}
        <motion.div
          animate={floatingAnimation(1.5)}
          className="absolute z-30 left-[-5%] md:left-[2%] top-[10%] md:top-[15%] w-[48%] md:w-[32%] glass border border-emerald-500/25 bg-slate-950/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col gap-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <MessageSquare size={12} className="text-emerald-400" />
              </div>
              <span className="text-[9px] font-black text-white uppercase tracking-wider">WhatsApp Rotator</span>
            </div>
            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
              Activo
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              <CheckCircle2 size={10} className="text-emerald-400" /> Variante C Enviada
            </div>
            <p className="text-[10px] text-slate-300 bg-white/3 border border-white/5 rounded-xl p-2 font-medium leading-relaxed">
              "Hola Carlos, queríamos confirmar si pudieron revisar el catálogo..."
            </p>
          </div>

          <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 uppercase tracking-wider pt-1 border-t border-white/5">
            <span>Rotación inteligente</span>
            <span className="text-indigo-400">3 Variantes</span>
          </div>
        </motion.div>

        {/* TARJETA 3: FLOTANDO DERECHA (Gráfico de Ingresos) */}
        <motion.div
          animate={floatingAnimation(0.8)}
          className="absolute z-10 right-[-5%] md:right-[2%] bottom-[8%] md:bottom-[12%] w-[50%] md:w-[34%] glass border border-indigo-500/25 bg-slate-950/80 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col gap-2.5 text-left"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <TrendingUp size={12} className="text-indigo-400" />
              </div>
              <span className="text-[9px] font-black text-white uppercase tracking-wider">Proyecciones</span>
            </div>
            <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
              +24.8%
            </span>
          </div>

          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ingreso Estimado</span>
            <span className="text-xl font-black text-white tracking-tight">US$ 14,820</span>
          </div>

          {/* Gráfico SVG Curva Suave */}
          <div className="h-16 w-full relative overflow-visible mt-1">
            <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Línea de fondo del gráfico */}
              <path
                d="M0,35 Q20,28 40,30 T80,10 T100,5"
                fill="none"
                stroke="url(#chart-line-grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Área del gradiente */}
              <path
                d="M0,35 Q20,28 40,30 T80,10 T100,5 L100,40 L0,40 Z"
                fill="url(#chart-grad)"
              />
              {/* Línea del gráfico */}
              <path
                d="M0,35 Q20,28 40,30 T80,10 T100,5"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
              />
              {/* Punto brillante al final */}
              <motion.circle
                cx="100"
                cy="5"
                r="3"
                fill="#10b981"
                filter="drop-shadow(0 0 4px #10b981)"
                animate={{ r: [3, 5, 3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </svg>
          </div>
        </motion.div>

        {/* TARJETA 4: FLOTANDO SUPERIOR CENTRO-DERECHA (Seguridad / SLA) */}
        <motion.div
          animate={floatingAnimation(2.3)}
          className="absolute z-0 right-[15%] top-[-8%] hidden md:flex items-center gap-2.5 glass border border-white/5 bg-slate-950/60 rounded-full px-4 py-2 shadow-lg backdrop-blur-md"
        >
          <Shield size={12} className="text-emerald-400 animate-pulse" />
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
            SLA Garantizado 99.9%
          </span>
        </motion.div>
      </div>
    </div>
  )
}
