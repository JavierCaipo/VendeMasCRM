// ============================================
// Settings Page — Placeholder
// src/pages/Settings.jsx
// ============================================
import { Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon size={22} className="text-slate-400" />
          Configuraciones
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Ajustes globales del sistema</p>
      </div>
      <div className="glass rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
        <SettingsIcon size={48} className="text-slate-600 mb-4" />
        <p className="text-slate-400 text-sm">Módulo en desarrollo.</p>
        <p className="text-slate-500 text-xs mt-1">Próxima iteración.</p>
      </div>
    </div>
  )
}
