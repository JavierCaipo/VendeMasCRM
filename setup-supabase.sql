-- ============================================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA PARA EMBUDO CRM SAAS
-- ============================================================================
-- Copia y pega este script completo en el SQL Editor de Supabase
-- URL: https://app.supabase.com/project/vshlisqaouqptlskcjzg/sql
-- ============================================================================

-- ============================================================================
-- 1. TABLA DE CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  email VARCHAR(255),
  telefono VARCHAR(50),
  etapa VARCHAR(50) DEFAULT 'lead' CHECK (etapa IN ('lead', 'prospecto', 'negociacion', 'ganado', 'perdido')),
  ultimo_contacto TIMESTAMP DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_etapa ON clientes(etapa);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para clientes
DROP POLICY IF EXISTS "Users can view own clientes" ON clientes;
CREATE POLICY "Users can view own clientes"
  ON clientes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clientes" ON clientes;
CREATE POLICY "Users can insert own clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clientes" ON clientes;
CREATE POLICY "Users can update own clientes"
  ON clientes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clientes" ON clientes;
CREATE POLICY "Users can delete own clientes"
  ON clientes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. TABLA DE OPORTUNIDADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  valor DECIMAL(12, 2) DEFAULT 0,
  moneda VARCHAR(3) DEFAULT 'USD',
  etapa VARCHAR(50) DEFAULT 'prospecto' CHECK (etapa IN ('prospecto', 'calificacion', 'propuesta', 'negociacion', 'ganado', 'perdido')),
  probabilidad INTEGER DEFAULT 50 CHECK (probabilidad >= 0 AND probabilidad <= 100),
  fecha_cierre_estimada DATE,
  fecha_cierre_real DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oportunidades_user_id ON oportunidades(user_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa ON oportunidades(etapa);

-- Habilitar Row Level Security
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para oportunidades
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

-- ============================================================================
-- 3. TABLA DE ACTIVIDADES
-- ============================================================================

CREATE TABLE IF NOT EXISTS actividades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  oportunidad_id UUID REFERENCES oportunidades(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('email', 'llamada', 'reunion', 'nota', 'tarea', 'whatsapp')),
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT NOW(),
  completada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_actividades_user_id ON actividades(user_id);
CREATE INDEX IF NOT EXISTS idx_actividades_cliente_id ON actividades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_actividades_tipo ON actividades(tipo);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades(fecha);

-- Habilitar Row Level Security
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para actividades
DROP POLICY IF EXISTS "Users can view own actividades" ON actividades;
CREATE POLICY "Users can view own actividades"
  ON actividades FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own actividades" ON actividades;
CREATE POLICY "Users can insert own actividades"
  ON actividades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own actividades" ON actividades;
CREATE POLICY "Users can update own actividades"
  ON actividades FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own actividades" ON actividades;
CREATE POLICY "Users can delete own actividades"
  ON actividades FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TABLA DE CONFIGURACIÓN DE USUARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  empresa VARCHAR(255),
  telefono VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
  moneda_preferida VARCHAR(3) DEFAULT 'USD',
  idioma VARCHAR(5) DEFAULT 'es',
  notificaciones_email BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Habilitar Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_clientes_updated_at ON clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_oportunidades_updated_at ON oportunidades;
CREATE TRIGGER update_oportunidades_updated_at
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. VISTAS ÚTILES
-- ============================================================================

-- Vista de estadísticas por usuario
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) as total_clientes,
    COUNT(DISTINCT CASE WHEN c.etapa = 'lead' THEN c.id END) as leads,
    COUNT(DISTINCT CASE WHEN c.etapa = 'prospecto' THEN c.id END) as prospectos,
    COUNT(DISTINCT CASE WHEN c.etapa = 'negociacion' THEN c.id END) as en_negociacion,
    COUNT(DISTINCT CASE WHEN c.etapa = 'ganado' THEN c.id END) as ganados,
    COUNT(DISTINCT o.id) as total_oportunidades,
    COALESCE(SUM(CASE WHEN o.etapa = 'ganado' THEN o.valor ELSE 0 END), 0) as ingresos_totales,
    COALESCE(SUM(CASE WHEN o.etapa NOT IN ('ganado', 'perdido') THEN o.valor ELSE 0 END), 0) as pipeline_valor,
    COUNT(DISTINCT a.id) as total_actividades
FROM clientes c
LEFT JOIN oportunidades o ON c.id = o.cliente_id
LEFT JOIN actividades a ON c.id = a.cliente_id
GROUP BY c.user_id;

-- ============================================================================
-- 7. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- ============================================================================

-- Descomenta las siguientes líneas después de registrarte en la app
-- Reemplaza 'YOUR_USER_ID' con tu ID de usuario real

/*
-- Obtén tu USER_ID ejecutando esto después de iniciar sesión:
-- SELECT auth.uid();

-- Insertar clientes de ejemplo
INSERT INTO clientes (user_id, nombre, empresa, email, telefono, etapa) VALUES
('YOUR_USER_ID', 'María González', 'Innovatech', 'maria@innovatech.com', '+52 55 1234 5678', 'negociacion'),
('YOUR_USER_ID', 'Carlos Mendoza', 'Global Corp', 'cmendoza@global.com', '+52 55 2345 6789', 'prospecto'),
('YOUR_USER_ID', 'Ana Rodríguez', 'TechSolutions', 'ana.rodriguez@techs.com', '+52 55 3456 7890', 'ganado'),
('YOUR_USER_ID', 'Roberto Silva', 'Future Systems', 'rsilva@future.com', '+52 55 4567 8901', 'lead');

-- Insertar oportunidades de ejemplo
INSERT INTO oportunidades (user_id, cliente_id, titulo, valor, etapa, probabilidad)
SELECT 
    'YOUR_USER_ID',
    id,
    'Venta de Software CRM',
    50000.00,
    'propuesta',
    75
FROM clientes WHERE email = 'maria@innovatech.com' AND user_id = 'YOUR_USER_ID';

-- Insertar actividades de ejemplo
INSERT INTO actividades (user_id, cliente_id, tipo, titulo, descripcion)
SELECT 
    'YOUR_USER_ID',
    id,
    'email',
    'Envío de propuesta comercial',
    'Se envió la propuesta con descuento del 15%'
FROM clientes WHERE email = 'maria@innovatech.com' AND user_id = 'YOUR_USER_ID';
*/

-- ============================================================================
-- ✅ SCRIPT COMPLETADO
-- ============================================================================
-- 
-- Próximos pasos:
-- 1. Verifica que todas las tablas se crearon en "Table Editor"
-- 2. Abre embudo-crm-saas.html en tu navegador
-- 3. Regístrate con tu email
-- 4. Confirma tu email
-- 5. ¡Empieza a usar tu CRM!
--
-- ============================================================================
