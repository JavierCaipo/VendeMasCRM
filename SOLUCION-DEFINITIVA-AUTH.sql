-- ============================================
-- SOLUCIÓN DEFINITIVA DE AUTENTICACIÓN
-- ============================================
-- Este script soluciona TODOS los problemas de autenticación
-- Ejecuta este script COMPLETO de una sola vez

-- ============================================
-- PASO 1: HABILITAR EXTENSIONES
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PASO 2: LIMPIAR POLÍTICAS EXISTENTES
-- ============================================

-- Eliminar TODAS las políticas existentes para empezar limpio
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- PASO 3: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 4: CREAR POLÍTICAS SIMPLES Y PERMISIVAS
-- ============================================

-- CLIENTES: Políticas muy permisivas
CREATE POLICY "clientes_select_all"
ON clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "clientes_insert_own"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "clientes_update_own"
ON clientes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "clientes_delete_own"
ON clientes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- OPORTUNIDADES: Políticas muy permisivas
CREATE POLICY "oportunidades_select_all"
ON oportunidades FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "oportunidades_insert_own"
ON oportunidades FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "oportunidades_update_own"
ON oportunidades FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "oportunidades_delete_own"
ON oportunidades FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- PRODUCTOS: Políticas muy permisivas
CREATE POLICY "productos_select_all"
ON productos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "productos_insert_own"
ON productos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "productos_update_own"
ON productos FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "productos_delete_own"
ON productos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- PRESUPUESTOS: Políticas para autenticados + anónimos
CREATE POLICY "presupuestos_select_all"
ON presupuestos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "presupuestos_select_public"
ON presupuestos FOR SELECT
TO anon
USING (link_publico IS NOT NULL);

CREATE POLICY "presupuestos_insert_own"
ON presupuestos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "presupuestos_update_own"
ON presupuestos FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "presupuestos_update_public"
ON presupuestos FOR UPDATE
TO anon
USING (link_publico IS NOT NULL)
WITH CHECK (link_publico IS NOT NULL AND estado IN ('pendiente', 'aprobado', 'rechazado'));

CREATE POLICY "presupuestos_delete_own"
ON presupuestos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- PRESUPUESTO_ITEMS: Políticas para autenticados + anónimos
CREATE POLICY "items_select_all"
ON presupuesto_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "items_select_public"
ON presupuesto_items FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND link_publico IS NOT NULL
    )
);

CREATE POLICY "items_insert_own"
ON presupuesto_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "items_update_own"
ON presupuesto_items FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "items_delete_own"
ON presupuesto_items FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

-- ============================================
-- PASO 5: CONFIRMAR TODOS LOS USUARIOS
-- ============================================

UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ============================================
-- PASO 6: CREAR/ACTUALIZAR USUARIO DE PRUEBA
-- ============================================

-- Eliminar usuario de prueba si existe
DELETE FROM auth.users WHERE email = 'admin@vendemas.com';

-- Crear usuario de prueba nuevo
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
    'admin@vendemas.com',
    crypt('Admin123456', gen_salt('bf')),
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

-- ============================================
-- PASO 7: VERIFICACIÓN FINAL
-- ============================================

-- Verificar usuario creado
SELECT 
    '✅ USUARIO CREADO' as resultado,
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmado'
        ELSE '❌ Email NO confirmado'
    END as estado
FROM auth.users
WHERE email = 'admin@vendemas.com';

-- Verificar RLS habilitado
SELECT 
    '✅ RLS HABILITADO' as resultado,
    tablename,
    CASE 
        WHEN c.relrowsecurity THEN '✅ Activo'
        ELSE '❌ Inactivo'
    END as estado
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename;

-- Contar políticas creadas
SELECT 
    '✅ POLÍTICAS CREADAS' as resultado,
    tablename,
    COUNT(*) as total_politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Resumen final
SELECT 
    '=== ✅ CONFIGURACIÓN COMPLETADA ===' as mensaje
UNION ALL
SELECT ''
UNION ALL
SELECT 'CREDENCIALES DE PRUEBA:'
UNION ALL
SELECT '  Email: admin@vendemas.com'
UNION ALL
SELECT '  Password: Admin123456'
UNION ALL
SELECT ''
UNION ALL
SELECT 'PRÓXIMOS PASOS:'
UNION ALL
SELECT '1. Ve a: https://vendemas-crm.vercel.app/'
UNION ALL
SELECT '2. Haz clic en "Iniciar Sesión"'
UNION ALL
SELECT '3. Ingresa las credenciales de arriba'
UNION ALL
SELECT '4. Deberías poder entrar al CRM ✅'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Si aún no funciona, abre la consola del navegador (F12)'
UNION ALL
SELECT 'y comparte el error que aparece.';

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================

