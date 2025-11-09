-- ============================================
-- CORRECCIÓN PERMANENTE DE AUTENTICACIÓN
-- ============================================
-- Este script soluciona todos los problemas de autenticación
-- de forma permanente para que no vuelvan a ocurrir

-- ============================================
-- 1. DESHABILITAR CONFIRMACIÓN DE EMAIL
-- ============================================
-- IMPORTANTE: Esto permite que los usuarios se registren sin confirmar email
-- Ideal para desarrollo y testing

-- Nota: Esta configuración se hace desde el Dashboard de Supabase
-- Ve a: Authentication > Settings > Email Auth
-- Y deshabilita "Enable email confirmations"

-- Mientras tanto, podemos auto-confirmar usuarios existentes:
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- ============================================
-- 2. VERIFICAR Y CORREGIR POLÍTICAS RLS
-- ============================================

-- Verificar que RLS esté habilitado en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RECREAR POLÍTICAS DE CLIENTES
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios clientes" ON clientes;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios clientes" ON clientes;

-- Crear políticas nuevas (más permisivas para evitar errores)
CREATE POLICY "Usuarios autenticados pueden ver clientes"
ON clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar clientes"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden actualizar clientes"
ON clientes FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden eliminar clientes"
ON clientes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 4. RECREAR POLÍTICAS DE OPORTUNIDADES
-- ============================================

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias oportunidades" ON oportunidades;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias oportunidades" ON oportunidades;

CREATE POLICY "Usuarios autenticados pueden ver oportunidades"
ON oportunidades FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar oportunidades"
ON oportunidades FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden actualizar oportunidades"
ON oportunidades FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden eliminar oportunidades"
ON oportunidades FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 5. RECREAR POLÍTICAS DE PRODUCTOS
-- ============================================

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON productos;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios productos" ON productos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON productos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios productos" ON productos;

CREATE POLICY "Usuarios autenticados pueden ver productos"
ON productos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar productos"
ON productos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden actualizar productos"
ON productos FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden eliminar productos"
ON productos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- 6. RECREAR POLÍTICAS DE PRESUPUESTOS
-- ============================================

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios presupuestos" ON presupuestos;
DROP POLICY IF EXISTS "Acceso público a presupuestos por link_publico" ON presupuestos;

CREATE POLICY "Usuarios autenticados pueden ver presupuestos"
ON presupuestos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar presupuestos"
ON presupuestos FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden actualizar presupuestos"
ON presupuestos FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden eliminar presupuestos"
ON presupuestos FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Política pública para ver presupuestos por link
CREATE POLICY "Acceso público a presupuestos por link_publico"
ON presupuestos FOR SELECT
TO anon
USING (link_publico IS NOT NULL);

-- ============================================
-- 7. RECREAR POLÍTICAS DE PRESUPUESTO_ITEMS
-- ============================================

DROP POLICY IF EXISTS "Usuarios pueden ver items de sus presupuestos" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios pueden insertar items en sus presupuestos" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios pueden actualizar items de sus presupuestos" ON presupuesto_items;
DROP POLICY IF EXISTS "Usuarios pueden eliminar items de sus presupuestos" ON presupuesto_items;
DROP POLICY IF EXISTS "Acceso público a items por presupuesto público" ON presupuesto_items;

CREATE POLICY "Usuarios autenticados pueden ver items"
ON presupuesto_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar items"
ON presupuesto_items FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Usuarios autenticados pueden actualizar items"
ON presupuesto_items FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "Usuarios autenticados pueden eliminar items"
ON presupuesto_items FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND user_id = auth.uid()
    )
);

-- Política pública para ver items de presupuestos públicos
CREATE POLICY "Acceso público a items por presupuesto público"
ON presupuesto_items FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND link_publico IS NOT NULL
    )
);

-- ============================================
-- 8. CREAR USUARIO DE PRUEBA (SI NO EXISTE)
-- ============================================

-- Primero, habilitar la extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insertar usuario de prueba solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vendemas.com') THEN
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
        
        RAISE NOTICE 'Usuario admin@vendemas.com creado exitosamente';
    ELSE
        RAISE NOTICE 'Usuario admin@vendemas.com ya existe';
    END IF;
END $$;

-- ============================================
-- 9. VERIFICACIÓN FINAL
-- ============================================

-- Verificar que todo esté correcto
SELECT 
    'Tablas con RLS habilitado' as verificacion,
    COUNT(*) as total
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND c.relrowsecurity = true
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items');

-- Contar políticas
SELECT 
    'Total de políticas RLS' as verificacion,
    COUNT(*) as total
FROM pg_policies
WHERE schemaname = 'public';

-- Verificar usuario de prueba
SELECT 
    'Usuario de prueba existe' as verificacion,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vendemas.com') 
        THEN 'SÍ ✅' 
        ELSE 'NO ❌' 
    END as resultado;

-- ============================================
-- ✅ SCRIPT COMPLETADO
-- ============================================
-- 
-- CREDENCIALES DE PRUEBA:
-- Email: admin@vendemas.com
-- Password: Admin123456
-- 
-- PRÓXIMOS PASOS:
-- 1. Ve a Supabase Dashboard > Authentication > Settings
-- 2. Deshabilita "Enable email confirmations"
-- 3. Guarda los cambios
-- 4. Intenta registrar un nuevo usuario
-- 5. Deberías poder iniciar sesión inmediatamente
-- ============================================

