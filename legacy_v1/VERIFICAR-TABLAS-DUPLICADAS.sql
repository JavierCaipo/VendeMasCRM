-- ============================================
-- VERIFICAR TABLAS Y ESQUEMAS DUPLICADOS
-- ============================================

-- 1. Ver todas las tablas en el esquema public
SELECT 
    '=== TABLAS EN ESQUEMA PUBLIC ===' as info,
    '' as tabla,
    '' as columnas
UNION ALL
SELECT 
    '' as info,
    tablename as tabla,
    COUNT(column_name)::text || ' columnas' as columnas
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON c.table_name = t.tablename AND c.table_schema = t.table_schema
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
GROUP BY tablename
ORDER BY tablename;

-- 2. Ver si hay tablas duplicadas en diferentes esquemas
SELECT 
    '' as separador,
    '' as esquema,
    '' as tabla
UNION ALL
SELECT 
    '=== TABLAS EN TODOS LOS ESQUEMAS ===' as separador,
    '' as esquema,
    '' as tabla
UNION ALL
SELECT 
    '' as separador,
    table_schema as esquema,
    tablename as tabla
FROM pg_tables
WHERE tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename, table_schema;

-- 3. Ver columnas de la tabla clientes
SELECT 
    '' as separador,
    '' as columna,
    '' as tipo
UNION ALL
SELECT 
    '=== COLUMNAS DE CLIENTES ===' as separador,
    '' as columna,
    '' as tipo
UNION ALL
SELECT 
    '' as separador,
    column_name as columna,
    data_type as tipo
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'clientes'
ORDER BY ordinal_position;

-- 4. Ver índices
SELECT 
    '' as separador,
    '' as tabla,
    '' as indice
UNION ALL
SELECT 
    '=== ÍNDICES ===' as separador,
    '' as tabla,
    '' as indice
UNION ALL
SELECT 
    '' as separador,
    tablename as tabla,
    indexname as indice
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('clientes', 'oportunidades', 'productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename, indexname;

-- 5. Ver triggers
SELECT 
    '' as separador,
    '' as tabla,
    '' as trigger
UNION ALL
SELECT 
    '=== TRIGGERS ===' as separador,
    '' as tabla,
    '' as trigger
UNION ALL
SELECT 
    '' as separador,
    event_object_table as tabla,
    trigger_name as trigger
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 6. Verificar si hay conflictos de políticas
SELECT 
    '' as separador,
    '' as tabla,
    '' as politicas
UNION ALL
SELECT 
    '=== CONTEO DE POLÍTICAS POR TABLA ===' as separador,
    '' as tabla,
    '' as politicas
UNION ALL
SELECT 
    '' as separador,
    tablename as tabla,
    COUNT(*)::text as politicas
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 7. Ver políticas duplicadas (mismo nombre en misma tabla)
SELECT 
    '' as separador,
    '' as tabla,
    '' as politica,
    '' as veces
UNION ALL
SELECT 
    '=== POLÍTICAS DUPLICADAS ===' as separador,
    '' as tabla,
    '' as politica,
    '' as veces
UNION ALL
SELECT 
    '' as separador,
    tablename as tabla,
    policyname as politica,
    COUNT(*)::text as veces
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- ============================================
-- RESULTADO:
-- ============================================
-- Si ves políticas duplicadas o tablas en múltiples esquemas,
-- eso puede estar causando el problema.
-- ============================================

