import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { texto_crudo } = await req.json()

    if (!texto_crudo) {
      return new Response(JSON.stringify({ error: 'Texto crudo es requerido' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada en las variables de entorno.")
    }

    // Usaremos gemini-1.5-flash por su alta velocidad y bajo costo
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    
    const payload = {
      contents: [{
        parts: [{
          text: `Eres un asistente CRM experto. Analiza la siguiente transcripción de un comercial. Devuelve ÚNICAMENTE un JSON válido con esta estructura: { "resumen": "string (texto formal y directo en 2-3 líneas)", "sentimiento": "positivo | neutral | negativo", "next_steps": ["acción 1", "acción 2"] }. No incluyas markdown ni texto fuera del JSON.\n\nTranscripción:\n"${texto_crudo}"`
        }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Gemini API Error:", data)
      throw new Error(data.error?.message || "Error al llamar a Gemini")
    }

    const rawText = data.candidates[0].content.parts[0].text
    const structuredData = JSON.parse(rawText)

    return new Response(JSON.stringify(structuredData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error procesando dictado:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
