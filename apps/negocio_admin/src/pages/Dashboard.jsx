// ============================================
// Dashboard Analítico 360° — VendeMas CRM
// src/pages/Dashboard.jsx
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Users, BarChart3, ArrowUpRight, Activity,
  Calendar, Award
} from 'lucide-react'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'

export default function Dashboard() {
  const { tenant, agentes } = useTenant()
  const [loading, setLoading] = useState(true)
  const [cotizaciones, setCotizaciones] = useState([])
  const [cotizacionesAnterior, setCotizacionesAnterior] = useState([])
  const [rangoTiempo, setRangoTiempo] = useState('este_mes')

  const getPeriods = (rango) => {
    const hoy = new Date();
    const start = new Date(hoy);
    const prevStart = new Date(hoy);
    const prevEnd = new Date(hoy);

    switch (rango) {
      case 'hoy': 
        start.setHours(0,0,0,0);
        prevStart.setDate(prevStart.getDate() - 1);
        prevStart.setHours(0,0,0,0);
        prevEnd.setDate(prevEnd.getDate() - 1);
        prevEnd.setHours(23,59,59,999);
        return { start, prevStart, prevEnd };
      case '7_dias': 
        start.setDate(start.getDate() - 7);
        prevStart.setDate(prevStart.getDate() - 14);
        prevEnd.setDate(prevEnd.getDate() - 7);
        return { start, prevStart, prevEnd };
      case 'este_mes': 
        const monthStart = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const lastMonthStart = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const lastMonthEnd = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59, 999);
        return { start: monthStart, prevStart: lastMonthStart, prevEnd: lastMonthEnd };
      case 'este_anio': 
        const yearStart = new Date(hoy.getFullYear(), 0, 1);
        const lastYearStart = new Date(hoy.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(hoy.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        return { start: yearStart, prevStart: lastYearStart, prevEnd: lastYearEnd };
      default: return { start: null, prevStart: null, prevEnd: null };
    }
  };

  useEffect(() => {
    fetchDashboardData()
  }, [tenant.id, rangoTiempo])

  async function fetchDashboardData() {
    setLoading(true)
    const { start, prevStart, prevEnd } = getPeriods(rangoTiempo);

    let queryActual = supabase
      .from('cotizaciones')
      .select('id, estado, total, moneda, tipo_cambio, fecha_creacion, agente_id')
      .eq('negocio_id', tenant.id)

    let queryAnterior = supabase
      .from('cotizaciones')
      .select('id, estado, total, moneda, tipo_cambio, fecha_creacion, agente_id')
      .eq('negocio_id', tenant.id)

    if (start) queryActual = queryActual.gte('fecha_creacion', start.toISOString())
    
    if (prevStart && prevEnd) {
      queryAnterior = queryAnterior
        .gte('fecha_creacion', prevStart.toISOString())
        .lte('fecha_creacion', prevEnd.toISOString())
    }

    const [resActual, resAnterior] = await Promise.all([
      queryActual.order('fecha_creacion', { ascending: true }),
      queryAnterior.order('fecha_creacion', { ascending: true })
    ])

    if (resActual.error || resAnterior.error) {
      console.error('Error fetching dashboard data:', resActual.error || resAnterior.error)
    } else {
      setCotizaciones(resActual.data || [])
      setCotizacionesAnterior(resAnterior.data || [])
    }
    setLoading(false)
  }

  // MOTOR DE PROCESAMIENTO 360
  const processed = useMemo(() => {
    const defaultRes = {
      kpis: { totalCotizado: 0, totalCerrado: 0, tasaConversion: 0, activas: 0, trends: {} },
      chartData: [],
      leaderboard: []
    }
    if (!cotizaciones.length && !cotizacionesAnterior.length) return defaultRes;

    // Procesar Periodo Actual
    let actualCotizado = 0; let actualCerrado = 0; let actualCerradasCount = 0; let actualActivasCount = 0;
    const dailyMap = {}; const agentMap = {};

    cotizaciones.forEach(c => {
      const tc = parseFloat(c.tipo_cambio) || 1
      const valorPEN = c.moneda === 'USD' ? c.total * tc : c.total
      actualCotizado += valorPEN
      if (c.estado === 'pendiente') actualActivasCount++
      if (c.estado === 'aceptada') {
        actualCerrado += valorPEN
        actualCerradasCount++
        const date = new Date(c.fecha_creacion).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
        dailyMap[date] = (dailyMap[date] || 0) + valorPEN
        const agente = agentes.find(a => a.id === c.agente_id)
        const agentName = agente ? agente.nombre_completo : 'Desconocido'
        if (!agentMap[agentName]) {
          agentMap[agentName] = { name: agentName, total: 0, count: 0, initials: agentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) }
        }
        agentMap[agentName].total += valorPEN
        agentMap[agentName].count++
      }
    })

    // Procesar Periodo Anterior
    let prevCotizado = 0; let prevCerrado = 0; let prevCerradasCount = 0;
    cotizacionesAnterior.forEach(c => {
      const tc = parseFloat(c.tipo_cambio) || 1
      const valorPEN = c.moneda === 'USD' ? c.total * tc : c.total
      prevCotizado += valorPEN
      if (c.estado === 'aceptada') {
        prevCerrado += valorPEN
        prevCerradasCount++
      }
    })

    const calcTrend = (act, prev) => prev === 0 ? (act > 0 ? 100 : 0) : ((act - prev) / prev) * 100

    const trends = {
      totalCotizado: calcTrend(actualCotizado, prevCotizado),
      totalCerrado: calcTrend(actualCerrado, prevCerrado),
      winRate: calcTrend(
        (actualCerradasCount / (cotizaciones.length || 1)) * 100,
        (prevCerradasCount / (cotizacionesAnterior.length || 1)) * 100
      )
    }

    const chartData = Object.entries(dailyMap).map(([date, val]) => ({ date, value: parseFloat(val.toFixed(2)) }))
    const leaderboard = Object.values(agentMap).sort((a, b) => b.total - a.total)

    return {
      kpis: {
        totalCotizado: actualCotizado,
        totalCerrado: actualCerrado,
        tasaConversion: (actualCerradasCount / (cotizaciones.length || 1)) * 100,
        activas: actualActivasCount,
        trends
      },
      chartData,
      leaderboard
    }
  }, [cotizaciones, cotizacionesAnterior, agentes])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">Generando Inteligencia Comercial...</p>
        </div>
      </div>
    )
  }

  const { kpis, chartData, leaderboard } = processed

  return (
    <div className="p-8 space-y-8 fade-up overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-indigo-500" /> Dashboard de Negocio
          </h1>
          <p className="text-slate-400 text-sm font-medium">Análisis de rendimiento comercial — últimos 30 días</p>
        </div>
        <div className="flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-2xl shadow-inner shadow-black/20">
          <Calendar size={14} className="text-indigo-400" />
          <select 
            value={rangoTiempo} 
            onChange={(e) => setRangoTiempo(e.target.value)}
            className="bg-transparent border-none text-slate-300 text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer pr-2"
          >
            <option value="hoy" className="bg-slate-900">Hoy</option>
            <option value="7_dias" className="bg-slate-900">Últimos 7 días</option>
            <option value="este_mes" className="bg-slate-900">Este Mes</option>
            <option value="este_anio" className="bg-slate-900">Este Año</option>
            <option value="todo" className="bg-slate-900">Todo el Tiempo</option>
          </select>
        </div>
      </div>

      {/* ZONA SUPERIOR: KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Cotizado" 
          value={`S/ ${kpis.totalCotizado.toLocaleString()}`} 
          icon={<DollarSign className="text-indigo-400" />} 
          subtitle="Proyección bruta (PEN)"
          color="indigo"
          trend={kpis.trends.totalCotizado}
        />
        <KPICard 
          title="Ventas Cerradas" 
          value={`S/ ${kpis.totalCerrado.toLocaleString()}`} 
          icon={<TrendingUp className="text-emerald-400" />} 
          subtitle="Ingresos confirmados"
          color="emerald"
          trend={kpis.trends.totalCerrado}
        />
        <KPICard 
          title="Win Rate" 
          value={`${kpis.tasaConversion.toFixed(1)}%`} 
          icon={<Target className="text-amber-400" />} 
          subtitle="Tasa de cierre actual"
          color="amber"
          trend={kpis.trends.winRate}
        />
        <KPICard 
          title="Pendientes" 
          value={kpis.activas} 
          icon={<Activity className="text-sky-400" />} 
          subtitle="Cotizaciones en seguimiento"
          color="sky"
        />
      </div>

      {/* ZONA MEDIA: Gráfico de Tendencia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[2.5rem] border border-white/10 p-8 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> Tendencia de Ventas (S/)
            </h3>
            <div className="text-[10px] text-slate-500 font-bold bg-white/5 px-3 py-1 rounded-full uppercase">Real-time Data</div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `S/${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', color: '#fff' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ZONA LATERAL: Top Performers */}
        <div className="glass rounded-[2.5rem] border border-white/10 p-8 flex flex-col h-[400px]">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-8">
            <Award size={16} className="text-amber-500" /> Top Performers
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {leaderboard.length === 0 ? (
              <p className="text-slate-500 text-center text-xs italic mt-10">Sin ventas cerradas este mes</p>
            ) : leaderboard.map((agent, i) => (
              <div key={agent.name} className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border ${
                  i === 0 ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                  i === 1 ? 'bg-slate-300/10 text-slate-300 border-slate-300/30' :
                  'bg-orange-500/10 text-orange-400 border-orange-500/30'
                }`}>
                  {agent.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">{agent.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{agent.count} cotizaciones cerradas</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-100">S/ {agent.total.toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">Confirmed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, icon, subtitle, color, trend }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    sky: 'from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-400',
  }

  return (
    <div className={`glass rounded-[2rem] border p-6 bg-gradient-to-br ${colors[color]} hover:scale-[1.02] transition-all cursor-default group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-100 tracking-tight">{value}</h4>
        
        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-black border ${
              trend > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              trend < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {trend > 0 ? <TrendingUp size={10} /> : trend < 0 ? <TrendingDown size={10} /> : null}
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">vs periodo anterior</span>
          </div>
        )}
        
        {!trend && <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{subtitle}</p>}
      </div>
    </div>
  )
}
