-- ============================================
-- SOLUCIÓN SIMPLE Y RÁPIDA DE AUTENTICACIÓN
-- ============================================
-- Copia y pega TODO este script en Supabase SQL Editor
-- Haz clic en RUN y espera 10 segundos
-- ============================================

-- PASO 1: Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASO 2: Deshabilitar RLS temporalmente para limpiar
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS oportunidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS presupuestos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS presupuesto_items DISABLE ROW LEVEL SECURITY;

-- PASO 3: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "clientes_select_all" ON clientes;
DROP POLICY IF EXISTS "clientes_insert_own" ON clientes;
DROP POLICY IF EXISTS "clientes_update_own" ON clientes;
DROP POLICY IF EXISTS "clientes_delete_own" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar clientes" ON clientes;
DROP POLICY IF EXISTS "Acceso público a clientes en presupuestos" ON clientes;

DROP POLICY IF EXISTS "oportunidades_select_all" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_insert_own" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_update_own" ON oportunidades;
DROP POLICY IF EXISTS "oportunidades_delete_own" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar oportunidades" ON oportunidades;

DROP POLICY IF EXISTS "productos_select_all" ON productos;
DROP POLICY IF EXISTS "productos_insert_own" ON productos;
DROP POLICY IF EXISTS "productos_update_own" ON productos;
DROP POLICY IF EXISTS "productos_delete_own" ON productos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver productos" ON productos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar productos" ON productos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar productos" ON productos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar productos" ON productos;

DROP POLICY IF EXISTS "presupuestos_select_all" ON presupuestos;
DROP POLICY IF EXISTS "presupuestos_select_public" ON presupuestos;
DROP POLICY IF EXISTS "presupuestos_insert_own" ON presupuestos;
DROP POLICY IF EXISTS "presupuestos_update_own" ON presupuestos;
DROP POLICY IF EXISTS "presupuestos_update_public" ON presupuestos;
DROP POLICY IF EXISTS "presupuestos_delete_own" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Acceso público a presupuestos por link_publico" ON presupuestos;
DROP POLICY IF EXISTS "Actualizar estado de presupuesto público" ON presupuestos;

DROP POLICY IF EXISTS "items_select_all" ON presupuesto_items;
DROP POLICY IF EXISTS "items_select_public" ON presupuesto_items;
DROP POLICY IF EXISTS "items_insert_own" ON presupuesto_items;
DROP POLICY IF EXISTS "items_update_own" ON presupuesto_items;
DROP POLICY IF EXISTS "items_delete_own" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver items" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar items" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar items" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar items" ON presupuesto_items;
DROP POLICY IF EXISTS "Acceso público a items por presupuesto público" ON presupuesto_items;

-- PASO 4: Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;

-- PASO 5: Crear políticas MUY PERMISIVAS (para que funcione sin problemas)

-- CLIENTES
CREATE POLICY "clientes_all" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clientes_public" ON clientes FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM presupuestos WHERE presupuestos.cliente_id = clientes.id AND presupuestos.link_publico IS NOT NULL)
);

-- OPORTUNIDADES
CREATE POLICY "oportunidades_all" ON oportunidades FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PRODUCTOS
CREATE POLICY "productos_all" ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PRESUPUESTOS
CREATE POLICY "presupuestos_all" ON presupuestos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "presupuestos_public_select" ON presupuestos FOR SELECT TO anon USING (link_publico IS NOT NULL);
CREATE POLICY "presupuestos_public_update" ON presupuestos FOR UPDATE TO anon 
    USING (link_publico IS NOT NULL) 
    WITH CHECK (link_publico IS NOT NULL AND estado IN ('pendiente', 'aprobado', 'rechazado'));

-- PRESUPUESTO_ITEMS
CREATE POLICY "items_all" ON presupuesto_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "items_public_select" ON presupuesto_items FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM presupuestos WHERE id = presupuesto_items.presupuesto_id AND link_publico IS NOT NULL)
);

-- PASO 6: Confirmar TODOS los usuarios existentes
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- PASO 7: Eliminar usuario de prueba anterior (si existe)
DELETE FROM auth.users WHERE email = 'admin@vendemas.com';

-- PASO 8: Crear usuario de prueba NUEVO
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

-- PASO 9: Verificación
SELECT 
    '✅ SCRIPT COMPLETADO EXITOSAMENTE' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '👤 Usuario creado:' as resultado,
    'admin@vendemas.com' as detalle
UNION ALL
SELECT 
    '🔑 Contraseña:' as resultado,
    'Admin123456' as detalle
UNION ALL
SELECT 
    '📊 Políticas creadas:' as resultado,
    COUNT(*)::text as detalle
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
    '🔒 Tablas con RLS:' as resultado,
    COUNT(*)::text as detalle
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND c.relrowsecurity = true
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
UNION ALL
SELECT 
    '' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '🎯 PRÓXIMOS PASOS:' as resultado,
    '' as detalle
UNION ALL
SELECT 
    '1️⃣' as resultado,
    'Ve a Authentication > Settings en Supabase' as detalle
UNION ALL
SELECT 
    '2️⃣' as resultado,
    'Deshabilita "Enable email confirmations"' as detalle
UNION ALL
SELECT 
    '3️⃣' as resultado,
    'Guarda los cambios' as detalle
UNION ALL
SELECT 
    '4️⃣' as resultado,
    'Ve a https://vendemas-crm.vercel.app/' as detalle
UNION ALL
SELECT 
    '5️⃣' as resultado,
    'Inicia sesión con admin@vendemas.com / Admin123456' as detalle;

-- ============================================
-- ✅ LISTO! Ahora sigue los pasos de arriba
-- ============================================

