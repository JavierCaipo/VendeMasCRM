// ============================================
// Dashboard — Vista de bienvenida SuperAdmin
// src/pages/Dashboard.jsx
// ============================================
import { useEffect, useState } from 'react'
import {
  Building2, Users, TrendingUp, Activity,
  ArrowUpRight, LayoutDashboard,
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

function StatCard({ icon: Icon, label, value, color, trend }) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5 flex flex-col gap-3 hover:border-white/20 transition-all group">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={19} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value ?? '—'}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, activos: 0, suspendidos: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('negocios')
        .select('estado')
      if (data) {
        setStats({
          total:       data.length,
          activos:     data.filter(n => n.estado === 'activo').length,
          suspendidos: data.filter(n => n.estado === 'suspendido').length,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <LayoutDashboard size={22} className="text-indigo-400" />
          Dashboard
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Vista general del ecosistema SaaS</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2}   label="Total Negocios"  value={stats.total}       color="bg-indigo-500/20 text-indigo-400"  trend="+2 este mes" />
        <StatCard icon={Activity}    label="Activos"         value={stats.activos}     color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={TrendingUp}  label="Suspendidos"     value={stats.suspendidos} color="bg-rose-500/20 text-rose-400" />
        <StatCard icon={Users}       label="Usuarios Totales" value="—"               color="bg-purple-500/20 text-purple-400"  trend="Próximamente" />
      </div>

      {/* Welcome message */}
      <div className="glass rounded-2xl border border-indigo-500/20 p-6">
        <h3 className="text-base font-semibold text-slate-100 mb-1">
          🚀 Panel de Control SuperAdmin
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Desde aquí puedes gestionar todos los negocios del ecosistema VendeMas. Usa el menú lateral
          para navegar entre <strong className="text-slate-200">Negocios</strong> y{' '}
          <strong className="text-slate-200">Configuraciones</strong>.
        </p>
      </div>
    </div>
  )
}
