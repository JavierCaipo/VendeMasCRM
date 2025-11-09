-- ============================================
-- CREAR TABLA OPORTUNIDADES - Versión Simple
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor

-- Crear la tabla de oportunidades
CREATE TABLE IF NOT EXISTS oportunidades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    
    titulo TEXT NOT NULL,
    descripcion TEXT,
    valor_estimado DECIMAL(12, 2) DEFAULT 0,
    moneda TEXT DEFAULT 'PEN',
    probabilidad INTEGER DEFAULT 50,
    
    etapa TEXT DEFAULT 'prospecto',
    estado TEXT DEFAULT 'abierta',
    motivo_perdida TEXT,
    
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    fecha_cierre_estimada DATE,
    fecha_cierre_real DATE,
    
    origen TEXT,
    prioridad TEXT DEFAULT 'media',
    tags TEXT,
    notas TEXT,
    
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proximo_seguimiento DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_oportunidades_user_id ON oportunidades(user_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX IF NOT EXISTS idx_oportunidades_estado ON oportunidades(estado);

-- Habilitar RLS
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
DROP POLICY IF EXISTS "Users can view own oportunidades" ON oportunidades;
CREATE POLICY "Users can view own oportunidades"
    ON oportunidades FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own oportunidades" ON oportunidades;
CREATE POLICY "Users can insert own oportunidades"
    ON oportunidades FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own oportunidades" ON oportunidades;
CREATE POLICY "Users can update own oportunidades"
    ON oportunidades FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own oportunidades" ON oportunidades;
CREATE POLICY "Users can delete own oportunidades"
    ON oportunidades FOR DELETE
    USING (auth.uid() = user_id);

-- Crear función para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS update_oportunidades_updated_at ON oportunidades;
CREATE TRIGGER update_oportunidades_updated_at
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

