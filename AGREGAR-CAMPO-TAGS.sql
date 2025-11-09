-- Agregar campo tags a la tabla clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS tags TEXT;

-- Comentario para el campo
COMMENT ON COLUMN clientes.tags IS 'Etiquetas del cliente separadas por comas';

