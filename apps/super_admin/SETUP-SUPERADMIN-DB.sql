-- ============================================
-- SUPERADMIN SCHEMA — VendeMas SaaS
-- Ejecutar en Supabase SQL Editor
-- Antigravity Factory
-- ============================================

-- ── TABLA: negocios (Tenants) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.negocios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  subdominio  text NOT NULL UNIQUE,
  estado      text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
  plan        text DEFAULT 'free',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── TABLA: invitaciones (Aprovisionamiento) ────────────────────
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id  uuid NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  email       text NOT NULL,
  documento   text,                             -- DNI / RUC del admin
  rol         text NOT NULL DEFAULT 'admin_negocio',
  estado      text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'expirada')),
  token       text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at  timestamptz DEFAULT now(),
  expires_at  timestamptz DEFAULT (now() + interval '7 days')
);

-- ── ÍNDICES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_negocios_estado    ON public.negocios (estado);
CREATE INDEX IF NOT EXISTS idx_negocios_subdominio ON public.negocios (subdominio);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email  ON public.invitaciones (email);
CREATE INDEX IF NOT EXISTS idx_invitaciones_negocio ON public.invitaciones (negocio_id);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.negocios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;

-- Por ahora: SuperAdmin accede vía service_role key desde el backend.
-- Para el frontend SuperAdmin (anon key), habilitamos acceso completo
-- SOLO mientras se implementa la verificación de rol superadmin.
-- ⚠️ REEMPLAZAR con políticas de rol en producción.

CREATE POLICY "superadmin_full_access_negocios"
  ON public.negocios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "superadmin_full_access_invitaciones"
  ON public.invitaciones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Trigger: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_negocios_updated_at
  BEFORE UPDATE ON public.negocios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Datos de prueba (opcional) ────────────────────────────────
-- INSERT INTO public.negocios (nombre, subdominio, estado)
-- VALUES
--   ('Café Central Lima', 'cafe-central', 'activo'),
--   ('Tech Solutions SAC', 'tech-solutions', 'activo'),
--   ('Moda & Estilo', 'moda-estilo', 'suspendido');

SELECT 'Schema SuperAdmin creado exitosamente ✅' AS resultado;
