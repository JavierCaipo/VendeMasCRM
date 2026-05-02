-- ============================================
-- CREAR TABLA OPORTUNIDADES - Vende+CRM
-- ============================================
-- Esta tabla almacena las oportunidades de venta

-- PASO 1: Crear la tabla de oportunidades
CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Información de la oportunidad
    titulo TEXT NOT NULL,                           -- Título de la oportunidad
    descripcion TEXT,                               -- Descripción detallada
    valor_estimado DECIMAL(12, 2) DEFAULT 0,        -- Valor estimado de la venta
    moneda TEXT DEFAULT 'PEN',                      -- Moneda (PEN, USD, etc)
    probabilidad INTEGER DEFAULT 50,                -- Probabilidad de cierre (0-100%)
    
    -- Estado y etapa
    etapa TEXT DEFAULT 'prospecto',                 -- prospecto, contactado, calificado, negociacion, ganado, perdido
    estado TEXT DEFAULT 'abierta',                  -- abierta, ganada, perdida
    motivo_perdida TEXT,                            -- Razón si se perdió
    
    -- Fechas importantes
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    fecha_cierre_estimada DATE,                     -- Fecha estimada de cierre
    fecha_cierre_real DATE,                         -- Fecha real de cierre
    
    -- Información adicional
    origen TEXT,                                    -- Origen del lead (web, referido, etc)
    prioridad TEXT DEFAULT 'media',                 -- alta, media, baja
    tags TEXT,                                      -- Etiquetas separadas por comas
    notas TEXT,                                     -- Notas adicionales
    
    -- Seguimiento
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proximo_seguimiento DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 2: Crear índices para mejorar el rendimiento
CREATE INDEX idx_oportunidades_user_id ON oportunidades(user_id);
CREATE INDEX idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);
CREATE INDEX idx_oportunidades_fecha_cierre ON oportunidades(fecha_cierre_estimada);

-- PASO 3: Habilitar RLS (Row Level Security)
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas RLS
CREATE POLICY "Users can view own oportunidades"
    ON oportunidades FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oportunidades"
    ON oportunidades FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oportunidades"
    ON oportunidades FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oportunidades"
    ON oportunidades FOR DELETE
    USING (auth.uid() = user_id);

-- PASO 5: Crear función para updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 6: Crear trigger para updated_at
CREATE TRIGGER update_oportunidades_updated_at
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
