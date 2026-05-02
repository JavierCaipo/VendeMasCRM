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
    console.log('Webhook received:', payload)

    const { type, action, data } = payload
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')

    // Procesar notificaciones de suscripciones (Preapproval)
    // El "type" puede venir como "subscription_preapproval" o similar según la versión de la API
    if (type === 'subscription_preapproval' || action?.includes('preapproval')) {
      const subscriptionId = data.id
      
      // 1. Verificación de Seguridad: Consultar directamente a Mercado Pago
      console.log(`Verificando suscripción ${subscriptionId}...`)
      
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      })

      if (!mpResponse.ok) {
        throw new Error('No se pudo verificar la suscripción con Mercado Pago')
      }

      const subscriptionData = await mpResponse.json()
      
      // 2. Validar estado y obtener negocio_id (external_reference)
      // Los estados comunes son: authorized, active
      if (subscriptionData.status === 'authorized' || subscriptionData.status === 'active') {
        const negocio_id = subscriptionData.external_reference
        
        console.log(`Suscripción aprobada para el negocio: ${negocio_id}. Actualizando a plan PRO...`)

        // 3. Actualizar la base de datos (Saltando RLS con Service Role)
        const { error: updateError } = await supabase
          .from('negocios')
          .update({ plan: 'pro' })
          .eq('id', negocio_id)

        if (updateError) {
          throw updateError
        }

        console.log(`Negocio ${negocio_id} actualizado exitosamente.`)
      }
    }

    // Responder 200 OK a Mercado Pago inmediatamente
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
