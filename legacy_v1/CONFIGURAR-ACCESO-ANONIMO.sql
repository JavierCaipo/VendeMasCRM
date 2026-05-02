-- ============================================
-- CONFIGURACIÓN DE ACCESO ANÓNIMO
-- ============================================
-- Este script configura el acceso anónimo para pruebas
-- y para que funcione la página pública de presupuestos

-- ============================================
-- 1. HABILITAR ACCESO ANÓNIMO A PRESUPUESTOS
-- ============================================

-- Eliminar política pública existente si existe
DROP POLICY IF EXISTS "Acceso público a presupuestos por link_publico" ON presupuestos;

-- Crear política para acceso anónimo (usuarios no autenticados)
CREATE POLICY "Acceso público a presupuestos por link_publico"
ON presupuestos FOR SELECT
TO anon, authenticated
USING (link_publico IS NOT NULL);

-- Permitir actualizar estado desde página pública (aprobar/rechazar)
DROP POLICY IF EXISTS "Actualizar estado de presupuesto público" ON presupuestos;

CREATE POLICY "Actualizar estado de presupuesto público"
ON presupuestos FOR UPDATE
TO anon, authenticated
USING (link_publico IS NOT NULL)
WITH CHECK (
    link_publico IS NOT NULL 
    AND estado IN ('pendiente', 'aprobado', 'rechazado')
);

-- ============================================
-- 2. HABILITAR ACCESO ANÓNIMO A ITEMS
-- ============================================

-- Eliminar política pública existente si existe
DROP POLICY IF EXISTS "Acceso público a items por presupuesto público" ON presupuesto_items;

-- Crear política para ver items de presupuestos públicos
CREATE POLICY "Acceso público a items por presupuesto público"
ON presupuesto_items FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE id = presupuesto_items.presupuesto_id 
        AND link_publico IS NOT NULL
    )
);

-- ============================================
-- 3. HABILITAR ACCESO ANÓNIMO A CLIENTES (SOLO LECTURA)
-- ============================================

-- Permitir ver información básica de clientes en presupuestos públicos
DROP POLICY IF EXISTS "Acceso público a clientes en presupuestos" ON clientes;

CREATE POLICY "Acceso público a clientes en presupuestos"
ON clientes FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM presupuestos 
        WHERE presupuestos.cliente_id = clientes.id 
        AND presupuestos.link_publico IS NOT NULL
    )
);

-- ============================================
-- 4. CONFIGURACIÓN PARA PRUEBAS (OPCIONAL)
-- ============================================

-- Si quieres permitir acceso anónimo TOTAL para pruebas
-- (SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN)

-- DESCOMENTAR ESTAS LÍNEAS SOLO PARA PRUEBAS:

-- DROP POLICY IF EXISTS "Acceso anónimo a productos para pruebas" ON productos;
-- CREATE POLICY "Acceso anónimo a productos para pruebas"
-- ON productos FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- DROP POLICY IF EXISTS "Acceso anónimo a clientes para pruebas" ON clientes;
-- CREATE POLICY "Acceso anónimo a clientes para pruebas"
-- ON clientes FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- DROP POLICY IF EXISTS "Acceso anónimo a oportunidades para pruebas" ON oportunidades;
-- CREATE POLICY "Acceso anónimo a oportunidades para pruebas"
-- ON oportunidades FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- ============================================
-- 5. VERIFICAR CONFIGURACIÓN
-- ============================================

-- Ver todas las políticas para usuarios anónimos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operacion,
    qual as condicion_using,
    with_check as condicion_check
FROM pg_policies
WHERE schemaname = 'public'
AND 'anon' = ANY(roles)
ORDER BY tablename, policyname;

-- Contar políticas anónimas por tabla
SELECT 
    tablename,
    COUNT(*) as politicas_anonimas
FROM pg_policies
WHERE schemaname = 'public'
AND 'anon' = ANY(roles)
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- 6. PROBAR ACCESO ANÓNIMO
-- ============================================

-- Simular acceso anónimo a un presupuesto público
-- NOTA: Estas queries están comentadas. Descoméntalas y reemplaza 'UUID_DEL_LINK'
-- con un link_publico real de un presupuesto que hayas creado.

-- Ver presupuesto por link público
-- SELECT
--     id,
--     numero,
--     cliente_id,
--     estado,
--     total,
--     link_publico
-- FROM presupuestos
-- WHERE link_publico = 'UUID_DEL_LINK';  -- Reemplaza con un UUID real

-- Ver items del presupuesto
-- SELECT
--     pi.id,
--     pi.descripcion,
--     pi.cantidad,
--     pi.precio_unitario,
--     pi.subtotal
-- FROM presupuesto_items pi
-- JOIN presupuestos p ON p.id = pi.presupuesto_id
-- WHERE p.link_publico = 'UUID_DEL_LINK';  -- Reemplaza con un UUID real

-- ============================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- ============================================

-- RESUMEN DE POLÍTICAS ANÓNIMAS:
-- 
-- presupuestos:
--   ✅ SELECT - Ver presupuestos con link_publico
--   ✅ UPDATE - Actualizar estado (aprobar/rechazar)
-- 
-- presupuesto_items:
--   ✅ SELECT - Ver items de presupuestos públicos
-- 
-- clientes:
--   ✅ SELECT - Ver info de clientes en presupuestos públicos
-- 
-- PRÓXIMOS PASOS:
-- 1. Crear un presupuesto desde la app
-- 2. Copiar el link público
-- 3. Abrir el link en ventana privada (sin autenticación)
-- 4. Verificar que puedes ver el presupuesto
-- 5. Aprobar o rechazar el presupuesto
-- 6. Verificar que el estado se actualiza
-- ============================================

