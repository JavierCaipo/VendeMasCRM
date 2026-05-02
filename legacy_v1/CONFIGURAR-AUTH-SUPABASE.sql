-- ============================================
-- CONFIGURACIÓN DE AUTENTICACIÓN SUPABASE
-- ============================================
-- Este script configura Supabase para permitir registro sin confirmación de email
-- y crea un usuario de prueba

-- IMPORTANTE: Este script debe ejecutarse en Supabase SQL Editor
-- con privilegios de administrador

-- ============================================
-- PASO 1: Verificar configuración actual
-- ============================================

-- Ver usuarios existentes
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- PASO 2: Crear usuario de prueba (OPCIONAL)
-- ============================================
-- Si no puedes registrarte desde la UI, ejecuta esto:

-- NOTA: Reemplaza 'tu@email.com' y 'tupassword123' con tus datos

-- Primero, verifica si el usuario ya existe
DO $$
DECLARE
    test_email TEXT := 'admin@vendemas.com';
    test_password TEXT := 'Admin123456';
    user_exists BOOLEAN;
BEGIN
    -- Verificar si el usuario existe
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = test_email
    ) INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'El usuario % ya existe', test_email;
    ELSE
        -- Crear usuario de prueba
        -- NOTA: Esto requiere la extensión pgcrypto
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
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            test_email,
            crypt(test_password, gen_salt('bf')),
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
            ''
        );
        
        RAISE NOTICE 'Usuario creado: %', test_email;
        RAISE NOTICE 'Password: %', test_password;
    END IF;
END $$;

-- ============================================
-- PASO 3: Confirmar todos los usuarios existentes
-- ============================================
-- Si tienes usuarios sin confirmar, esto los confirma automáticamente

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ============================================
-- PASO 4: Verificar usuarios creados
-- ============================================

SELECT 
    id,
    email,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
        ELSE '❌ Sin confirmar'
    END as estado,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- INFORMACIÓN IMPORTANTE
-- ============================================

/*
CREDENCIALES DE PRUEBA CREADAS:
Email: admin@vendemas.com
Password: Admin123456

PASOS PARA USAR:
1. Ejecuta este script completo en Supabase SQL Editor
2. Ve a tu app: http://localhost:8000/app.html
3. Haz clic en "Iniciar Sesión"
4. Usa las credenciales de arriba
5. Deberías poder entrar sin problemas

SI AÚN NO FUNCIONA:
1. Ve a Supabase Dashboard > Authentication > Settings
2. Busca "Enable email confirmations"
3. DESACTÍVALO (toggle OFF)
4. Guarda los cambios
5. Intenta registrarte de nuevo desde la UI

PARA CREAR MÁS USUARIOS:
Puedes modificar las variables test_email y test_password
en el bloque DO $$ de arriba y ejecutar de nuevo.
*/

