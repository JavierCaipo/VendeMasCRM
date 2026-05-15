// ============================================
// Dashboard Mobile — VendeMas Business
// src/pages/DashboardMobile.jsx
// ============================================
import { useState } from 'react'
import {
  Wallet, Trophy, Target, TrendingUp,
  ArrowUpRight, Clock, ChevronRight, DollarSign, RefreshCcw, Sparkles,
  MoreVertical, UserPlus, PackagePlus, UploadCloud
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'
import SentimentChart from '../components/dashboard/SentimentChart'

// ── Skeleton compacto ──────────────────────────────────────────────
function CardSkeleton({ className = '' }) {
  return (
    <div className={`glass bg-slate-900/50 border border-white/5 rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="h-3 w-20 rounded bg-white/5 mb-3" />
      <div className="h-7 w-32 rounded bg-white/5 mb-2" />
      <div className="h-3 w-16 rounded bg-white/5" />
    </div>
  )
}

const METRIC_CONFIGS = [
  { key: 'totalEmbudo',        label: 'Total Embudo',     icon: Wallet,    color: 'text-indigo-400',  bg: 'bg-indigo-500/15',  border: 'border-indigo-500/25',  isMoney: true  },
  { key: 'cierresGanados',     label: 'Cierres Ganados',  icon: Trophy,    color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/25', isMoney: true  },
  { key: 'oportunidadesActivas', label: 'Oportunidades',  icon: Target,    color: 'text-sky-400',     bg: 'bg-sky-500/15',     border: 'border-sky-500/25',     isMoney: false },
  { key: 'ticketPromedio',     label: 'Ticket Promedio',  icon: TrendingUp, color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/25',   isMoney: true  },
]

function estadoBadgeClass(estado) {
  const e = (estado || '').toLowerCase()
  if (e === 'aceptada' || e === 'cerrado' || e === 'ganada') {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
  }
  if (e === 'borrador') return 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
}

export default function DashboardMobile({ data, isLoading, userRole, onNewCliente, onNewProducto, onCargaMasiva }) {
  const { tenant } = useTenant()
  const navigate = useNavigate()
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [menuOpen, setMenuOpen] = useState(false)

  if (!data && isLoading) {
    return (
      <div className="p-4 space-y-6 flex flex-col gap-4 fade-up">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 glass rounded-3xl animate-pulse bg-white/5 border border-white/5" />
        ))}
      </div>
    )
  }
  if (!data) return null

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

  const quotaData = {
    meta: data?.metaMensual || 500000,
    alcanzada: data?.alcanzada || 0,
    cierres: data?.cantidadCierres || 0
  }
  const progresoPct = Math.min((quotaData.alcanzada / quotaData.meta) * 100, 100) || 0
  const brecha = quotaData.meta - quotaData.alcanzada
  const ticketProm = quotaData.cierres > 0 ? quotaData.alcanzada / quotaData.cierres : 10000
  const cierresFaltantes = Math.ceil(brecha / ticketProm)

  const recent = data?.negociosRecientes || []

  return (
    <div className="w-full overflow-x-hidden px-4 pb-28 pt-4 space-y-5 fade-up">

      {/* ── HEADER COMPACTO ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight">Resumen</h1>
          <p className="text-xs text-slate-500">{tenant?.nombre}</p>
        </div>
        {/* Mini switch de moneda y Menú Admin */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              onClick={() => setDisplayCurrency('USD')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                displayCurrency === 'USD' ? 'bg-indigo-500 text-white' : 'text-slate-500'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => setDisplayCurrency('PEN')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                displayCurrency === 'PEN' ? 'bg-amber-500 text-white' : 'text-slate-500'
              }`}
            >
              S/ PEN
            </button>
          </div>

          {userRole && ['superadmin', 'admin_negocio'].includes(userRole.toLowerCase()) && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30 active:scale-95 transition-all"
              >
                <MoreVertical size={16} />
              </button>
              
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden fade-up">
                    <button
                      onClick={() => { setMenuOpen(false); onNewCliente(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-all"
                    >
                      <UserPlus size={16} className="text-indigo-400" /> Crear Cliente
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onNewProducto(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-all"
                    >
                      <PackagePlus size={16} className="text-emerald-400" /> Crear Producto
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onCargaMasiva(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-all border-t border-white/5"
                    >
                      <UploadCloud size={16} className="text-slate-400" /> Carga Masiva
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── META DE VENTAS — full width ── */}
      {isLoading ? (
        <CardSkeleton className="h-36" />
      ) : (
        <div className="glass bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Target size={16} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta de Ventas</p>
              <p className="text-[10px] text-slate-600">Cuota mensual</p>
            </div>
            <span className="ml-auto text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {Math.round(progresoPct)}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-100 mb-0.5">
            {formatMonto(quotaData.alcanzada, 'USD')}
            <span className="text-sm text-slate-500 font-normal"> / {formatMonto(quotaData.meta, 'USD')}</span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">{quotaData.cierres} cierres este mes</p>
          {/* Barra prominente */}
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progresoPct}%` }}
            />
          </div>
          {brecha > 0 && (
            <div className="mt-3 flex items-start gap-1.5">
              <Sparkles size={11} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-indigo-300">
                ~<b>{cierresFaltantes}</b> ventas más para cumplir la meta
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── CAROUSEL DE MÉTRICAS ── */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Métricas del Mes</p>
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[160px] snap-center glass bg-slate-900/50 border border-white/5 rounded-2xl p-4 animate-pulse shrink-0">
                  <div className="h-8 w-8 rounded-xl bg-white/5 mb-3" />
                  <div className="h-3 w-20 rounded bg-white/5 mb-2" />
                  <div className="h-6 w-24 rounded bg-white/5" />
                </div>
              ))
            : METRIC_CONFIGS.map((cfg) => {
                const Icon = cfg.icon
                const rawVal = data?.[cfg.key] || 0
                const displayVal = cfg.isMoney ? formatMonto(rawVal, 'USD') : rawVal.toString()
                return (
                  <div
                    key={cfg.key}
                    className="min-w-[160px] snap-center glass bg-slate-900/50 border border-white/5 rounded-2xl p-4 shrink-0"
                  >
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} ${cfg.color} border ${cfg.border} flex items-center justify-center mb-3`}>
                      <Icon size={18} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{cfg.label}</p>
                    <p className={`text-lg font-black ${cfg.color} leading-tight`}>{displayVal}</p>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* ── SENTIMIENTO IA — compacto ── */}
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Análisis de Sentimiento IA</p>
        <div className="glass bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
          <SentimentChart compact />
        </div>
      </div>

      {/* ── NEGOCIOS RECIENTES — Cards (sin tabla) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Negocios Recientes</p>
          <button
            onClick={() => navigate('/pipeline')}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-400"
          >
            Ver todos <ChevronRight size={12} />
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass bg-slate-900/50 border border-white/5 rounded-2xl p-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-white/5" />
                </div>
              </div>
            ))
          ) : recent.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm italic">
              Sin negocios recientes registrados.
            </div>
          ) : recent.map(item => (
            <button
              key={item.id}
              onClick={() => item.tipo === 'cotizacion' ? navigate(`/cotizaciones?id=${item.id}`) : navigate('/pipeline')}
              className="w-full text-left glass bg-slate-900/50 border border-white/5 rounded-2xl p-4 hover:bg-slate-800/60 active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Nombre cliente — prominente */}
                  <p className="text-sm font-bold text-slate-100 truncate">{item.cliente}</p>
                  {/* Título de la oportunidad */}
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.titulo}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock size={9} className="text-slate-600" />
                    <span className="text-[10px] text-slate-600">{item.fecha}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Monto */}
                  <p className="text-sm font-black text-slate-200">
                    {formatMonto(item.montoRaw || 0, item.monedaOrigen || 'USD')}
                  </p>
                  {/* Badge estado */}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border ${estadoBadgeClass(item.estado)}`}>
                    {item.estado}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
