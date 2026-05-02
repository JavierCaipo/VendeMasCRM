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

    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN not configured')
    }

    // 1. Obtener configuración dinámica (Precio y Tipo de Cambio)
    const { data: config, error: configError } = await supabase
      .from('saas_config')
      .select('precio_mensual_usd, tipo_cambio_pen')
      .eq('id', 1)
      .single()

    if (configError || !config) {
      console.error('Error fetching saas_config:', configError)
      throw new Error('No se pudo obtener la configuración de precios.')
    }

    // 2. Cálculo seguro del precio en moneda local (PEN)
    // Envolvemos en Number() para que TypeScript no arroje errores de tipado
    const precio_usd = Number(config.precio_mensual_usd)
    const tipo_cambio = Number(config.tipo_cambio_pen)
    const precioFinalSoles = parseFloat((precio_usd * tipo_cambio).toFixed(2))

    console.log(`Iniciando suscripción: $${precio_usd} USD -> S/ ${precioFinalSoles} PEN`)

    // 3. Crear suscripción (Preapproval) en Mercado Pago
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: "Suscripción VendeMas PRO",
        external_reference: negocio_id,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: precioFinalSoles,
          currency_id: "PEN"
        },
        back_url: "https://vendemas.app/configuracion?pago=exito",
        status: "pending"
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Mercado Pago Subscription Error:', data)
      throw new Error(data.message || 'Error al generar la suscripción recurrente')
    }

    // Retornamos el init_point para la redirección
    return new Response(
      JSON.stringify({ init_point: data.sandbox_init_point || data.init_point }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})