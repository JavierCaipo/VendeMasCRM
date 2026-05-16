import { motion } from 'framer-motion'
import { Sparkles, Brain, Cpu, MessageSquare, TrendingUp, Users, ArrowUpRight } from 'lucide-react'

export default function FutureAnimation() {
  // Configuración de nodos que orbitan la IA central
  const orbitNodes = [
    { icon: Users, label: 'Clientes B2B', color: 'from-emerald-400 to-teal-500', delay: 0, x: -160, y: -100 },
    { icon: MessageSquare, label: 'Anti-Spam WhatsApp', color: 'from-green-400 to-emerald-500', delay: 0.5, x: 160, y: -90 },
    { icon: TrendingUp, label: 'Predicciones IA', color: 'from-indigo-400 to-purple-500', delay: 1, x: -150, y: 110 },
    { icon: Brain, label: 'Sentiment Engine', color: 'from-pink-400 to-rose-500', delay: 1.5, x: 150, y: 100 },
  ]

  return (
    <div className="relative w-full aspect-[4/3] rounded-[2.5rem] bg-slate-950/40 border border-white/5 overflow-hidden flex items-center justify-center p-6 glass">
      {/* Rejilla de Fondo Futurista */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Círculos concéntricos de órbita */}
      <div className="absolute w-[280px] h-[280px] rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
      <div className="absolute w-[420px] h-[420px] rounded-full border border-dashed border-indigo-500/10 animate-[spin_60s_linear_infinite]" />

      {/* SVG para Líneas de Flujo de Datos */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="-250 -200 500 400">
        <defs>
          <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Dibujar líneas dinámicas a los nodos */}
        {orbitNodes.map((node, i) => {
          const isEven = i % 2 === 0
          return (
            <g key={i}>
              {/* Línea base estática */}
              <line
                x1="0"
                y1="0"
                x2={node.x}
                y2={node.y}
                stroke="url(#line-grad-1)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                className="opacity-40"
              />
              
              {/* Pulso de datos animado recorriendo la línea */}
              <motion.circle
                r="3.5"
                fill={isEven ? '#34d399' : '#818cf8'}
                filter="drop-shadow(0 0 6px currentColor)"
                initial={{ offsetDistance: "0%" }}
                animate={{
                  cx: [0, node.x],
                  cy: [0, node.y],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: node.delay,
                  ease: "easeInOut"
                }}
              />
            </g>
          )
        })}
      </svg>

      {/* Núcleo IA Central */}
      <motion.div
        className="relative z-10 w-28 h-28 rounded-[2rem] bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 p-[1.5px] shadow-[0_0_50px_rgba(99,102,241,0.3)]"
        animate={{
          scale: [1, 1.03, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-full h-full rounded-[2rem] bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden group">
          {/* Brillo interno */}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-emerald-500/10 opacity-50" />
          <Cpu className="w-10 h-10 text-white animate-pulse" />
          <span className="text-[9px] font-black text-emerald-400 tracking-[0.25em] uppercase mt-2">VendeMas AI</span>
        </div>
      </motion.div>

      {/* Nodos Periféricos Orbitando */}
      {orbitNodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute z-20"
          style={{ x: node.x, y: node.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: node.delay * 0.5 }}
          whileHover={{ scale: 1.1 }}
        >
          <div className="relative flex flex-col items-center gap-2 group cursor-pointer">
            {/* Contenedor del ícono */}
            <div className={`w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:border-indigo-500/40 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all`}>
              <node.icon className={`w-5 h-5 bg-gradient-to-r ${node.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform`} />
            </div>

            {/* Etiqueta del nodo */}
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/5 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <span className="text-[10px] font-bold text-slate-300 whitespace-nowrap uppercase tracking-wider">{node.label}</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Tarjeta de Estadísticas flotantes - Estilo Cyberpunk */}
      <motion.div
        className="absolute bottom-6 left-6 z-30 glass border border-emerald-500/20 bg-slate-950/80 p-4 rounded-2xl max-w-[200px]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sentiment Score</span>
          <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5">
            +18.4% <ArrowUpRight size={10} />
          </span>
        </div>
        <p className="text-sm font-black text-white tracking-tight uppercase">Caliente · 92/100</p>
        <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: "92%" }}
            transition={{ duration: 1.5, delay: 1.5 }}
          />
        </div>
      </motion.div>

      {/* Tarjeta Flotante Inteligente Superior Derecha */}
      <motion.div
        className="absolute top-6 right-6 z-30 glass border border-indigo-500/20 bg-slate-950/80 p-4 rounded-2xl max-w-[220px]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Flujo WhatsApp</span>
        </div>
        <p className="text-xs font-semibold text-slate-300">Variante anti-spam autogenerada y rotada con éxito.</p>
      </motion.div>
    </div>
  )
}
