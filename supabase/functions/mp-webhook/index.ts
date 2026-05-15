import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    console.log('[mp-webhook] Payload recibido:', JSON.stringify(payload))

    const { type, action, data } = payload
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured')
    }

    // MercadoPago envía notificaciones de suscripciones con type = 'subscription_preapproval'
    // o action que incluye 'preapproval' (variantes según versión de API)
    if (type === 'subscription_preapproval' || action?.includes('preapproval')) {
      const subscriptionId = data?.id

      if (!subscriptionId) {
        console.warn('[mp-webhook] Notificación sin subscription ID — ignorando')
        // Devolvemos 200 para que MP no reintente
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // 1. Verificación de Seguridad: consultar directamente a MP (no confiar en el payload)
      console.log(`[mp-webhook] Verificando suscripción ${subscriptionId} con MP...`)
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })

      if (!mpResponse.ok) {
        throw new Error(`No se pudo verificar la suscripción ${subscriptionId} con MercadoPago`)
      }

      const sub = await mpResponse.json()
      const negocio_id = sub.external_reference
      const status     = sub.status           // authorized | active | cancelled | paused | pending

      console.log(`[mp-webhook] Suscripción ${subscriptionId} — status: ${status} — negocio: ${negocio_id}`)

      if (!negocio_id) {
        console.error('[mp-webhook] external_reference vacío — no se puede identificar el tenant')
        // 200 para que MP no reintente; el error es de configuración en el checkout
        return new Response(JSON.stringify({ received: true, warning: 'missing external_reference' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // 2. Bifurcación según estado de la suscripción

      if (status === 'authorized' || status === 'active') {
        // ── Suscripción ACTIVA ─────────────────────────────────────────────
        console.log(`[mp-webhook] Activando PRO para negocio ${negocio_id}...`)
        const { error: updateError } = await supabase
          .from('negocios')
          .update({
            plan:                'pro',
            estado_suscripcion:  'activa',
          })
          .eq('id', negocio_id)

        if (updateError) throw updateError
        console.log(`[mp-webhook] ✅ Negocio ${negocio_id} → plan PRO activo`)

      } else if (status === 'cancelled' || status === 'paused') {
        // ── Suscripción CANCELADA o PAUSADA (ej: fallo de cobro recurrente) ──
        //    FIX #2: revertir a starter para no dejar acceso PRO vencido
        console.log(`[mp-webhook] Suscripción ${status} — revirtiendo a Starter para negocio ${negocio_id}...`)
        const { error: updateError } = await supabase
          .from('negocios')
          .update({
            plan:                'starter',
            estado_suscripcion:  'vencida',
          })
          .eq('id', negocio_id)

        if (updateError) throw updateError
        console.log(`[mp-webhook] ⬇️ Negocio ${negocio_id} → plan Starter (suscripción ${status})`)

      } else {
        // Estados intermedios: pending, in_process, etc. — no modificamos el plan
        console.log(`[mp-webhook] Status intermedio '${status}' — sin acción para negocio ${negocio_id}`)
      }
    } else {
      // Tipo de notificación que no manejamos (pagos individuales, reclamos, etc.)
      console.log(`[mp-webhook] Tipo '${type}' / action '${action}' no manejado — ignorando`)
    }

    // Responder 200 OK a MercadoPago SIEMPRE (MP reintenta si recibe 4xx/5xx)
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('[mp-webhook] Error:', error.message)
    // IMPORTANTE: devolver 200 aunque haya error interno para evitar retries infinitos de MP
    // El error queda logueado en Supabase Edge Function logs
    return new Response(
      JSON.stringify({ received: true, internal_error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  }
})
