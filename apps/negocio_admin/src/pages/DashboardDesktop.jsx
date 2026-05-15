// ============================================
// Dashboard Desktop — VendeMas Business
// src/pages/DashboardDesktop.jsx
// ============================================
import { useState } from 'react'
import {
  Wallet, Trophy, Target, TrendingUp,
  ArrowUpRight, Clock, Briefcase, DollarSign, RefreshCcw,
  UserPlus, PackagePlus, UploadCloud
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'
import SentimentChart from '../components/dashboard/SentimentChart'

// ── Skeleton de carga ──────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] animate-pulse">
      <div className="flex justify-between items-start mb-5">
        <div className="w-12 h-12 rounded-2xl bg-white/5" />
        <div className="w-16 h-5 rounded-full bg-white/5" />
      </div>
      <div className="h-3 w-24 rounded bg-white/5 mb-2" />
      <div className="h-7 w-32 rounded bg-white/5" />
    </div>
  )
}

export default function DashboardDesktop({ data, isLoading, userRole, onNewCliente, onNewProducto, onCargaMasiva }) {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [displayCurrency, setDisplayCurrency] = useState('USD')

  const tcRef = tenant?.tipo_cambio_usd_pen || 3.8
  const formatMonto = (monto, monedaOrigen = 'USD') => {
    const n = parseFloat(monto) || 0
    let valor = n
    if (monedaOrigen !== displayCurrency) {
      valor = displayCurrency === 'USD' ? n / tcRef : n * tcRef
    }
    const simbolo = displayCurrency === 'USD' ? '$' : 'S/'
    return `${simbolo} ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

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
      title: 'Oportunidades',
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
  const ticketPromedioComercial = quotaData.cierres > 0
    ? quotaData.alcanzada / quotaData.cierres
    : 10000
  const brecha = quotaData.meta - quotaData.alcanzada
  const cierresFaltantes = Math.ceil(brecha / ticketPromedioComercial)

  return (
    <div className="p-8 pb-6 space-y-10 fade-up">

      {/* ── HEADER ── */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Resumen Comercial</h1>
          <p className="text-slate-400 mt-1 font-medium">
            Bienvenido al centro de mando de <span className="text-indigo-400">{tenant?.nombre || 'VendeMas Business'}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
            <div className="flex items-center gap-3 mr-2 pr-4 border-r border-white/10">
              <button
                onClick={onNewCliente}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                <UserPlus size={16} /> Crear Cliente
              </button>
              <button
                onClick={onNewProducto}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-500/30"
              >
                <PackagePlus size={16} /> Crear Producto
              </button>
              <button
                onClick={onCargaMasiva}
                className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-white/5 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-600 border-dashed"
              >
                <UploadCloud size={16} /> Carga Masiva
              </button>
            </div>
          )}
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
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Clock size={12} className="text-indigo-500" /> {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : stats.map((kpi, idx) => (
            <div key={idx} className="group glass bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] hover:scale-[1.02] hover:bg-slate-900/80 transition-all duration-300">
              <div className="flex justify-between items-start mb-5">
                <div className={`p-3.5 rounded-2xl ${kpi.bgColor} ${kpi.color} border ${kpi.borderColor} group-hover:scale-110 transition-transform`}>
                  <kpi.icon size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  {kpi.trend}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{kpi.title}</p>
                <h2 className="text-2xl font-black text-slate-100 mt-1 tracking-tight">
                  {kpi.rawUSD !== null && kpi.rawUSD !== undefined
                    ? formatMonto(kpi.rawUSD, 'USD')
                    : kpi.value}
                </h2>
              </div>
            </div>
          ))
        }
        <SentimentChart />
      </div>

      {/* ── NEGOCIOS RECIENTES & CUOTAS ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* TABLA NEGOCIOS RECIENTES */}
        <div className="col-span-2 glass bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
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

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-[10px] uppercase font-black text-slate-500 tracking-[0.15em]">
                <tr>
                  <th className="px-8 py-5">Oportunidad</th>
                  <th className="px-8 py-5">Cliente</th>
                  <th className="px-8 py-5">Monto</th>
                  <th className="px-8 py-5">Estado</th>
                  <th className="px-8 py-5 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-8 py-5"><div className="h-4 w-36 rounded bg-white/5" /></td>
                      <td className="px-8 py-5"><div className="h-4 w-28 rounded bg-white/5" /></td>
                      <td className="px-8 py-5"><div className="h-4 w-20 rounded bg-white/5" /></td>
                      <td className="px-8 py-5"><div className="h-4 w-16 rounded bg-white/5" /></td>
                      <td className="px-8 py-5" />
                    </tr>
                  ))
                ) : recent.length === 0 ? (
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
                        {formatMonto(item.montoRaw || 0, item.monedaOrigen || 'USD')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        item.estado === 'Cerrado' || item.estado === 'Ganada' || item.estado === 'Aceptada'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-slate-400 border-white/10'
                      }`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => item.tipo === 'cotizacion' ? navigate(`/cotizaciones?id=${item.id}`) : navigate('/pipeline')}
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
            {isLoading ? (
              <div className="w-full space-y-3 animate-pulse">
                <div className="h-8 rounded bg-white/5 w-3/4 mx-auto" />
                <div className="h-4 rounded bg-white/5 w-1/2 mx-auto" />
                <div className="h-4 rounded-full bg-white/5 w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="text-xl lg:text-2xl font-bold text-slate-100 mb-2 whitespace-nowrap">
                  {formatMonto(quotaData.alcanzada, 'USD')}
                  <span className="text-lg lg:text-xl text-slate-500 font-bold"> / {formatMonto(quotaData.meta, 'USD')}</span>
                </div>
                <p className="text-sm text-slate-400">{quotaData.cierres} cierres logrados este mes</p>

                <div className="w-full mt-6 bg-white/5 rounded-full h-4 overflow-hidden border border-white/5">
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

                {brecha > 0 && (
                  <div className="mt-3 p-2 bg-indigo-950/30 border border-indigo-900/50 rounded text-xs text-indigo-300 w-full text-center">
                    ✨ Proyección: Te faltan aprox. <b>{cierresFaltantes}</b> ventas promedio para la meta.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
