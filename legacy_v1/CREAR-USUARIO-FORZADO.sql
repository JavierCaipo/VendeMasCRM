-- ============================================
-- CREAR USUARIO FORZADO (GARANTIZADO)
-- ============================================
-- Este script GARANTIZA que el usuario se cree correctamente
-- Ejecuta este script COMPLETO de una sola vez

-- PASO 1: Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASO 2: Eliminar usuario si existe (en TODAS las tablas)
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar el UUID del usuario
    SELECT id INTO user_uuid FROM auth.users WHERE email = 'admin@vendemas.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Eliminar de todas las tablas relacionadas
        DELETE FROM presupuesto_items WHERE presupuesto_id IN (SELECT id FROM presupuestos WHERE user_id = user_uuid);
        DELETE FROM presupuestos WHERE user_id = user_uuid;
        DELETE FROM productos WHERE user_id = user_uuid;
        DELETE FROM oportunidades WHERE user_id = user_uuid;
        DELETE FROM clientes WHERE user_id = user_uuid;
        
        -- Eliminar de auth.users
        DELETE FROM auth.users WHERE id = user_uuid;
        
        RAISE NOTICE '✅ Usuario anterior eliminado';
    ELSE
        RAISE NOTICE 'ℹ️ No había usuario anterior';
    END IF;
END $$;

-- PASO 3: Crear usuario NUEVO con UUID específico
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    encrypted_pw TEXT;
BEGIN
    -- Generar password encriptado
    encrypted_pw := crypt('Admin123456', gen_salt('bf'));
    
    -- Insertar usuario
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token,
        is_super_admin,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@vendemas.com',
        encrypted_pw,
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Administrador"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        false,
        NULL,
        NULL,
        '',
        '',
        '',
        0,
        NULL,
        '',
        NULL,
        false,
        NULL
    );
    
    -- Insertar en auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        new_user_id,
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', 'admin@vendemas.com'
        ),
        'email',
        NOW(),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Usuario creado con ID: %', new_user_id;
END $$;

-- PASO 4: Verificar que se creó correctamente
SELECT 
    '✅ USUARIO CREADO EXITOSAMENTE' as resultado,
    '' as detalle
UNION ALL
SELECT 
    'Email:' as resultado,
    email as detalle
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'ID:' as resultado,
    id::text as detalle
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'Email confirmado:' as resultado,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ SÍ - ' || email_confirmed_at::text
        ELSE '❌ NO - ERROR!'
    END as detalle
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'Password:' as resultado,
    'Admin123456' as detalle
UNION ALL
SELECT 
    '' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '🎯 CREDENCIALES:' as resultado,
    '' as detalle
UNION ALL
SELECT 
    'Email:' as resultado,
    'admin@vendemas.com' as detalle
UNION ALL
SELECT 
    'Password:' as resultado,
    'Admin123456' as detalle
UNION ALL
SELECT 
    '' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '📝 PRÓXIMOS PASOS:' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '1.' as resultado,
    'Ve a Authentication > Settings' as detalle
UNION ALL
SELECT 
    '2.' as resultado,
    'Deshabilita "Enable email confirmations"' as detalle
UNION ALL
SELECT 
    '3.' as resultado,
    'Guarda los cambios' as detalle
UNION ALL
SELECT 
    '4.' as resultado,
    'Recarga la app (Cmd+Shift+R)' as detalle
UNION ALL
SELECT 
    '5.' as resultado,
    'Inicia sesión con las credenciales de arriba' as detalle;

-- ============================================
-- ✅ LISTO! Usuario creado y verificado
-- ============================================

