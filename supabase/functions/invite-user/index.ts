import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, nombre_completo, rol, negocio_id, nombre_negocio } = await req.json()


    // 1. Validaciones básicas
    if (!email || !rol || !negocio_id) {
      throw new Error('Faltan datos requeridos (email, rol, negocio_id)')
    }

    // 2. Inicializar Supabase con Llave Maestra (Service Role Key)
    // Esto es crucial para saltarnos las políticas de seguridad (RLS) y poder invitar
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 3. Invitar al usuario forzando la redirección y enviando variables personalizadas
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { 
        nombre_completo: nombre_completo, 
        rol: rol, 
        negocio_id: negocio_id,
        nombre_negocio: nombre_negocio // <-- Nueva variable para el correo
      },
      // Forzamos que el link mágico lleve a producción, sin importar la configuración global
      redirectTo: 'https://vendemas-crm.vercel.app/actualizar-password' 
    })

    if (authError) throw new Error(`Error de Supabase Auth: ${authError.message}`)

    const userId = authData.user.id

    // 4. Registrar al nuevo usuario en la tabla puente usuarios_negocio
    const { error: dbError } = await supabase
      .from('usuarios_negocio')
      .insert({
        id: userId,
        negocio_id: negocio_id,
        email: email,
        nombre_completo: nombre_completo,
        rol: rol,
        estado: 'activo'
      })

    if (dbError) {
      // ── ROLLBACK: eliminar el usuario zombie de Auth para evitar cuentas huérfanas ──
      await supabase.auth.admin.deleteUser(userId)
      throw new Error(`Error al vincular con el negocio: ${dbError.message}. El usuario de Auth fue eliminado. Por favor intenta de nuevo.`)
    }

    // 5. Éxito absoluto
    return new Response(
      JSON.stringify({ success: true, message: 'Invitación enviada con éxito' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error("Error en invite-user:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})