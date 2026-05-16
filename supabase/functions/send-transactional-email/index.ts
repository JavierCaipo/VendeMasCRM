import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Plantillas HTML ─────────────────────────────────────────────────────────

function getWelcomeProTemplate(negocioNombre: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a VendeMas PRO</title>
</head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0B0F19;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#111827;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          
          <!-- Header Gradient Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#6366f1);"></td>
          </tr>

          <!-- Logo & Badge -->
          <tr>
            <td style="padding:40px 40px 20px 40px;text-align:center;">
              <div style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);border-radius:16px;padding:16px;margin-bottom:20px;">
                <span style="font-size:32px;">👑</span>
              </div>
              <h1 style="color:#f1f5f9;font-size:28px;font-weight:900;margin:0 0 8px 0;letter-spacing:-0.5px;">
                ¡Bienvenido a VendeMas PRO!
              </h1>
              <p style="color:#94a3b8;font-size:14px;margin:0;font-weight:500;">
                ${negocioNombre ? negocioNombre + ' ahora tiene' : 'Ahora tienes'} acceso completo
              </p>
            </td>
          </tr>

          <!-- Features Grid -->
          <tr>
            <td style="padding:0 40px 30px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:12px 16px;background:rgba(99,102,241,0.08);border-radius:12px;border:1px solid rgba(99,102,241,0.15);margin-bottom:8px;">
                    <p style="color:#818cf8;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px 0;">LO QUE ACABAS DE DESBLOQUEAR</p>
                  </td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">
                ${[
                  ['👥', 'Usuarios Ilimitados', 'Invita a todo tu equipo comercial sin restricciones.'],
                  ['📊', 'Dashboard Gerencial', 'Métricas de rendimiento por vendedor y equipo.'],
                  ['📦', 'Cargas Masivas CSV', 'Importa tu catálogo completo en segundos.'],
                  ['🏷️', 'Marca Blanca', 'Tu logo y branding en el portal de clientes.'],
                  ['💾', '10 GB de Almacenamiento', 'Hasta 20 MB por archivo PDF.'],
                  ['🛡️', 'Soporte Prioritario 24/7', 'Respuesta garantizada en menos de 2 horas.'],
                ].map(([icon, title, desc]) => `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width:36px;vertical-align:top;font-size:18px;">${icon}</td>
                          <td>
                            <p style="color:#e2e8f0;font-size:14px;font-weight:700;margin:0;">${title}</p>
                            <p style="color:#64748b;font-size:12px;margin:2px 0 0 0;">${desc}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 30px 40px;text-align:center;">
              <a href="https://vendemas-crm.vercel.app" 
                 style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 32px;border-radius:12px;font-size:13px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1.5px;">
                Ir a mi Dashboard PRO →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">
                VendeMas CRM · Tu plataforma de ventas inteligente
              </p>
              <p style="color:#334155;font-size:10px;margin:6px 0 0 0;">
                Si tienes dudas, responde a este correo o escríbenos por WhatsApp.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function getInviteUserTemplate(negocioNombre: string, inviterEmail: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0B0F19;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#111827;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <tr><td style="height:4px;background:linear-gradient(90deg,#10b981,#06b6d4,#10b981);"></td></tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="display:inline-block;background:rgba(16,185,129,0.15);border-radius:16px;padding:16px;margin-bottom:20px;">
                <span style="font-size:32px;">🤝</span>
              </div>
              <h1 style="color:#f1f5f9;font-size:24px;font-weight:900;margin:0 0 12px 0;">
                ¡Te han invitado a ${negocioNombre || 'un equipo'}!
              </h1>
              <p style="color:#94a3b8;font-size:14px;margin:0 0 24px 0;">
                ${inviterEmail || 'Un administrador'} te ha añadido como miembro del equipo comercial.
              </p>
              <a href="https://vendemas-crm.vercel.app" 
                 style="display:inline-block;background:#10b981;color:#ffffff;padding:14px 32px;border-radius:12px;font-size:13px;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:1.5px;">
                Acceder a mi cuenta →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
              <p style="color:#475569;font-size:11px;margin:0;">VendeMas CRM · Tu plataforma de ventas inteligente</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
        htmlBody = getWelcomeProTemplate(metadata?.negocio_nombre || '')
        emailSubject = emailSubject || '👑 ¡Bienvenido a VendeMas PRO!'
        break

      case 'invite_user':
        htmlBody = getInviteUserTemplate(
          metadata?.negocio_nombre || '',
          metadata?.inviter_email || ''
        )
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
