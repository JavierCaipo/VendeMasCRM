// ============================================
// Centro de Mando Premium — VendeMas Business
// src/pages/DashboardView.jsx
// ============================================
import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { 
  Wallet, Trophy, Target, TrendingUp, 
  ArrowUpRight, Clock, User, Briefcase,
  LineChart, CheckCircle, Calculator, DollarSign, RefreshCcw
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'
import SentimentChart from '../components/dashboard/SentimentChart'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [displayCurrency, setDisplayCurrency] = useState('USD')

  // ── CONVERSOR UNIVERSAL DE MONEDA ──────────────────────────────────
  // Convierte cualquier monto a la moneda de display actual
  const tcRef = tenant?.tipo_cambio_usd_pen || 3.8
  const convertCurrency = (monto, monedaOrigen = 'USD') => {
    const n = parseFloat(monto) || 0
    if (monedaOrigen === displayCurrency) return n
    if (displayCurrency === 'USD') return n / tcRef  // PEN → USD
    return n * tcRef                                  // USD → PEN
  }
  const formatMonto = (monto, monedaOrigen = 'USD') => {
    const valor = convertCurrency(monto, monedaOrigen)
    const simbolo = displayCurrency === 'USD' ? '$' : 'S/'
    return `${simbolo} ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const fetchDashboardData = async ([key, tenantId]) => {
    console.log('[SWR] Fetching dashboard for tenant:', tenantId)
    if (!tenantId) {
      console.warn('[SWR] No tenantId provided')
      return null
    }

    try {
      const hoy = new Date()
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()
      const tcRef = tenant.tipo_cambio_usd_pen || 3.8

      // ── 1a. COTIZACIONES DEL MES — fuente para "Cierres Ganados" y Ticket ──
      const { data: cotsDelMes, error: cotError } = await supabase
        .from('cotizaciones')
        .select('id, estado, total, moneda, tipo_cambio, fecha_creacion, agente_id, correlativo, cliente_id, clientes(nombre_razon_social)')
        .eq('negocio_id', tenantId)
        .gte('fecha_creacion', primerDiaMes)
        .order('fecha_creacion', { ascending: false })

      if (cotError) throw cotError
      console.log('[SWR] cotsDelMes count:', cotsDelMes?.length)

      // ── 1b. EMBUDO ACTIVO — borrador + enviada SIN filtro de fecha ──────────
      // El embudo son deals vivos HOY, independientemente de cuándo se crearon.
      const { data: cotsEmbudo } = await supabase
        .from('cotizaciones')
        .select('id, estado, total, moneda, tipo_cambio')
        .eq('negocio_id', tenantId)
        .in('estado', ['borrador', 'BORRADOR', 'enviada', 'ENVIADA'])
      console.log('[SWR] cotsEmbudo count:', cotsEmbudo?.length)

      // ── 2. MOTOR MULTIMONEDA ──────────────────────────────────────
      const toUSD = (cot) => {
        const monto = parseFloat(cot.total) || 0
        const tc = parseFloat(cot.tipo_cambio) || tcRef
        return (cot.moneda || 'USD') === 'USD' ? monto : monto / tc
      }

      // KPI Ganado y Ticket: solo cotizaciones del mes
      let totalGanado = 0
      cotsDelMes?.forEach(cot => {
        if ((cot.estado || '').toLowerCase() === 'aceptada') {
          totalGanado += toUSD(cot)
        }
      })
      const ticketPromedio = (cotsDelMes?.length ?? 0) > 0
        ? (cotsDelMes.reduce((acc, c) => acc + toUSD(c), 0)) / cotsDelMes.length
        : 0

      // KPI Embudo: TODAS las activas vivas (sin filtro de fecha)
      let totalEmbudo = 0
      let activasCount = 0
      cotsEmbudo?.forEach(cot => {
        totalEmbudo += toUSD(cot)
        activasCount++
      })

      // Alias para compatibilidad con el resto del código (agente_id, correlativo...)
      const cots = cotsDelMes || []

      // ── 3. CUOTA DEL USUARIO ACTIVO (sin bloqueo por rol) ──────────────────
      const { data: { user } } = await supabase.auth.getUser()
      let metaMensual = 500000 // default fallback
      let totalGanadoUsuario = 0
      let cantidadCierresUsuario = 0
      if (user) {
        const { data: userData, error: uErr } = await supabase
          .from('usuarios_negocio')
          .select('meta_ventas_mensual')
          .eq('id', user.id)
          .maybeSingle()
        if (uErr) console.error('[Dashboard] Error al leer meta_ventas_mensual:', uErr)
        metaMensual = userData?.meta_ventas_mensual || 500000
        
        // Calcular total monetario ganado por el usuario actual en el mes
        cots.forEach(cot => {
          if (cot.agente_id === user.id && (cot.estado || '').toLowerCase() === 'aceptada') {
            totalGanadoUsuario += toUSD(cot)
            cantidadCierresUsuario++
          }
        })
      }
      setQuotaData({ meta: metaMensual, alcanzada: totalGanadoUsuario, cierres: cantidadCierresUsuario })

      // ── 4. OPORTUNIDADES — solo para "Recientes" ───────────────────
      const { data: ops } = await supabase
        .from('oportunidades')
        .select('id, titulo, valor_estimado, fecha_creacion, cliente:clientes(nombre_razon_social), etapa:pipeline_etapas(nombre)')
        .eq('negocio_id', tenantId)
        .order('fecha_creacion', { ascending: false })
        .limit(5)
      console.log('[SWR] oportunidades recientes count:', ops?.length)

      // ── 6. DATA MAPPING FINAL ────────────────────────
      const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
      const recentCots = cots.slice(0, 5).map(c => ({
        id: c.id,
        tipo: 'cotizacion',
        titulo: `Cotización #${c.correlativo || c.id.toString().slice(0,6)}`,
        cliente: c.clientes?.nombre_razon_social || 'Cliente s/n',
        montoRaw: parseFloat(c.total) || 0,
        monedaOrigen: c.moneda || 'USD',
        monto: `${c.moneda === 'USD' ? '$' : 'S/'} ${(parseFloat(c.total)||0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
        fecha: new Date(c.fecha_creacion).toLocaleDateString('es-PE'),
        estado: (c.estado || 'borrador').charAt(0).toUpperCase() + (c.estado || 'borrador').slice(1)
      }))

      const opsMapped = (ops || []).slice(0, 5).map(op => ({
        id: op.id,
        tipo: 'oportunidad',
        titulo: op.titulo,
        cliente: op.cliente?.nombre_razon_social || 'Cliente s/n',
        monto: fmtUSD.format(op.valor_estimado),
        fecha: new Date(op.fecha_creacion).toLocaleDateString('es-PE'),
        estado: op.etapa?.nombre || 'Pipeline'
      }))

      return {
        totalEmbudo,
        cierresGanados: totalGanado,
        oportunidadesActivas: activasCount,
        ticketPromedio,
        metaMensual,
        alcanzada: totalGanadoUsuario,
        cantidadCierres: cantidadCierresUsuario,
        negociosRecientes: recentCots.length > 0 ? recentCots : opsMapped,
        hoyStr: hoy.toDateString(),
        cotsActivasHoyCount: cots.filter(c => new Date(c.fecha_creacion).toDateString() === hoy.toDateString()).length,
        cotsGanadasMes: cots.filter(c => (c.estado||'').toLowerCase() === 'aceptada').length
      }

    } catch (err) {
      console.error('Error al cargar Dashboard:', err)
      return null
    }
  }

  const { data, isLoading: loading, mutate } = useSWR(tenant?.id ? ['dashboard', tenant.id] : null, fetchDashboardData)

  const stats = [
    {
      title: 'Total en Embudo',
      rawUSD: data?.totalEmbudo || 0,
      value: null,
      icon: Wallet,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/15',
      borderColor: 'border-indigo-500/25',
      trend: `${data?.oportunidadesActivas || 0} cots. activas`
    },
    {
      title: 'Cierres Ganados',
      rawUSD: data?.cierresGanados || 0,
      value: null,
      icon: Trophy,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
      borderColor: 'border-emerald-500/25',
      trend: `${data?.cotsGanadasMes || 0} este mes`
    },
    {
      title: 'Oportunidades Activas',
      rawUSD: null,
      value: (data?.oportunidadesActivas || 0).toString(),
      icon: Target,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/15',
      borderColor: 'border-sky-500/25',
      trend: `+${data?.cotsActivasHoyCount || 0} hoy`
    },
    {
      title: 'Ticket Promedio',
      rawUSD: data?.ticketPromedio || 0,
      value: null,
      icon: TrendingUp,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
      borderColor: 'border-amber-500/25',
      trend: 'Mes en curso'
    },
  ]

  const recent = data?.negociosRecientes || []
  const quotaData = { 
    meta: data?.metaMensual || 500000, 
    alcanzada: data?.alcanzada || 0, 
    cierres: data?.cantidadCierres || 0 
  }


  // ── SYNC DE HUÉRFANOS ──────────────────────────────────────────
  // Detecta cotizaciones sin oportunidad_id y crea su fila en oportunidades
  // para que sean visibles en el Pipeline. Se ejecuta silenciosamente al montar.
  const syncHuerfanos = async () => {
    if (!tenant?.id) return
    try {
      // 1. Cotizaciones sin oportunidad vinculada
      const { data: huerfanas } = await supabase
        .from('cotizaciones')
        .select('id, total, moneda, tipo_cambio, cliente_id, agente_id, correlativo, clientes(nombre_razon_social)')
        .eq('negocio_id', tenant.id)
        .is('oportunidad_id', null)

      if (!huerfanas || huerfanas.length === 0) return

      // 2. Etapas: primera (prospecto) y última (cerrado)
      const { data: etapas } = await supabase
        .from('pipeline_etapas')
        .select('id, nombre, orden')
        .eq('negocio_id', tenant.id)
        .order('orden', { ascending: true })
        .limit(10)

      if (!etapas || etapas.length === 0) return
      const etapaInicio = etapas[0]           // Prospecto / primera
      const etapaFin   = etapas[etapas.length - 1]  // Cerrado / última
      const etapaPropuesta = etapas.find(e =>
        e.nombre.toLowerCase().includes('propuesta') ||
        e.nombre.toLowerCase().includes('cotizaci')
      ) || etapaInicio

      // 3. Crear oportunidad por cada huérfana con etapa según estado de cotización
      for (const cot of huerfanas) {
        const estadoNorm = (cot.estado || '').toLowerCase()
        // Aceptada → etapa de cierre; Borrador/Enviada → etapa propuesta
        const etapaAsignada = estadoNorm === 'aceptada' ? etapaFin : etapaPropuesta
        const opPayload = {
          negocio_id: tenant.id,
          cliente_id: cot.cliente_id,
          agente_id: cot.agente_id,
          etapa_id: etapaAsignada.id,
          titulo: `Cot. ${cot.correlativo || cot.id.slice(0, 6)} — ${cot.clientes?.nombre_razon_social || 'Cliente'}`,
          valor_estimado: parseFloat(cot.total) || 0,
          moneda: cot.moneda || 'USD',
          tipo_cambio: parseFloat(cot.tipo_cambio) || null,
        }
        const { data: newOp, error: opErr } = await supabase
          .from('oportunidades')
          .insert([opPayload])
          .select('id')
          .single()

        if (!opErr && newOp) {
          await supabase
            .from('cotizaciones')
            .update({ oportunidad_id: newOp.id })
            .eq('id', cot.id)
          console.log(`[Sync] Oportunidad creada para cot. ${cot.correlativo}: ${newOp.id}`)
        }
      }
    } catch (err) {
      console.warn('[Sync Huérfanos] Error no crítico:', err.message)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (tenant?.id) {
        await syncHuerfanos()   // primero crear oportunidades faltantes
        mutate() // Revalidar la cache de SWR
      }
    }
    init()

    // ── TIEMPO REAL ──────────────────────────────────────────────
    if (!tenant?.id) return

    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'oportunidades', filter: `negocio_id=eq.${tenant.id}` },
        () => mutate()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, mutate])

  // ── CÁLCULO DE PROYECCIÓN DE METAS ──────────────────────────────
  const ticketPromedioComercial = (quotaData.cierres || 0) > 0 
    ? quotaData.alcanzada / quotaData.cierres 
    : 10000;
  const brecha = quotaData.meta - quotaData.alcanzada;
  const cierresFaltantes = Math.ceil(brecha / ticketPromedioComercial);

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
    <div className="w-full p-4 md:p-8 pb-20 md:pb-6 space-y-6 md:space-y-10 fade-up overflow-y-auto overflow-x-hidden max-h-[calc(100vh-100px)] custom-scrollbar">
      
      {/* ── HEADER DE BIENVENIDA ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Resumen Comercial</h1>
          <p className="text-slate-400 mt-1 font-medium">
            Bienvenido al centro de mando de <span className="text-indigo-400">{tenant?.nombre || 'VendeMas Business'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Switch de Moneda */}
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setDisplayCurrency('USD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                displayCurrency === 'USD'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <DollarSign size={10} /> USD
            </button>
            <button
              onClick={() => setDisplayCurrency('PEN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                displayCurrency === 'PEN'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <RefreshCcw size={10} /> S/
            </button>
          </div>
          {/* Badge de Sincronización */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Clock size={12} className="text-indigo-500" /> Sincronizado: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 mb-6">
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
              <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
                {kpi.rawUSD !== null && kpi.rawUSD !== undefined
                  ? formatMonto(kpi.rawUSD, 'USD')   // convierte según displayCurrency
                  : kpi.value}
              </h2>
            </div>
          </div>
        ))}
        <SentimentChart />
      </div>

      {/* ── SECCIÓN CENTRAL: NEGOCIOS RECIENTES & CUOTAS ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NEGOCIOS RECIENTES */}
        <div className="lg:col-span-2 glass bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
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
          <button 
            onClick={() => navigate('/pipeline')}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-indigo-400 transition-all border border-white/5"
          >
            Ver Pipeline Completo
          </button>
        </div>

        <div className="overflow-x-auto w-full pb-2">
          <table className="w-full text-left min-w-[600px] md:min-w-full">
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
                    <span className="text-sm font-black text-slate-200">
                      {/* Monto convertido a la moneda de display activa */}
                      {(() => {
                        // item.monedaOrigen viene del map en fetchDashboardData
                        const raw = parseFloat(item.montoRaw) || parseFloat(item.monto?.replace(/[^0-9.-]/g, '')) || 0
                        const origen = item.monedaOrigen || 'USD'
                        return formatMonto(raw, origen)
                      })()}
                    </span>
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
                    <button
                      title={item.tipo === 'cotizacion' ? 'Ver cotización' : 'Ver en Pipeline'}
                      onClick={() =>
                        item.tipo === 'cotizacion'
                          ? navigate(`/cotizaciones?id=${item.id}`)
                          : navigate('/pipeline')
                      }
                      className="p-2.5 hover:bg-indigo-500/20 rounded-xl text-slate-500 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30"
                    >
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
             Mostrando los 5 negocios más recientes — Sincronizado en Cloud
           </p>
        </div>
      </div>

      {/* WIDGET DE CUOTAS */}
      <div className="glass bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
             <Target size={20} />
           </div>
           <div>
             <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Meta de Ventas</h3>
             <p className="text-[10px] text-slate-500 font-medium">Cuota Monetaria / Mes</p>
           </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center py-6 w-full">
           <div className="text-xl lg:text-2xl font-bold text-slate-100 mb-2 whitespace-nowrap">
             {formatMonto(quotaData.alcanzada, 'USD')} <span className="text-lg lg:text-xl text-slate-500 font-bold">/ {formatMonto(quotaData.meta, 'USD')}</span>
           </div>
           <p className="text-sm text-slate-400">{quotaData.cierres || 0} cierres logrados este mes</p>
           
           {/* Barra de progreso */}
           <div className="w-full mt-6 bg-white/5 rounded-full h-4 overflow-hidden border border-white/5 relative">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min((quotaData.alcanzada / quotaData.meta) * 100, 100) || 0}%` }}
              />
           </div>
           <div className="flex justify-between items-center w-full mt-2">
             <p className="text-right text-[10px] text-amber-400 font-bold uppercase tracking-wider ml-auto">
               {Math.round((quotaData.alcanzada / quotaData.meta) * 100) || 0}% Completado
             </p>
           </div>
           
           {/* Proyección Predictiva */}
           {brecha > 0 && (
             <div className="mt-3 p-2 bg-indigo-950/30 border border-indigo-900/50 rounded text-xs text-indigo-300 w-full text-center">
               ✨ Proyección: Te faltan aprox. <b>{cierresFaltantes}</b> ventas promedio para alcanzar la meta.
             </div>
           )}
        </div>
      </div>

      </div>
    </div>
  )
}
