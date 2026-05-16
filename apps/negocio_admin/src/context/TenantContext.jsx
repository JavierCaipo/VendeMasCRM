// ============================================
// CERCO 1 — Tenant Context
// src/context/TenantContext.jsx
// ============================================
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import posthog from 'posthog-js'
import { supabase } from '../lib/supabaseClient'
import { toast } from 'sonner'

const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant,  setTenant]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Diccionarios cacheados
  const [agentes, setAgentes] = useState([])
  const [almacenes, setAlmacenes] = useState([])

  const fetchTenant = useCallback(async () => {
    setLoading(true)
    
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) {
      setError('No hay sesión activa')
      setLoading(false)
      return
    }

    const { data: dbUser, error: userErr } = await supabase
      .from('usuarios_negocio')
      .select('negocio_id')
      .eq('id', authData.user.id)
      .limit(1)
      .maybeSingle()

    if (userErr || !dbUser?.negocio_id) {
      setError('Usuario sin negocio asignado o error de lectura')
      setLoading(false)
      return
    }

    const { data: tenantData, error: tenantErr } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', dbUser.negocio_id)
      .limit(1)
      .maybeSingle()

    if (tenantErr) {
      console.error('Error fetching tenant:', tenantErr)
      setError(tenantErr.message)
      setLoading(false)
      return
    }
    
    setTenant(tenantData)
    
    // Identificar usuario en PostHog
    posthog.identify(authData.user.id, {
      email: authData.user.email,
      tenant_id: tenantData.id,
      plan: tenantData.plan
    });

    // Cargar diccionarios
    const [resAgentes, resAlmacenes] = await Promise.all([
      supabase.from('perfiles').select('*').eq('negocio_id', tenantData.id),
      supabase.from('almacenes').select('*').eq('negocio_id', tenantData.id)
    ])

    if (!resAgentes.error) setAgentes(resAgentes.data || [])
    if (!resAlmacenes.error) setAlmacenes(resAlmacenes.data || [])

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  // ESCUCHA ACTIVA (RADAR REALTIME)
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('cotizaciones-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cotizaciones',
          filter: `negocio_id=eq.${tenant.id}`
        },
        (payload) => {
          // Disparar solo si el cambio es hacia 'aceptada'
          if (payload.new.estado === 'aceptada' && payload.old.estado !== 'aceptada') {
            // Estímulo Auditivo (Gamificación)
            try {
              const audio = new Audio('/success.mp3');
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Autoplay bloqueado por el navegador'));
            } catch (error) {
              console.log('Error al reproducir sonido de éxito:', error);
            }

            toast.success(`¡Cotización Aprobada!`, {
              description: `La cotización ${payload.new.correlativo || 'N/A'} acaba de ser aceptada por el cliente.`,
              duration: 8000,
              icon: '🎉',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  if (loading) {
    return (
      <div className="bg-mesh min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Cargando contexto del negocio…</p>
        </div>
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="bg-mesh min-h-screen flex items-center justify-center p-6 text-center">
        <div className="glass p-8 rounded-2xl border-red-500/30 max-w-sm">
          <h2 className="text-red-400 font-semibold mb-2">Error de Acceso</h2>
          <p className="text-sm text-slate-300">
            {error || 'No se pudo cargar la información del negocio. Verifica que tengas permisos.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={{ tenant, refreshTenant: fetchTenant, agentes, almacenes }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant debe ser usado dentro de un TenantProvider')
  }
  return context
}
