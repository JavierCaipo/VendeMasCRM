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
    const { negocio_id } = await req.json()
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN not configured')

    console.log(`Iniciando cancelación para negocio: ${negocio_id}`)

    // 1. Buscar la suscripción autorizada en Mercado Pago
    // Endpoint: https://www.mercadopago.com.pe/developers/es/reference/subscriptions/_preapproval_search/get
    const searchUrl = `https://api.mercadopago.com/preapproval/search?external_reference=${negocio_id}&status=authorized`
    const searchResponse = await fetch(searchUrl, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    })

    const searchData = await searchResponse.json()
    
    if (!searchResponse.ok || !searchData.results || searchData.results.length === 0) {
      // Si no hay autorizadas, buscamos 'active'
      const activeSearchUrl = `https://api.mercadopago.com/preapproval/search?external_reference=${negocio_id}&status=active`
      const activeResponse = await fetch(activeSearchUrl, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      })
      const activeData = await activeResponse.json()
      
      if (!activeResponse.ok || !activeData.results || activeData.results.length === 0) {
        throw new Error('No se encontró una suscripción activa para cancelar.')
      }
      
      searchData.results = activeData.results
    }

    const subscriptionId = searchData.results[0].id
    console.log(`Suscripción encontrada: ${subscriptionId}. Procediendo a cancelar...`)

    // 2. Cancelar la suscripción en Mercado Pago
    // Endpoint: https://www.mercadopago.com.pe/developers/es/reference/subscriptions/_preapproval_id/put
    const cancelResponse = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: "cancelled" })
    })

    const cancelData = await cancelResponse.json()

    if (!cancelResponse.ok) {
      throw new Error(cancelData.message || 'Error al cancelar en Mercado Pago')
    }

    // 3. Actualizar la base de datos (Plan -> free)
    const { error: updateError } = await supabase
      .from('negocios')
      .update({ plan: 'free' })
      .eq('id', negocio_id)

    if (updateError) throw updateError

    console.log(`Cancelación exitosa para el negocio ${negocio_id}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Cancelation Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
