import React from 'react'

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      <div className="relative flex flex-col items-center justify-center">
        {/* Glow effect */}
        <div className="absolute w-48 h-48 bg-indigo-500/20 rounded-full blur-[64px]" />
        <div className="absolute w-32 h-32 bg-purple-500/20 rounded-full blur-[48px]" />
        
        {/* Spinner minimalista */}
        <div className="relative w-12 h-12 mb-8">
          <div className="absolute inset-0 rounded-full border border-white/5" />
          <div className="absolute inset-0 rounded-full border border-t-indigo-400 border-r-indigo-400/50 border-b-transparent border-l-transparent animate-[spin_1.5s_linear_infinite]" />
        </div>

        {/* Text */}
        <p className="text-sm text-slate-400 tracking-[0.3em] uppercase font-light animate-pulse">
          INICIANDO ENTORNO SEGURO...
        </p>
      </div>
    </div>
  )
}
