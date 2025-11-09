-- ============================================
-- VERIFICAR CREACIÓN DE TABLAS
-- ============================================
-- Ejecuta esto DESPUÉS de crear las tablas

-- 1. Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY table_name;

-- Deberías ver 3 filas:
-- presupuesto_items
-- presupuestos
-- productos

-- 2. Verificar columnas de productos
SELECT COUNT(*) as total_columnas_productos
FROM information_schema.columns
WHERE table_name = 'productos';

-- Deberías ver: 20 columnas

-- 3. Verificar columnas de presupuestos
SELECT COUNT(*) as total_columnas_presupuestos
FROM information_schema.columns
WHERE table_name = 'presupuestos';

-- Deberías ver: 20 columnas

-- 4. Verificar columnas de presupuesto_items
SELECT COUNT(*) as total_columnas_items
FROM information_schema.columns
WHERE table_name = 'presupuesto_items';

-- Deberías ver: 11 columnas

-- 5. Verificar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY tablename, cmd;

-- Deberías ver:
-- productos: 4 políticas (SELECT, INSERT, UPDATE, DELETE)
-- presupuestos: 5 políticas (SELECT x2, INSERT, UPDATE, DELETE)
-- presupuesto_items: 5 políticas (SELECT x2, INSERT, UPDATE, DELETE)

-- 6. Verificar funciones
SELECT routine_name
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

-- 7. Verificar triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('productos', 'presupuestos', 'presupuesto_items')
ORDER BY event_object_table, trigger_name;

-- Deberías ver:
-- trigger_update_productos_updated_at (productos)
-- trigger_update_presupuestos_updated_at (presupuestos)
-- trigger_generar_numero_presupuesto (presupuestos)
-- trigger_recalcular_after_item_change (presupuesto_items)

-- 8. Probar inserción de producto
-- NOTA: Reemplaza 'TU_USER_ID' con tu user_id real de auth.users
-- Para obtenerlo, ejecuta: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Obtener el primer user_id disponible
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No hay usuarios en auth.users. Crea un usuario primero.';
    ELSE
        -- Insertar producto de prueba
        INSERT INTO productos (
            user_id,
            nombre,
            descripcion,
            categoria,
            sku,
            precio,
            stock_disponible,
            estado
        ) VALUES (
            test_user_id,
            'Producto de Prueba',
            'Este es un producto de prueba',
            'Electrónica',
            'PROD-001',
            99.99,
            10,
            'activo'
        );

        RAISE NOTICE 'Producto de prueba creado exitosamente';
    END IF;
END $$;

-- 9. Verificar que se insertó
SELECT id, nombre, sku, precio, stock_disponible, estado, user_id
FROM productos
WHERE nombre = 'Producto de Prueba';

-- 10. Probar creación de presupuesto (el número se genera automáticamente)
DO $$
DECLARE
    test_user_id UUID;
    test_cliente_id UUID;
BEGIN
    -- Obtener el primer user_id disponible
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    -- Obtener el primer cliente disponible
    SELECT id INTO test_cliente_id FROM clientes LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No hay usuarios en auth.users. Crea un usuario primero.';
    ELSIF test_cliente_id IS NULL THEN
        RAISE NOTICE 'No hay clientes. Crea un cliente primero desde la app.';
    ELSE
        -- Insertar presupuesto de prueba
        INSERT INTO presupuestos (
            user_id,
            cliente_id,
            fecha_emision,
            fecha_vencimiento,
            estado
        ) VALUES (
            test_user_id,
            test_cliente_id,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            'pendiente'
        );

        RAISE NOTICE 'Presupuesto de prueba creado exitosamente';
    END IF;
END $$;

-- 11. Verificar que se creó con número automático
SELECT id, numero, fecha_emision, fecha_vencimiento, estado, link_publico
FROM presupuestos
WHERE estado = 'pendiente'
ORDER BY created_at DESC
LIMIT 1;

-- Deberías ver algo como: PRES-2025-001

-- 12. Limpiar datos de prueba (OPCIONAL - Descomenta si quieres limpiar)
-- DELETE FROM productos WHERE nombre = 'Producto de Prueba';
-- DELETE FROM presupuestos WHERE numero LIKE 'PRES-%';

-- ============================================
-- ✅ SI TODO FUNCIONA, ESTÁS LISTO PARA CONTINUAR
-- ============================================

