-- Agrega nombre_apellido y telefono a la tabla early_birds
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.early_birds
  ADD COLUMN IF NOT EXISTS nombre_apellido TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefono        TEXT NOT NULL DEFAULT '';

-- Verificar resultado
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'early_birds'
ORDER BY ordinal_position;
