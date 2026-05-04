// ============================================
// Dashboard Analítico 360° — VendeMas CRM
// src/pages/Dashboard.jsx
// ============================================
import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  Users, BarChart3, ArrowUpRight, Activity,
  Calendar, Award, FileText
} from 'lucide-react'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid
} from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'

export default function DashboardWrapper() {
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoadingUser(false)
    })
  }, [])

  if (loadingUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const rol = user?.user_metadata?.rol || 'comercial'
  
  if (rol === 'admin') {
    return <DashboardAdmin />
  }

  return <DashboardComercial user={user} />
}

function DashboardAdmin() {
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

function DashboardComercial({ user }) {
  const { tenant } = useTenant()
  const [data, setData] = useState({
    clientesCount: 0,
    pipelineActivo: 0,
    cotizacionesGanadas: 0,
    metaVentas: 0,
    ultimosClientes: [],
    cotizacionesPendientes: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Clientes Count
      const { count: cCount } = await supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('negocio_id', tenant.id)
      
      // Oportunidades (Pipeline Activo)
      const { data: oportunidades } = await supabase.from('oportunidades').select('valor_estimado').eq('negocio_id', tenant.id)
      const pipelineTotal = (oportunidades || []).reduce((acc, op) => acc + (parseFloat(op.valor_estimado) || 0), 0)

      // Meta de Ventas y Cotizaciones ganadas del mes actual
      const { data: userData } = await supabase.from('usuarios_negocio').select('meta_ventas_mensual').eq('id', user.id).single()
      const meta = userData?.meta_ventas_mensual || 0

      const hoy = new Date();
      const startOfMonth = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      const endOfMonth = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: cotGanadas } = await supabase.from('cotizaciones')
        .select('total, moneda, tipo_cambio')
        .eq('negocio_id', tenant.id)
        .eq('estado', 'aceptada')
        .gte('fecha_creacion', startOfMonth)
        .lte('fecha_creacion', endOfMonth)

      const ganadasTotal = (cotGanadas || []).reduce((acc, c) => {
        const tc = parseFloat(c.tipo_cambio) || 1
        const valorPEN = c.moneda === 'USD' ? c.total * tc : c.total
        return acc + valorPEN
      }, 0)

      // Últimos Clientes Asignados
      const { data: uClientes } = await supabase.from('clientes')
        .select('*')
        .eq('negocio_id', tenant.id)
        .order('fecha_creacion', { ascending: false })
        .limit(5)

      // Cotizaciones Pendientes
      const { data: cPendientes } = await supabase.from('cotizaciones')
        .select('*')
        .eq('negocio_id', tenant.id)
        .not('estado', 'in', '("aceptada","rechazada")')
        .order('fecha_creacion', { ascending: false })
        .limit(5)

      setData({
        clientesCount: cCount || 0,
        pipelineActivo: pipelineTotal,
        cotizacionesGanadas: ganadasTotal,
        metaVentas: meta,
        ultimosClientes: uClientes || [],
        cotizacionesPendientes: cPendientes || []
      })
      setLoading(false)
    }

    if (tenant?.id) fetchData()
  }, [tenant?.id])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">Cargando Panel Comercial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 fade-up overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
      {/* Header y Meta de Ventas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">¡Vamos {user?.user_metadata?.nombre_completo?.split(' ')[0] || 'equipo'}, tú puedes!</h1>
          <p className="text-slate-400 text-sm font-medium mt-1">Este es tu resumen comercial asignado.</p>
        </div>

        {/* Progress Bar Meta */}
        <div className="glass rounded-[1.5rem] border border-white/10 p-5 md:w-96">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Progreso Mensual</p>
              <h4 className="text-lg font-black text-slate-100">
                S/ {data.cotizacionesGanadas.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                <span className="text-xs text-slate-500 font-medium ml-1">
                  de S/ {data.metaVentas.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </span>
              </h4>
            </div>
            <div className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg">
              {data.metaVentas > 0 ? Math.min((data.cotizacionesGanadas / data.metaVentas) * 100, 100).toFixed(1) : 0}%
            </div>
          </div>
          
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
            {data.metaVentas > 0 ? (
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((data.cotizacionesGanadas / data.metaVentas) * 100, 100)}%` }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[8px] text-slate-500 font-bold uppercase tracking-widest">
                Meta no asignada aún
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Clientes Asignados" 
          value={data.clientesCount} 
          icon={<Users className="text-indigo-400" />} 
          subtitle="Total en cartera"
          color="indigo"
        />
        <KPICard 
          title="Pipeline Activo" 
          value={`$ ${data.pipelineActivo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<Target className="text-amber-400" />} 
          subtitle="Valor estimado total"
          color="amber"
        />
        <KPICard 
          title="Cotizaciones Ganadas" 
          value={`$ ${data.cotizacionesGanadas.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp className="text-emerald-400" />} 
          subtitle="Valor total cerrado"
          color="emerald"
        />
      </div>

      {/* Foco */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass rounded-[2.5rem] border border-white/10 p-8 flex flex-col h-[400px]">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-8">
            <Users size={16} className="text-indigo-500" /> Últimos Clientes Asignados
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {data.ultimosClientes.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center mt-10">No tienes clientes recientes.</p>
            ) : data.ultimosClientes.map(c => (
              <div key={c.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{c.nombre_razon_social}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{c.email || 'Sin correo registrado'}</p>
                </div>
                <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                  Tarifa {c.tarifa_asignada}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-[2.5rem] border border-white/10 p-8 flex flex-col h-[400px]">
          <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-8">
            <FileText size={16} className="text-amber-500" /> Cotizaciones Pendientes
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {data.cotizacionesPendientes.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center mt-10">No tienes cotizaciones en curso.</p>
            ) : data.cotizacionesPendientes.map(c => (
              <div key={c.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                <div>
                  <p className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{c.correlativo || 'COT-XXX'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{new Date(c.fecha_creacion).toLocaleDateString('es-PE')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-200">{c.moneda === 'USD' ? '$' : 'S/'} {parseFloat(c.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[9px] font-bold uppercase text-amber-500 tracking-tighter mt-0.5">{c.estado}</p>
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
