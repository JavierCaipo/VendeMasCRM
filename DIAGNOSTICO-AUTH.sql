-- ============================================
-- DIAGNÓSTICO COMPLETO DE AUTENTICACIÓN
-- ============================================
-- Este script diagnostica todos los problemas de autenticación

-- ============================================
-- 1. VERIFICAR USUARIOS EXISTENTES
-- ============================================

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data->>'full_name' as nombre,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ NO CONFIRMADO'
        ELSE '✅ CONFIRMADO'
    END as estado_confirmacion
FROM auth.users
ORDER BY created_at DESC;

-- ============================================
-- 2. VERIFICAR CONFIGURACIÓN DE RLS
-- ============================================

-- Ver qué tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ HABILITADO'
        ELSE '❌ DESHABILITADO'
    END as rls_estado
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename;

-- ============================================
-- 3. VERIFICAR POLÍTICAS RLS
-- ============================================

-- Contar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as total_politicas,
    COUNT(*) FILTER (WHERE 'authenticated' = ANY(roles)) as politicas_authenticated,
    COUNT(*) FILTER (WHERE 'anon' = ANY(roles)) as politicas_anon
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Ver todas las políticas en detalle
SELECT 
    tablename,
    policyname,
    cmd as operacion,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN 'Con condiciones USING'
        ELSE 'Sin condiciones USING'
    END as tiene_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Con condiciones CHECK'
        ELSE 'Sin condiciones CHECK'
    END as tiene_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 4. VERIFICAR FUNCIONES Y TRIGGERS
-- ============================================

-- Ver funciones relacionadas con presupuestos
SELECT 
    routine_name,
    routine_type,
    data_type as tipo_retorno
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%presupuesto%'
ORDER BY routine_name;

-- Ver triggers
SELECT 
    trigger_name,
    event_manipulation as evento,
    event_object_table as tabla,
    action_timing as momento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 5. VERIFICAR EXTENSIONES
-- ============================================

SELECT 
    extname as extension,
    extversion as version,
    CASE 
        WHEN extname = 'pgcrypto' THEN '✅ Necesaria para passwords'
        WHEN extname = 'uuid-ossp' THEN '✅ Necesaria para UUIDs'
        ELSE '✅ Instalada'
    END as descripcion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pgjwt')
ORDER BY extname;

-- ============================================
-- 6. PROBAR ACCESO A TABLAS
-- ============================================

-- Intentar contar registros en cada tabla
SELECT 'clientes' as tabla, COUNT(*) as registros FROM clientes
UNION ALL
SELECT 'oportunidades' as tabla, COUNT(*) as registros FROM oportunidades
UNION ALL
SELECT 'productos' as tabla, COUNT(*) as registros FROM productos
UNION ALL
SELECT 'presupuestos' as tabla, COUNT(*) as registros FROM presupuestos
UNION ALL
SELECT 'presupuesto_items' as tabla, COUNT(*) as registros FROM presupuesto_items
ORDER BY tabla;

-- ============================================
-- 7. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================

-- Ver columnas de la tabla clientes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clientes'
AND column_name IN ('id', 'user_id', 'nombre', 'email')
ORDER BY ordinal_position;

-- Ver columnas de la tabla presupuestos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'presupuestos'
AND column_name IN ('id', 'user_id', 'link_publico', 'estado')
ORDER BY ordinal_position;

-- ============================================
-- 8. RESUMEN DE DIAGNÓSTICO
-- ============================================

SELECT 
    '=== RESUMEN DE DIAGNÓSTICO ===' as titulo
UNION ALL
SELECT ''
UNION ALL
SELECT 'USUARIOS:' as titulo
UNION ALL
SELECT '  Total: ' || COUNT(*)::text FROM auth.users
UNION ALL
SELECT '  Confirmados: ' || COUNT(*)::text FROM auth.users WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT '  Sin confirmar: ' || COUNT(*)::text FROM auth.users WHERE email_confirmed_at IS NULL
UNION ALL
SELECT ''
UNION ALL
SELECT 'TABLAS CON RLS:' as titulo
UNION ALL
SELECT '  Total: ' || COUNT(*)::text 
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND c.relrowsecurity = true
AND t.tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
UNION ALL
SELECT ''
UNION ALL
SELECT 'POLÍTICAS RLS:' as titulo
UNION ALL
SELECT '  Total: ' || COUNT(*)::text FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT '  Para authenticated: ' || COUNT(*)::text 
FROM pg_policies 
WHERE schemaname = 'public' 
AND 'authenticated' = ANY(roles)
UNION ALL
SELECT '  Para anon: ' || COUNT(*)::text 
FROM pg_policies 
WHERE schemaname = 'public' 
AND 'anon' = ANY(roles);

-- ============================================
-- ✅ DIAGNÓSTICO COMPLETADO
-- ============================================
-- 
-- REVISA LOS RESULTADOS ARRIBA PARA IDENTIFICAR:
-- 
-- 1. ¿Existe el usuario admin@vendemas.com?
-- 2. ¿Está confirmado el email?
-- 3. ¿Todas las tablas tienen RLS habilitado?
-- 4. ¿Hay políticas para usuarios authenticated?
-- 5. ¿Las extensiones necesarias están instaladas?
-- 
-- Si algo falta, ejecuta CORREGIR-AUTH-PERMANENTE.sql
-- ============================================

