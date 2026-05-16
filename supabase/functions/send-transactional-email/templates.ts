export function getWelcomeProHtml(metadata: any): string {
  const negocioNombre = metadata?.negocio_nombre || "tu negocio";
  const content = `
    <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
      ¡Bienvenido a la élite, ${negocioNombre}! 👑
    </h2>
    <p style="margin: 0 0 30px 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
      Tu actualización a <strong>VendeMas PRO</strong> ha sido procesada con éxito. Tu cuenta ya está potenciada con las herramientas gerenciales de alto rendimiento.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px;">
      <tr>
        <td style="padding: 20px; text-align: left;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px; font-weight: 600;">Ya tienes acceso desbloqueado a:</p>
          <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">✓ <strong>Equipo Ilimitado:</strong> Invita a todos tus comerciales.</p>
          <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">✓ <strong>Visión Gerencial:</strong> Smart Dashboard con métricas de equipo.</p>
          <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">✓ <strong>Operaciones Masivas:</strong> Importación CSV y 10GB de Storage.</p>
          <p style="margin: 0; color: #4b5563; font-size: 14px;">✓ <strong>Portal Cliente B2B:</strong> Descarga de fichas y certificados premium.</p>
        </td>
      </tr>
    </table>

    <a href="${APP_URL}" style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 16px 36px; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
      Entrar a mi Panel PRO
    </a>
  `;
  return baseLayout(content);
}

export function getInviteUserHtml(metadata: any): string {
  const negocioNombre = metadata?.negocio_nombre || "VendeMas CRM";
  const content = `
    <div style="background-color: #eef2ff; width: 64px; height: 64px; border-radius: 32px; margin: 0 auto 20px auto; display: table;">
      <span style="display: table-cell; vertical-align: middle; font-size: 28px;">🤝</span>
    </div>
    <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 24px; font-weight: 700;">Tienes una invitación de ${negocioNombre}</h2>
    <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center;">
      Has sido seleccionado para unirte al equipo comercial en nuestra plataforma. Configura tu cuenta para acceder a tu pipeline y empezar a gestionar tus cotizaciones.
    </p>
    <a href="${APP_URL}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 16px 36px; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none;">
      Aceptar Invitación
    </a>
  `;
  return baseLayout(content);
}