// ============================================
// PLANTILLAS DE CORREO PREMIUM
// supabase/functions/send-transactional-email/templates.ts
// ============================================

const APP_URL = "https://vendemas-crm.vercel.app";

const baseLayout = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VendeMas CRM</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color: #111827; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                VendeMas <span style="color: #4F46E5;">CRM</span>
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} VendeMas CRM. Todos los derechos reservados.
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
                Tu plataforma de ventas inteligente.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export function getWelcomeProHtml(metadata: any): string {
  const negocioNombre = metadata?.negocio_nombre || "tu negocio";
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700;">¡Bienvenido a VendeMas PRO! 👑</h2>
    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
      Hola, <strong>${negocioNombre}</strong> ha dado el siguiente paso. Tu suscripción ha sido activada con éxito.
      Ahora tienes acceso a licencias ilimitadas, almacenamiento premium y el Smart Dashboard Gerencial.
    </p>
    <a href="${APP_URL}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
      Ir a mi panel de control
    </a>
    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px;">
      Si tienes alguna duda, nuestro equipo de soporte está listo para ayudarte.
    </p>
  `;
  return baseLayout(content);
}

export function getInviteUserHtml(metadata: any): string {
  const negocioNombre = metadata?.negocio_nombre || "VendeMas CRM";
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; font-weight: 700;">Te han invitado a VendeMas CRM 🤝</h2>
    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: left;">
      ¡Hola! Has sido invitado para unirte al equipo comercial de <strong>${negocioNombre}</strong>.
      Haz clic en el botón de abajo para configurar tu cuenta y empezar a cerrar ventas con la plataforma más inteligente del mercado.
    </p>
    <a href="${APP_URL}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
      Aceptar Invitación
    </a>
    <p style="margin: 30px 0 0 0; color: #9ca3af; font-size: 14px;">
      Este enlace te llevará directamente al portal de acceso.
    </p>
  `;
  return baseLayout(content);
}
