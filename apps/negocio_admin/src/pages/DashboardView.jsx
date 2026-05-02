// ============================================
// Centro de Mando Premium — VendeMas Business
// src/pages/DashboardView.jsx
// ============================================
import React, { useState, useEffect } from 'react'
import { 
  Wallet, Trophy, Target, TrendingUp, 
  ArrowUpRight, Clock, User, Briefcase,
  LineChart, CheckCircle, Calculator
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'

// Estructura de Datos Simulados (Mock Data)
const MOCK_KPIs = [
  { 
    title: 'Total en Embudo', 
    value: '$128,450.00', 
    icon: Wallet, 
    color: 'text-indigo-400', 
    bgColor: 'bg-indigo-500/15', 
    borderColor: 'border-indigo-500/25',
    trend: '+12.5%' 
  },
  { 
    title: 'Cierres Ganados', 
    value: '$42,300.00', 
    icon: Trophy, 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/15', 
    borderColor: 'border-emerald-500/25',
    trend: '+8.2%' 
  },
  { 
    title: 'Oportunidades Activas', 
    value: '24', 
    icon: Target, 
    color: 'text-sky-400', 
    bgColor: 'bg-sky-500/15', 
    borderColor: 'border-sky-500/25',
    trend: '+3 hoy' 
  },
  { 
    title: 'Ticket Promedio', 
    value: '$5,352.08', 
    icon: TrendingUp, 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/15', 
    borderColor: 'border-amber-500/25',
    trend: '+2.1%' 
  },
]

const MOCK_RECENT = [
  { id: 1, titulo: 'Venta de 50 Cascos MSA', cliente: 'Minería del Norte S.A.', monto: '$12,500.00', fecha: 'hace 2 horas', estado: 'Negociación' },
  { id: 2, titulo: 'Mantenimiento Maquinaria Pesada', cliente: 'Construcciones S.A.', monto: '$8,200.00', fecha: 'hace 5 horas', estado: 'Propuesta' },
  { id: 3, titulo: 'Suministro de Guantes Nitrilo', cliente: 'Hospital Central', monto: '$3,400.00', fecha: 'ayer', estado: 'Cerrado' },
  { id: 4, titulo: 'Instalación de Sistemas de Seguridad', cliente: 'Logística S.A.', monto: '$15,000.00', fecha: 'hace 1 día', estado: 'Evaluación' },
  { id: 5, titulo: 'Consultoría en Higiene Industrial', cliente: 'Textiles del Perú', monto: '$2,100.00', fecha: 'hace 2 días', estado: 'Primer Contacto' },
]

export default function DashboardView() {
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState([])
  const [recent, setRecent] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      if (!tenant?.id) return
      setLoading(true)

      try {
        // Consulta unificada a Oportunidades con JOINS
        const { data: ops, error } = await supabase
          .from('oportunidades')
          .select(`
            *,
            etapa:pipeline_etapas(nombre, orden),
            cliente:clientes(nombre_completo)
          `)
          .eq('negocio_id', tenant.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        // ── MOTOR DE CÁLCULO ──────────────────────────────────────
        
        // Identificar la etapa de cierre (último orden)
        const maxOrden = ops.length > 0 ? Math.max(...ops.map(o => o.etapa?.orden || 0)) : 0

        let totalGanado = 0
        let totalEmbudo = 0
        let activasCount = 0

        ops.forEach(op => {
          const valor = parseFloat(op.valor_estimado) || 0
          const esGanada = op.etapa?.orden === maxOrden
          
          if (esGanada) {
            totalGanado += valor
          } else {
            // Asumimos que si no es la última etapa y no es "Perdida" (opcional), está en el embudo
            // Si tuviéramos un campo 'estado', filtraríamos por 'abierta'
            totalEmbudo += valor
            activasCount++
          }
        })

        const totalProyectado = totalGanado + totalEmbudo
        const ticketPromedio = ops.length > 0 ? totalProyectado / ops.length : 0

        // Formateador de Moneda
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        })

        // Inyectar en estructura de KPIs
        setStats([
          { 
            title: 'Total en Embudo', 
            value: formatter.format(totalEmbudo), 
            icon: Wallet, 
            color: 'text-indigo-400', 
            bgColor: 'bg-indigo-500/15', 
            borderColor: 'border-indigo-500/25',
            trend: 'Live' 
          },
          { 
            title: 'Cierres Ganados', 
            value: formatter.format(totalGanado), 
            icon: Trophy, 
            color: 'text-emerald-400', 
            bgColor: 'bg-emerald-500/15', 
            borderColor: 'border-emerald-500/25',
            trend: 'Sincronizado' 
          },
          { 
            title: 'Oportunidades Activas', 
            value: activasCount.toString(), 
            icon: Target, 
            color: 'text-sky-400', 
            bgColor: 'bg-sky-500/15', 
            borderColor: 'border-sky-500/25',
            trend: `+${ops.filter(o => {
              const d = new Date(o.created_at)
              const hoy = new Date()
              return d.toDateString() === hoy.toDateString()
            }).length} hoy` 
          },
          { 
            title: 'Ticket Promedio', 
            value: formatter.format(ticketPromedio), 
            icon: TrendingUp, 
            color: 'text-amber-400', 
            bgColor: 'bg-amber-500/15', 
            borderColor: 'border-amber-500/25',
            trend: 'Global' 
          },
        ])

        // Negocios Recientes (Top 5)
        setRecent(ops.slice(0, 5).map(op => ({
          id: op.id,
          titulo: op.titulo,
          cliente: op.cliente?.nombre_completo || 'Cliente s/n',
          monto: formatter.format(op.valor_estimado),
          fecha: new Date(op.created_at).toLocaleDateString(),
          estado: op.etapa?.nombre || 'S/E'
        })))

      } catch (err) {
        console.error('Error al cargar Dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [tenant?.id])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Consultando Inteligencia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-10 fade-up overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
      
      {/* ── HEADER DE BIENVENIDA ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Resumen Comercial</h1>
          <p className="text-slate-400 mt-1 font-medium">
            Bienvenido al centro de mando de <span className="text-indigo-400">{tenant?.nombre || 'VendeMas Business'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
          <Clock size={12} className="text-indigo-500" /> Sincronizado: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((kpi, idx) => (
          <div key={idx} className="group glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:scale-[1.02] hover:bg-slate-900/80 transition-all duration-300">
            <div className="flex justify-between items-start mb-5">
              <div className={`p-3.5 rounded-2xl ${kpi.bgColor} ${kpi.color} border ${kpi.borderColor} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={24} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  {kpi.trend}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{kpi.title}</p>
              <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">{kpi.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* ── SECCIÓN CENTRAL: NEGOCIOS RECIENTES ─────────────────── */}
      <div className="glass bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Negocios Recientes</h3>
              <p className="text-[10px] text-slate-500 font-medium">Últimas oportunidades detectadas</p>
            </div>
          </div>
          <button className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-indigo-400 transition-all border border-white/5">
            Ver Pipeline Completo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Oportunidad</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Monto Estimado</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-slate-500 italic text-sm">
                    No se encontraron oportunidades registradas.
                  </td>
                </tr>
              ) : recent.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{item.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-slate-600" />
                      <span className="text-[10px] text-slate-500 font-medium">{item.fecha}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        {item.cliente.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{item.cliente}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-200">{item.monto}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      item.estado === 'Cerrado' || item.estado === 'Ganada'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2.5 hover:bg-indigo-500/20 rounded-xl text-slate-500 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30">
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer de Tabla */}
        <div className="p-6 bg-white/[0.01] border-t border-white/5 text-center">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
             Mostrando los 5 negocios más recientes — Sincronizado con Supabase Cloud
           </p>
        </div>
      </div>
    </div>
  )
}

