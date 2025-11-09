-- ============================================
-- RECREAR TABLA OPORTUNIDADES DESDE CERO
-- ============================================
-- ADVERTENCIA: Este script ELIMINA la tabla existente y todos sus datos
-- Solo ejecuta esto si estás seguro

-- 1. ELIMINAR tabla existente (si existe)
DROP TABLE IF EXISTS oportunidades CASCADE;

-- 2. CREAR la tabla de oportunidades con TODOS los campos
CREATE TABLE oportunidades (
    -- IDs y Referencias
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    
    -- Información Básica
    titulo TEXT NOT NULL,
    descripcion TEXT,
    
    -- Información Financiera
    valor_estimado DECIMAL(12, 2) DEFAULT 0,
    moneda TEXT DEFAULT 'PEN',
    probabilidad INTEGER DEFAULT 50,
    ltv DECIMAL(12, 2) DEFAULT 0,
    
    -- Estado y Etapa
    etapa TEXT DEFAULT 'prospecto',
    estado TEXT DEFAULT 'abierta',
    motivo_perdida TEXT,
    
    -- Fechas
    fecha_creacion DATE DEFAULT CURRENT_DATE,
    fecha_cierre_estimada DATE,
    fecha_cierre_real DATE,
    
    -- Seguimiento
    origen TEXT,
    prioridad TEXT DEFAULT 'media',
    tags TEXT,
    notas TEXT,
    asignado_a TEXT,
    
    -- Actividad
    ultimo_contacto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    proximo_seguimiento DATE,
    proxima_tarea TEXT,
    deadline_tarea DATE,
    ultima_actividad TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Scoring y Riesgos
    lead_score INTEGER DEFAULT 0,
    dias_sin_actividad INTEGER DEFAULT 0,
    en_riesgo BOOLEAN DEFAULT FALSE,
    motivo_riesgo TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR índices para mejorar rendimiento
CREATE INDEX idx_oportunidades_user_id ON oportunidades(user_id);
CREATE INDEX idx_oportunidades_cliente_id ON oportunidades(cliente_id);
CREATE INDEX idx_oportunidades_etapa ON oportunidades(etapa);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);
CREATE INDEX idx_oportunidades_asignado ON oportunidades(asignado_a);
CREATE INDEX idx_oportunidades_lead_score ON oportunidades(lead_score DESC);
CREATE INDEX idx_oportunidades_en_riesgo ON oportunidades(en_riesgo) WHERE en_riesgo = TRUE;
CREATE INDEX idx_oportunidades_deadline ON oportunidades(deadline_tarea);

-- 4. HABILITAR Row Level Security
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- 5. CREAR políticas RLS
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

-- 6. CREAR función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREAR trigger para updated_at
CREATE TRIGGER update_oportunidades_updated_at
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. CREAR función para actualizar ultima_actividad automáticamente
CREATE OR REPLACE FUNCTION actualizar_ultima_actividad()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza cualquier campo importante, actualizar ultima_actividad
    IF (OLD.etapa IS DISTINCT FROM NEW.etapa) OR
       (OLD.probabilidad IS DISTINCT FROM NEW.probabilidad) OR
       (OLD.valor_estimado IS DISTINCT FROM NEW.valor_estimado) OR
       (OLD.notas IS DISTINCT FROM NEW.notas) THEN
        NEW.ultima_actividad = NOW();
        NEW.dias_sin_actividad = 0;
        NEW.en_riesgo = FALSE;
        NEW.motivo_riesgo = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. CREAR trigger para ultima_actividad
CREATE TRIGGER trigger_actualizar_ultima_actividad
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_ultima_actividad();

-- 10. CREAR función para detectar riesgos automáticamente
CREATE OR REPLACE FUNCTION actualizar_estado_riesgo_oportunidades()
RETURNS void AS $$
BEGIN
    -- Actualizar días sin actividad para todas las oportunidades activas
    UPDATE oportunidades
    SET dias_sin_actividad = EXTRACT(DAY FROM (NOW() - ultima_actividad))::INTEGER
    WHERE etapa != 'ganado';
    
    -- Marcar como en riesgo si no hay actividad en 14 días
    UPDATE oportunidades
    SET 
        en_riesgo = TRUE,
        motivo_riesgo = 'Sin actividad por más de 14 días'
    WHERE 
        etapa != 'ganado'
        AND dias_sin_actividad > 14
        AND (en_riesgo = FALSE OR en_riesgo IS NULL);
    
    -- Marcar como en riesgo si la fecha de cierre estimada ya pasó
    UPDATE oportunidades
    SET 
        en_riesgo = TRUE,
        motivo_riesgo = 'Fecha de cierre estimada vencida'
    WHERE 
        etapa != 'ganado'
        AND fecha_cierre_estimada < CURRENT_DATE
        AND (en_riesgo = FALSE OR en_riesgo IS NULL);
    
    -- Marcar como en riesgo si lead score es muy bajo (< 30)
    UPDATE oportunidades
    SET 
        en_riesgo = TRUE,
        motivo_riesgo = 'Lead score bajo (< 30)'
    WHERE 
        etapa != 'ganado'
        AND lead_score < 30
        AND lead_score > 0
        AND (en_riesgo = FALSE OR en_riesgo IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 11. COMENTARIOS para documentación
COMMENT ON TABLE oportunidades IS 'Tabla de oportunidades de venta con seguimiento completo';
COMMENT ON COLUMN oportunidades.titulo IS 'Nombre del acuerdo o trato';
COMMENT ON COLUMN oportunidades.valor_estimado IS 'Valor potencial del trato';
COMMENT ON COLUMN oportunidades.ltv IS 'Valor de Vida del Cliente (Lifetime Value)';
COMMENT ON COLUMN oportunidades.lead_score IS 'Puntuación del lead (0-100) generada por IA';
COMMENT ON COLUMN oportunidades.asignado_a IS 'Representante de ventas responsable';
COMMENT ON COLUMN oportunidades.proxima_tarea IS 'Próxima acción de seguimiento necesaria';
COMMENT ON COLUMN oportunidades.deadline_tarea IS 'Plazo para la próxima tarea';
COMMENT ON COLUMN oportunidades.ultima_actividad IS 'Fecha y hora de la última interacción';
COMMENT ON COLUMN oportunidades.dias_sin_actividad IS 'Días transcurridos desde la última actividad';
COMMENT ON COLUMN oportunidades.en_riesgo IS 'Indica si la oportunidad está en riesgo de perderse';
COMMENT ON COLUMN oportunidades.motivo_riesgo IS 'Razón por la cual está en riesgo';

