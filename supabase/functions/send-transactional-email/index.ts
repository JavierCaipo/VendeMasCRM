import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { getWelcomeProHtml, getInviteUserHtml } from "./templates.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Handler principal ───────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const { to, subject, type, metadata } = await req.json()

    if (!to || !type) {
      throw new Error('Campos requeridos: to, type')
    }

    // Seleccionar plantilla según tipo
    let htmlBody: string
    let emailSubject = subject

    switch (type) {
      case 'welcome_pro':
        htmlBody = getWelcomeProHtml(metadata)
        emailSubject = emailSubject || '👑 ¡Bienvenido a VendeMas PRO!'
        break

      case 'invite_user':
        htmlBody = getInviteUserHtml(metadata)
        emailSubject = emailSubject || `🤝 Te han invitado a ${metadata?.negocio_nombre || 'VendeMas CRM'}`
        break

      default:
        throw new Error(`Tipo de email no soportado: ${type}`)
    }

    console.log(`[send-email] Enviando '${type}' a ${to}...`)

    // Enviar vía Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VendeMas CRM <noreply@vendemas.app>',
        to: [to],
        subject: emailSubject,
        html: htmlBody,
      })
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('[send-email] Resend error:', resendData)
      throw new Error(resendData.message || 'Error al enviar correo via Resend')
    }

    console.log(`[send-email] ✅ Correo '${type}' enviado a ${to} — ID: ${resendData.id}`)

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: any) {
    console.error('[send-email] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
