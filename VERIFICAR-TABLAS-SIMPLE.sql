-- ============================================
-- VERIFICACIÓN SIMPLE DE TABLAS
-- ============================================
-- Este script solo verifica que las tablas se crearon correctamente
-- NO inserta datos de prueba (eso lo harás desde la app)

-- ============================================
-- 1. Verificar que las tablas existen
-- ============================================

SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('productos', 'presupuestos', 'presupuesto_items') THEN '✅'
        ELSE '❌'
    END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY table_name;

-- Deberías ver:
-- presupuesto_items | ✅
-- presupuestos      | ✅
-- productos         | ✅

-- ============================================
-- 2. Contar columnas de cada tabla
-- ============================================

SELECT 
    table_name,
    COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('productos', 'presupuestos', 'presupuesto_items')
GROUP BY table_name
ORDER BY table_name;

-- Deberías ver:
-- presupuesto_items | 11
-- presupuestos      | 20
-- productos         | 20

-- ============================================
-- 3. Verificar índices
-- ============================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename, indexname;

-- Deberías ver 13 índices en total

-- ============================================
-- 4. Verificar políticas RLS
-- ============================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Con condición'
        ELSE 'Sin condición'
    END as tipo
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename, policyname;

-- Deberías ver 14 políticas en total

-- ============================================
-- 5. Verificar funciones
-- ============================================

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_productos_updated_at',
    'update_presupuestos_updated_at',
    'generar_numero_presupuesto',
    'actualizar_presupuestos_vencidos',
    'recalcular_totales_presupuesto'
)
ORDER BY routine_name;

-- Deberías ver 5 funciones

-- ============================================
-- 6. Verificar triggers
-- ============================================

SELECT 
    event_object_table as tabla,
    trigger_name,
    event_manipulation as evento,
    action_timing as momento
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY event_object_table, trigger_name;

-- Deberías ver 4 triggers

-- ============================================
-- 7. Verificar que RLS está habilitado
-- ============================================

SELECT 
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename;

-- Deberías ver 't' (true) en todas las tablas

-- ============================================
-- 8. Resumen final
-- ============================================

SELECT 
    '✅ VERIFICACIÓN COMPLETA' as resultado,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name IN ('productos', 'presupuestos', 'presupuesto_items')) as tablas_creadas,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name IN ('productos', 'presupuestos', 'presupuesto_items')) as columnas_totales,
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' 
     AND tablename IN ('productos', 'presupuestos', 'presupuesto_items')) as politicas_rls,
    (SELECT COUNT(*) FROM information_schema.routines 
     WHERE routine_schema = 'public' 
     AND routine_name IN (
        'update_productos_updated_at',
        'update_presupuestos_updated_at',
        'generar_numero_presupuesto',
        'actualizar_presupuestos_vencidos',
        'recalcular_totales_presupuesto'
     )) as funciones,
    (SELECT COUNT(*) FROM information_schema.triggers 
     WHERE event_object_schema = 'public' 
     AND event_object_table IN ('productos', 'presupuestos', 'presupuesto_items')) as triggers;

-- Deberías ver:
-- tablas_creadas: 3
-- columnas_totales: 51
-- politicas_rls: 14
-- funciones: 5
-- triggers: 4

-- ============================================
-- ✅ SI TODOS LOS NÚMEROS COINCIDEN, ¡TODO ESTÁ BIEN!
-- ============================================

/*
SIGUIENTE PASO:
1. Si esta verificación pasó ✅, las tablas están listas
2. Ahora ejecuta: CONFIGURAR-AUTH-SUPABASE.sql
3. Luego podrás iniciar sesión con:
   Email: admin@vendemas.com
   Password: Admin123456
4. Desde la app podrás crear productos y presupuestos
*/

