-- ============================================
-- SISTEMA DE PRODUCTOS Y PRESUPUESTOS
-- ============================================
-- Ejecuta este script en Supabase SQL Editor

-- ============================================
-- 1. TABLA PRODUCTOS
-- ============================================

CREATE TABLE IF NOT EXISTS productos (
    -- IDs y Referencias
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Información Básica
    nombre TEXT NOT NULL,
    descripcion TEXT,
    categoria TEXT,
    sku TEXT,
    codigo_barras TEXT,
    
    -- Unidades y Stock
    unidad TEXT DEFAULT 'unidad', -- kg, litro, unidad, caja, etc.
    stock_disponible DECIMAL(12, 2) DEFAULT 0,
    stock_minimo DECIMAL(12, 2) DEFAULT 0,
    
    -- Precios
    precio DECIMAL(12, 2) DEFAULT 0,
    costo DECIMAL(12, 2) DEFAULT 0,
    moneda TEXT DEFAULT 'PEN',
    
    -- Proveedor
    proveedor TEXT,
    codigo_proveedor TEXT,
    
    -- Multimedia
    imagen_url TEXT,
    
    -- Estado
    estado TEXT DEFAULT 'activo', -- activo, inactivo, descontinuado
    
    -- Notas
    notas TEXT,
    tags TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para productos
CREATE INDEX IF NOT EXISTS idx_productos_user_id ON productos(user_id);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre);

-- RLS para productos
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own productos" ON productos;
CREATE POLICY "Users can view own productos"
    ON productos FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own productos" ON productos;
CREATE POLICY "Users can insert own productos"
    ON productos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own productos" ON productos;
CREATE POLICY "Users can update own productos"
    ON productos FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own productos" ON productos;
CREATE POLICY "Users can delete own productos"
    ON productos FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 2. TABLA PRESUPUESTOS
-- ============================================

CREATE TABLE IF NOT EXISTS presupuestos (
    -- IDs y Referencias
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    
    -- Numeración
    numero TEXT NOT NULL UNIQUE, -- PRES-2024-001
    
    -- Fechas
    fecha_emision DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    
    -- Estado
    estado TEXT DEFAULT 'pendiente', -- pendiente, aprobado, rechazado, vencido
    
    -- Montos
    subtotal DECIMAL(12, 2) DEFAULT 0,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(12, 2) DEFAULT 0,
    impuesto_porcentaje DECIMAL(5, 2) DEFAULT 18, -- IGV 18%
    impuesto_monto DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    moneda TEXT DEFAULT 'PEN',
    
    -- Información Adicional
    notas TEXT,
    terminos_condiciones TEXT,
    
    -- Link Público
    link_publico UUID DEFAULT uuid_generate_v4() UNIQUE,
    
    -- Motivo de Rechazo
    motivo_rechazo TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para presupuestos
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente_id ON presupuestos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_numero ON presupuestos(numero);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_link_publico ON presupuestos(link_publico);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha_vencimiento ON presupuestos(fecha_vencimiento);

-- RLS para presupuestos
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own presupuestos" ON presupuestos;
CREATE POLICY "Users can view own presupuestos"
    ON presupuestos FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own presupuestos" ON presupuestos;
CREATE POLICY "Users can insert own presupuestos"
    ON presupuestos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own presupuestos" ON presupuestos;
CREATE POLICY "Users can update own presupuestos"
    ON presupuestos FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own presupuestos" ON presupuestos;
CREATE POLICY "Users can delete own presupuestos"
    ON presupuestos FOR DELETE
    USING (auth.uid() = user_id);

-- Política especial para vista pública (solo lectura por link)
DROP POLICY IF EXISTS "Anyone can view presupuesto by public link" ON presupuestos;
CREATE POLICY "Anyone can view presupuesto by public link"
    ON presupuestos FOR SELECT
    USING (true); -- Permitir lectura pública, validaremos por link_publico en la app

-- ============================================
-- 3. TABLA PRESUPUESTO_ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS presupuesto_items (
    -- IDs y Referencias
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    
    -- Información del Item
    descripcion TEXT NOT NULL,
    cantidad DECIMAL(12, 2) DEFAULT 1,
    unidad TEXT DEFAULT 'unidad',
    precio_unitario DECIMAL(12, 2) DEFAULT 0,
    
    -- Descuento del Item
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(12, 2) DEFAULT 0,
    
    -- Totales
    subtotal DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    
    -- Orden
    orden INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para presupuesto_items
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_presupuesto_id ON presupuesto_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_producto_id ON presupuesto_items(producto_id);

-- RLS para presupuesto_items
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view items of own presupuestos" ON presupuesto_items;
CREATE POLICY "Users can view items of own presupuestos"
    ON presupuesto_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM presupuestos
            WHERE presupuestos.id = presupuesto_items.presupuesto_id
            AND presupuestos.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert items to own presupuestos" ON presupuesto_items;
CREATE POLICY "Users can insert items to own presupuestos"
    ON presupuesto_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM presupuestos
            WHERE presupuestos.id = presupuesto_items.presupuesto_id
            AND presupuestos.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update items of own presupuestos" ON presupuesto_items;
CREATE POLICY "Users can update items of own presupuestos"
    ON presupuesto_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM presupuestos
            WHERE presupuestos.id = presupuesto_items.presupuesto_id
            AND presupuestos.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete items of own presupuestos" ON presupuesto_items;
CREATE POLICY "Users can delete items of own presupuestos"
    ON presupuesto_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM presupuestos
            WHERE presupuestos.id = presupuesto_items.presupuesto_id
            AND presupuestos.user_id = auth.uid()
        )
    );

-- Política para vista pública de items
DROP POLICY IF EXISTS "Anyone can view items by public link" ON presupuesto_items;
CREATE POLICY "Anyone can view items by public link"
    ON presupuesto_items FOR SELECT
    USING (true); -- Validaremos por link_publico en la app

-- ============================================
-- 4. FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at en productos
CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_productos_updated_at ON productos;
CREATE TRIGGER trigger_update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_productos_updated_at();

-- Función para actualizar updated_at en presupuestos
CREATE OR REPLACE FUNCTION update_presupuestos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_presupuestos_updated_at ON presupuestos;
CREATE TRIGGER trigger_update_presupuestos_updated_at
    BEFORE UPDATE ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION update_presupuestos_updated_at();

-- Función para generar número de presupuesto automático
CREATE OR REPLACE FUNCTION generar_numero_presupuesto()
RETURNS TRIGGER AS $$
DECLARE
    year_actual TEXT;
    contador INTEGER;
    nuevo_numero TEXT;
BEGIN
    -- Si ya tiene número, no hacer nada
    IF NEW.numero IS NOT NULL AND NEW.numero != '' THEN
        RETURN NEW;
    END IF;

    -- Obtener año actual
    year_actual := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Contar presupuestos del año actual del usuario
    SELECT COUNT(*) + 1 INTO contador
    FROM presupuestos
    WHERE user_id = NEW.user_id
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

    -- Generar número: PRES-2024-001
    nuevo_numero := 'PRES-' || year_actual || '-' || LPAD(contador::TEXT, 3, '0');

    NEW.numero = nuevo_numero;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generar_numero_presupuesto ON presupuestos;
CREATE TRIGGER trigger_generar_numero_presupuesto
    BEFORE INSERT ON presupuestos
    FOR EACH ROW
    EXECUTE FUNCTION generar_numero_presupuesto();

-- Función para actualizar estado a vencido automáticamente
CREATE OR REPLACE FUNCTION actualizar_presupuestos_vencidos()
RETURNS void AS $$
BEGIN
    UPDATE presupuestos
    SET estado = 'vencido'
    WHERE estado = 'pendiente'
    AND fecha_vencimiento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Función para recalcular totales del presupuesto
CREATE OR REPLACE FUNCTION recalcular_totales_presupuesto(presupuesto_uuid UUID)
RETURNS void AS $$
DECLARE
    nuevo_subtotal DECIMAL(12, 2);
    nuevo_descuento DECIMAL(12, 2);
    nuevo_impuesto DECIMAL(12, 2);
    nuevo_total DECIMAL(12, 2);
    descuento_pct DECIMAL(5, 2);
    impuesto_pct DECIMAL(5, 2);
BEGIN
    -- Obtener porcentajes actuales
    SELECT descuento_porcentaje, impuesto_porcentaje
    INTO descuento_pct, impuesto_pct
    FROM presupuestos
    WHERE id = presupuesto_uuid;

    -- Calcular subtotal sumando todos los items
    SELECT COALESCE(SUM(total), 0)
    INTO nuevo_subtotal
    FROM presupuesto_items
    WHERE presupuesto_id = presupuesto_uuid;

    -- Calcular descuento
    nuevo_descuento := nuevo_subtotal * (descuento_pct / 100);

    -- Calcular impuesto sobre (subtotal - descuento)
    nuevo_impuesto := (nuevo_subtotal - nuevo_descuento) * (impuesto_pct / 100);

    -- Calcular total
    nuevo_total := nuevo_subtotal - nuevo_descuento + nuevo_impuesto;

    -- Actualizar presupuesto
    UPDATE presupuestos
    SET
        subtotal = nuevo_subtotal,
        descuento_monto = nuevo_descuento,
        impuesto_monto = nuevo_impuesto,
        total = nuevo_total
    WHERE id = presupuesto_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular totales cuando se modifican items
CREATE OR REPLACE FUNCTION trigger_recalcular_presupuesto()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular para el presupuesto afectado
    IF TG_OP = 'DELETE' THEN
        PERFORM recalcular_totales_presupuesto(OLD.presupuesto_id);
    ELSE
        PERFORM recalcular_totales_presupuesto(NEW.presupuesto_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_after_item_change ON presupuesto_items;
CREATE TRIGGER trigger_recalcular_after_item_change
    AFTER INSERT OR UPDATE OR DELETE ON presupuesto_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_presupuesto();

-- ============================================
-- 5. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE productos IS 'Catálogo de productos/servicios para presupuestos';
COMMENT ON TABLE presupuestos IS 'Presupuestos/Cotizaciones enviados a clientes';
COMMENT ON TABLE presupuesto_items IS 'Items/líneas de cada presupuesto';

COMMENT ON COLUMN presupuestos.link_publico IS 'UUID único para compartir presupuesto públicamente';
COMMENT ON COLUMN presupuestos.numero IS 'Número de presupuesto formato PRES-YYYY-NNN';
COMMENT ON COLUMN presupuestos.estado IS 'pendiente, aprobado, rechazado, vencido';

