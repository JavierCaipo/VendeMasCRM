-- ============================================
-- ACTUALIZAR TABLA CLIENTES - Vende+CRM
-- ============================================
-- Este script actualiza la tabla clientes para incluir
-- todos los campos del archivo Excel

-- PASO 1: Eliminar la tabla existente (CUIDADO: Esto borra todos los datos)
-- Si ya tienes datos importantes, mejor usa ALTER TABLE para agregar columnas
DROP TABLE IF EXISTS clientes CASCADE;

-- PASO 2: Crear la tabla con todos los campos del Excel
CREATE TABLE clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Campos del Excel
    customer_id TEXT UNIQUE,                    -- customer_id (ej: CUST-001)
    nombre TEXT NOT NULL,                       -- name
    empresa TEXT,                               -- company
    contacto_principal TEXT,                    -- contact_person
    email TEXT NOT NULL,                        -- email1
    telefono TEXT,                              -- phone_number
    tipo_documento TEXT,                        -- tipo_documento (DNI, RUC, etc)
    numero_documento TEXT,                      -- numero_documento
    direccion TEXT,                             -- direccion
    ciudad TEXT,                                -- ciudad
    pais TEXT DEFAULT 'Perú',                   -- pais
    estado_cliente TEXT DEFAULT 'Activo',       -- estado_cliente (Activo/Inactivo)
    fecha_registro DATE DEFAULT CURRENT_DATE,   -- fecha_registro
    usuario_registro TEXT,                      -- usuario_registro
    
    -- Campos adicionales del CRM
    etapa TEXT DEFAULT 'prospecto',             -- Etapa del embudo
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notas TEXT,                                 -- Notas adicionales
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: Crear índices para mejorar el rendimiento
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_customer_id ON clientes(customer_id);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_estado ON clientes(estado_cliente);
CREATE INDEX idx_clientes_etapa ON clientes(etapa);

-- PASO 4: Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- PASO 5: Crear políticas RLS
CREATE POLICY "Users can view own clientes"
    ON clientes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clientes"
    ON clientes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clientes"
    ON clientes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clientes"
    ON clientes FOR DELETE
    USING (auth.uid() = user_id);

-- PASO 6: Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 7: Crear trigger para updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS DE EJEMPLO (Opcional)
-- ============================================
-- Puedes descomentar esto para insertar datos de prueba
/*
INSERT INTO clientes (
    user_id, customer_id, nombre, empresa, contacto_principal, 
    email, telefono, tipo_documento, numero_documento, 
    direccion, ciudad, pais, estado_cliente, etapa
) VALUES
(
    auth.uid(),
    'CUST-001',
    'Juan Pérez',
    'Construcción',
    'Juan Pérez',
    'juan.perez@email.com',
    '999111222',
    'DNI',
    '12345678',
    'Av. Independencia 123 - Arequipa',
    'Arequipa',
    'Perú',
    'Activo',
    'prospecto'
);
*/

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que la tabla se creó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clientes'
ORDER BY ordinal_position;

