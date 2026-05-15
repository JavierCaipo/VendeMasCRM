-- Migration: add_estado_suscripcion_to_negocios
-- Valores posibles: 'activa' | 'vencida' | 'pendiente' | NULL (starter sin suscripcion paga)
ALTER TABLE public.negocios
  ADD COLUMN IF NOT EXISTS estado_suscripcion text DEFAULT NULL;

-- Retrocompatibilidad: negocios ya en plan 'pro' se marcan como activos
UPDATE public.negocios
  SET estado_suscripcion = 'activa'
  WHERE plan = 'pro' AND estado_suscripcion IS NULL;

-- Corregir plan 'free' legado → 'starter' (consistencia con modelo PLG)
UPDATE public.negocios
  SET plan = 'starter'
  WHERE plan = 'free' OR plan IS NULL;

COMMENT ON COLUMN public.negocios.estado_suscripcion
  IS 'Estado MP: activa | vencida | pendiente | NULL para starter sin sub pagada.';
