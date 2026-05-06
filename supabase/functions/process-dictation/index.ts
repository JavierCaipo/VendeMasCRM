import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de seguridad CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { texto_crudo } = await req.json()
    if (!texto_crudo) throw new Error('No se recibió texto para analizar')

    const API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!API_KEY) throw new Error('Configuración incompleta: GEMINI_API_KEY no encontrada')

    // System Prompt alineado con nuestra lógica de Negocio Premium
    const prompt = `Eres un asistente CRM experto para TresApps. Analiza la siguiente transcripción de un comercial. 
    Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura: 
    { 
      "resumen": "string (texto formal y directo en 2-3 líneas)", 
      "sentimiento": "positivo | neutral | negativo", 
      "next_steps": ["acción 1", "acción 2"] 
    }. 
    No incluyas markdown ni texto explicativo.`

    // Endpoint a Gemini 1.5 Flash (Balance perfecto entre velocidad y costo)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nTranscripción: "${texto_crudo}"` }] }],
        generationConfig: { temperature: 0.1 } // Mantenemos la IA "enfocada" y poco creativa
      })
    })

    if (!response.ok) throw new Error(`Error API Gemini: ${response.statusText}`)

    const data = await response.json()
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Limpieza de formato (por si la IA ignora las instrucciones y manda ```json)
    textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim()
    
    const parsedJson = JSON.parse(textResult)

    return new Response(JSON.stringify(parsedJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error en Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})