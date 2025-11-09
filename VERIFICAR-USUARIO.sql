-- ============================================
-- VERIFICAR SI EL USUARIO EXISTE
-- ============================================
-- Ejecuta este script para verificar el estado del usuario

-- 1. Ver si existe el usuario admin@vendemas.com
SELECT 
    '=== VERIFICACIÓN DE USUARIO ===' as titulo,
    '' as valor
UNION ALL
SELECT 
    'Email:' as titulo,
    email as valor
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'ID:' as titulo,
    id::text as valor
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'Email confirmado:' as titulo,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ SÍ - ' || email_confirmed_at::text
        ELSE '❌ NO'
    END as valor
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'Último login:' as titulo,
    COALESCE(last_sign_in_at::text, 'Nunca') as valor
FROM auth.users 
WHERE email = 'admin@vendemas.com'
UNION ALL
SELECT 
    'Creado:' as titulo,
    created_at::text as valor
FROM auth.users 
WHERE email = 'admin@vendemas.com';

-- 2. Ver TODOS los usuarios
SELECT 
    '' as separador,
    '' as valor1,
    '' as valor2,
    '' as valor3
UNION ALL
SELECT 
    '=== TODOS LOS USUARIOS ===' as separador,
    '' as valor1,
    '' as valor2,
    '' as valor3
UNION ALL
SELECT 
    email as separador,
    CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '❌ No confirmado' END as valor1,
    created_at::text as valor2,
    COALESCE(last_sign_in_at::text, 'Nunca') as valor3
FROM auth.users
ORDER BY created_at DESC;

-- 3. Verificar políticas RLS
SELECT 
    '' as separador,
    '' as valor1,
    '' as valor2
UNION ALL
SELECT 
    '=== POLÍTICAS RLS ===' as separador,
    '' as valor1,
    '' as valor2
UNION ALL
SELECT 
    tablename as separador,
    policyname as valor1,
    cmd::text as valor2
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar RLS habilitado
SELECT 
    '' as separador,
    '' as valor1
UNION ALL
SELECT 
    '=== RLS HABILITADO ===' as separador,
    '' as valor1
UNION ALL
SELECT 
    tablename as separador,
    CASE WHEN c.relrowsecurity THEN '✅ Habilitado' ELSE '❌ Deshabilitado' END as valor1
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Si el usuario existe, deberías ver:
-- Email: admin@vendemas.com
-- Email confirmado: ✅ SÍ
-- 
-- Si NO existe, ejecuta FIX-AUTH-SIMPLE.sql
-- ============================================

