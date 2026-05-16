import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { negocio_id, email } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!negocio_id || !email) {
      throw new Error('negocio_id y email son requeridos')
    }

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured')
    }

    // 1. Obtener configuración dinámica de precio (tabla global gestionada por SuperAdmin)
    const { data: config, error: configError } = await supabase
      .from('saas_config')
      .select('precio_mensual_usd, tipo_cambio_pen')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      console.error('Error fetching saas_config:', configError)
      throw new Error('No se pudo obtener la configuración de precios.')
    }

    // 2. Obtener tipo de cambio específico del tenant (si tiene uno personalizado)
    //    Fallback al tipo de cambio global de saas_config
    const { data: negocio } = await supabase
      .from('negocios')
      .select('tipo_cambio_usd_pen, nombre')
      .eq('id', negocio_id)
      .single()

    const precio_usd   = Number(config.precio_mensual_usd)
    // Prioridad: tipo de cambio del tenant → tipo de cambio global de saas_config
    const tipo_cambio  = Number(negocio?.tipo_cambio_usd_pen ?? config.tipo_cambio_pen)
    const montoLocal   = parseFloat((precio_usd * tipo_cambio).toFixed(2))

    console.log(`[mp-checkout] Negocio: ${negocio?.nombre} (${negocio_id})`)
    console.log(`[mp-checkout] Precio: $${precio_usd} USD × ${tipo_cambio} = S/ ${montoLocal} PEN`)

    // 3. Determinar back_url base dinámicamente (env var → fallback a header Origin)
    const appUrl = Deno.env.get('APP_URL')
      ?? req.headers.get('origin')
      ?? 'https://vendemas-crm.vercel.app'
    const backUrlBase = appUrl.replace(/\/$/, '') // quitar trailing slash

    // 4. Crear suscripción recurrente (Preapproval) en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason:             "Suscripción VendeMas PRO",
        external_reference: negocio_id,
        payer_email:        email,
        auto_recurring: {
          frequency:          1,
          frequency_type:     "months",
          transaction_amount: montoLocal,
          currency_id:        "PEN"
        },
        back_urls: {
          success: `${backUrlBase}/configuracion?pago=exito`,
          failure: `${backUrlBase}/configuracion?pago=error`,
          pending: `${backUrlBase}/configuracion?pago=pendiente`,
        },
        status: "pending"
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[mp-checkout] MercadoPago error:', data)
      const mpErrorMsg = data.message || data.error || (data.cause && data.cause[0]?.description) || 'Error desconocido en Mercado Pago'
      throw new Error(`MercadoPago: ${mpErrorMsg}`)
    }

    // FIX #1: init_point de producción tiene prioridad — sandbox_init_point solo como fallback de dev
    const initPoint = data.init_point || data.sandbox_init_point
    console.log(`[mp-checkout] Redirigiendo a: ${initPoint}`)

    return new Response(
      JSON.stringify({ init_point: initPoint }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('[mp-checkout] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})