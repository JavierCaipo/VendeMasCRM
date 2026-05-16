// ============================================
// UI COMPONENT: EmptyState (Premium Design)
// src/components/common/EmptyState.jsx
// ============================================
import React from 'react'
import { Plus } from 'lucide-react'

export default function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/[0.01] border-2 border-dashed border-white/10 rounded-[2.5rem] text-center animate-in fade-in zoom-in-95 duration-500">
      
      {/* Icon Container */}
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-inner">
        {Icon ? (
          <Icon className="w-10 h-10 text-indigo-400/80" />
        ) : (
          <div className="w-10 h-10 bg-slate-800 rounded-full animate-pulse" />
        )}
      </div>

      {/* Text Content */}
      <div className="max-w-sm space-y-2 mb-8">
        <h3 className="text-xl font-bold text-slate-100 tracking-tight">
          {title || 'No hay datos disponibles'}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          {description || 'Empieza a interactuar con la plataforma añadiendo tu primer registro.'}
        </p>
      </div>

      {/* Action Button */}
      {onAction && (
        <button
          onClick={onAction}
          className="group relative overflow-hidden px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
          {actionLabel || 'Añadir Registro'}
        </button>
      )}
      
    </div>
  )
}
