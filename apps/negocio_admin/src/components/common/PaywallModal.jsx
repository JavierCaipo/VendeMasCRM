import React, { useState, useEffect } from 'react';
import { Crown, Check, X, ShieldCheck, Sparkles, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useTenant } from '../../context/TenantContext';

export default function PaywallModal({ isOpen, onClose, reason }) {
  const { tenant } = useTenant();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [config, setConfig] = useState({ precio_mensual_usd: 29.00, tipo_cambio_pen: 3.80 });
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      setIsLoadingConfig(true);
      try {
        const { data, error } = await supabase
          .from('saas_config')
          .select('*')
          .eq('id', 1)
          .single();

        if (data) setConfig(data);
      } catch (err) {
        console.error("Error loading config:", err);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    if (isOpen) fetchConfig();
  }, [isOpen]);

  if (!isOpen) return null;

  const precioFinalSoles = (config.precio_mensual_usd * config.tipo_cambio_pen).toFixed(2);

  const handleUpgrade = async () => {
    setIsCheckoutLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Error de sesión: No se encontró el usuario activo.");
        return;
      }

      console.log("Iniciando checkout para:", tenant.id);

      // By-pass temporal para forzar la llamada a la función local en tu Mac
      const response = await fetch('http://127.0.0.1:54321/functions/v1/mp-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          negocio_id: tenant.id,
          email: user.email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al conectar con el servidor local");
      }

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error("Respuesta inválida de la pasarela local.");
      }

    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error al conectar con Mercado Pago: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#0B0F19] border border-slate-700 shadow-2xl rounded-3xl w-full max-w-lg relative overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-600/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/10 blur-[100px] rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8 md:p-10 flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6">
            <Crown size={32} className="text-white" />
          </div>

          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">VendeMas PRO</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 px-4">
            {reason || "Potencia tu negocio con las herramientas exclusivas de nuestra versión profesional."}
          </p>

          {/* Pricing Card */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left relative group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Plan Mensual</p>
                <h3 className="text-3xl font-black text-white">
                  {isLoadingConfig ? '---' : `US$ ${config.precio_mensual_usd}`}
                  <span className="text-sm font-medium text-slate-500"> / mes</span>
                </h3>
              </div>
              <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Ahorro Anual 20%</span>
              </div>
            </div>

            <ul className="space-y-3">
              <BenefitItem text="Marca Blanca Total (Tu Logo en todo)" />
              <BenefitItem text="PDFs Luxury & Enterprise" />
              <BenefitItem text="WhatsApp Anti-Spam (25+ variantes)" />
              <BenefitItem text="Almacenamiento Ampliado (Sin límites de 2MB)" />
              <BenefitItem text="Soporte Prioritario 24/7" />
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={isCheckoutLoading || isLoadingConfig}
            className="w-full h-14 rounded-2xl bg-white text-slate-950 font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckoutLoading ? (
              <Loader2 size={18} className="animate-spin text-indigo-600" />
            ) : (
              <Zap size={18} fill="currentColor" />
            )}
            {isCheckoutLoading ? 'Generando suscripción segura...' : 'Actualizar con Mercado Pago'}
          </button>

          <p className="mt-4 text-[10px] text-slate-500 font-medium max-w-[280px] mx-auto leading-relaxed">
            El cobro se procesará en tu moneda local (aprox. <span className="text-slate-300">S/ {precioFinalSoles} PEN</span>) según nuestro tipo de cambio actual. Tu banco realizará la conversión.
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({ text }) {
  return (
    <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
      <div className="bg-emerald-500/20 p-0.5 rounded-full">
        <Check size={14} className="text-emerald-400" />
      </div>
      {text}
    </li>
  );
}
