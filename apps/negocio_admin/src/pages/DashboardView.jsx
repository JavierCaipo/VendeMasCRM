// ============================================
// Dashboard Controller (Router) — VendeMas Business
// src/pages/DashboardView.jsx
// ============================================
import { useEffect } from 'react'
import useSWR from 'swr'
import { supabase } from '../lib/supabaseClient'
import { useTenant } from '../context/TenantContext'
import DashboardDesktop from './DashboardDesktop'
import DashboardMobile  from './DashboardMobile'

// ─────────────────────────────────────────────────────────────────
// SWR FETCHER — recibe la clave [key, tenantId] y devuelve datos crudos
// ─────────────────────────────────────────────────────────────────
async function fetchDashboardData([, tenantId]) {
  console.log('[SWR] Fetching dashboard for tenant:', tenantId)
  if (!tenantId) return null

  try {
    const hoy          = new Date()
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()

    // 1a. Cotizaciones del mes (Cierres Ganados + Ticket Promedio)
    const { data: cotsDelMes, error: cotError } = await supabase
      .from('cotizaciones')
      .select('id, estado, total, moneda, tipo_cambio, fecha_creacion, agente_id, correlativo, cliente_id, clientes(nombre_razon_social)')
      .eq('negocio_id', tenantId)
      .gte('fecha_creacion', primerDiaMes)
      .order('fecha_creacion', { ascending: false })

    if (cotError) throw cotError
    console.log('[SWR] cotsDelMes count:', cotsDelMes?.length)

    // 1b. Embudo activo (borrador/enviada sin filtro de fecha)
    const { data: cotsEmbudo } = await supabase
      .from('cotizaciones')
      .select('id, estado, total, moneda, tipo_cambio')
      .eq('negocio_id', tenantId)
      .in('estado', ['borrador', 'BORRADOR', 'enviada', 'ENVIADA'])
    console.log('[SWR] cotsEmbudo count:', cotsEmbudo?.length)

    // Motor multimoneda — sin TC del tenant aquí para no depender del closure
    const toUSD = (cot, tcFallback = 3.8) => {
      const monto = parseFloat(cot.total) || 0
      const tc    = parseFloat(cot.tipo_cambio) || tcFallback
      return (cot.moneda || 'USD') === 'USD' ? monto : monto / tc
    }

    const cots = cotsDelMes || []

    // KPI: Ganado y Ticket (mes)
    let totalGanado = 0
    cots.forEach(c => {
      if ((c.estado || '').toLowerCase() === 'aceptada') totalGanado += toUSD(c)
    })
    const ticketPromedio = cots.length > 0
      ? cots.reduce((acc, c) => acc + toUSD(c), 0) / cots.length
      : 0

    // KPI: Embudo
    let totalEmbudo  = 0
    let activasCount = 0
    cotsEmbudo?.forEach(c => { totalEmbudo += toUSD(c); activasCount++ })

    // 2. Cuota del usuario activo
    const { data: { user } } = await supabase.auth.getUser()
    let metaMensual          = 500000
    let alcanzada            = 0
    let cantidadCierres      = 0
    if (user) {
      const { data: userData } = await supabase
        .from('usuarios_negocio')
        .select('meta_ventas_mensual')
        .eq('id', user.id)
        .maybeSingle()
      metaMensual = userData?.meta_ventas_mensual || 500000

      cots.forEach(c => {
        if (c.agente_id === user.id && (c.estado || '').toLowerCase() === 'aceptada') {
          alcanzada += toUSD(c)
          cantidadCierres++
        }
      })
    }

    // 3. Oportunidades recientes
    const { data: ops } = await supabase
      .from('oportunidades')
      .select('id, titulo, valor_estimado, fecha_creacion, cliente:clientes(nombre_razon_social), etapa:pipeline_etapas(nombre)')
      .eq('negocio_id', tenantId)
      .order('fecha_creacion', { ascending: false })
      .limit(5)
    console.log('[SWR] ops recientes count:', ops?.length)

    // 4. Mapeo de listas recientes
    const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    const recentCots = cots.slice(0, 5).map(c => ({
      id: c.id,
      tipo: 'cotizacion',
      titulo: `Cotización #${c.correlativo || c.id.toString().slice(0, 6)}`,
      cliente: c.clientes?.nombre_razon_social || 'Cliente s/n',
      montoRaw: parseFloat(c.total) || 0,
      monedaOrigen: c.moneda || 'USD',
      fecha: new Date(c.fecha_creacion).toLocaleDateString('es-PE'),
      estado: (c.estado || 'borrador').charAt(0).toUpperCase() + (c.estado || 'borrador').slice(1)
    }))
    const opsMapped = (ops || []).slice(0, 5).map(op => ({
      id: op.id,
      tipo: 'oportunidad',
      titulo: op.titulo,
      cliente: op.cliente?.nombre_razon_social || 'Cliente s/n',
      montoRaw: parseFloat(op.valor_estimado) || 0,
      monedaOrigen: 'USD',
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
      alcanzada,
      cantidadCierres,
      negociosRecientes: recentCots.length > 0 ? recentCots : opsMapped,
      cotsActivasHoyCount: cots.filter(c => new Date(c.fecha_creacion).toDateString() === hoy.toDateString()).length,
      cotsGanadasMes: cots.filter(c => (c.estado || '').toLowerCase() === 'aceptada').length
    }
  } catch (err) {
    console.error('[SWR] Error al cargar Dashboard:', err)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────
// SYNC DE HUÉRFANOS — corre silenciosamente al montar
// ─────────────────────────────────────────────────────────────────
async function syncHuerfanos(tenantId) {
  if (!tenantId) return
  try {
    const { data: huerfanas } = await supabase
      .from('cotizaciones')
      .select('id, total, moneda, tipo_cambio, cliente_id, agente_id, correlativo, clientes(nombre_razon_social)')
      .eq('negocio_id', tenantId)
      .is('oportunidad_id', null)

    if (!huerfanas?.length) return

    const { data: etapas } = await supabase
      .from('pipeline_etapas')
      .select('id, nombre, orden')
      .eq('negocio_id', tenantId)
      .order('orden', { ascending: true })
      .limit(10)

    if (!etapas?.length) return
    const etapaInicio   = etapas[0]
    const etapaFin      = etapas[etapas.length - 1]
    const etapaPropuesta = etapas.find(e =>
      e.nombre.toLowerCase().includes('propuesta') || e.nombre.toLowerCase().includes('cotizaci')
    ) || etapaInicio

    for (const cot of huerfanas) {
      const etapaAsignada = (cot.estado || '').toLowerCase() === 'aceptada' ? etapaFin : etapaPropuesta
      const { data: newOp, error } = await supabase
        .from('oportunidades')
        .insert([{
          negocio_id: tenantId,
          cliente_id: cot.cliente_id,
          agente_id: cot.agente_id,
          etapa_id: etapaAsignada.id,
          titulo: `Cot. ${cot.correlativo || cot.id.slice(0, 6)} — ${cot.clientes?.nombre_razon_social || 'Cliente'}`,
          valor_estimado: parseFloat(cot.total) || 0,
          moneda: cot.moneda || 'USD',
          tipo_cambio: parseFloat(cot.tipo_cambio) || null
        }])
        .select('id')
        .single()

      if (!error && newOp) {
        await supabase.from('cotizaciones').update({ oportunidad_id: newOp.id }).eq('id', cot.id)
      }
    }
  } catch (err) {
    console.warn('[Sync Huérfanos] Error no crítico:', err.message)
  }
}

// ─────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL — actúa sólo como router/controlador
// ─────────────────────────────────────────────────────────────────
export default function DashboardView() {
  const { tenant } = useTenant()

  const { data, isLoading, mutate } = useSWR(
    tenant?.id ? ['dashboard', tenant.id] : null,
    fetchDashboardData,
    { revalidateOnFocus: false }
  )

  // Sync de huérfanos + suscripción Realtime
  useEffect(() => {
    if (!tenant?.id) return

    const init = async () => {
      await syncHuerfanos(tenant.id)
      mutate()
    }
    init()

    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'oportunidades', filter: `negocio_id=eq.${tenant.id}` },
        () => mutate()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenant?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── ROUTER ADAPTATIVO ──────────────────────────────────────────
  return (
    <>
      {/* Escritorio (xl+) */}
      <div className="hidden xl:block h-full overflow-y-auto custom-scrollbar">
        <DashboardDesktop data={data} isLoading={isLoading} />
      </div>

      {/* Móvil / Tablet (< xl) */}
      <div className="block xl:hidden h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <DashboardMobile data={data} isLoading={isLoading} />
      </div>
    </>
  )
}
