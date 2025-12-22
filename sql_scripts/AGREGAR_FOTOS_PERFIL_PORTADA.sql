-- ============================================================================
-- Sistema de Fotos de Perfil y Portada para Estacionamientos (Estilo Facebook)
-- ============================================================================
-- Agrega columnas para foto de perfil y portada en la tabla estacionamientos
-- Crea bucket específico para estas fotos
-- Agrega políticas RLS para que propietarios puedan subir/editar sus fotos
-- ============================================================================

-- PASO 1: Agregar columnas a la tabla estacionamientos
-- ============================================================================
ALTER TABLE public.estacionamientos 
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT,
ADD COLUMN IF NOT EXISTS foto_portada_url TEXT;

COMMENT ON COLUMN public.estacionamientos.foto_perfil_url IS 
'URL de la foto de perfil del estacionamiento (circular, tipo logo) - Similar a foto de perfil de Facebook';

COMMENT ON COLUMN public.estacionamientos.foto_portada_url IS 
'URL de la foto de portada del estacionamiento (banner horizontal) - Similar a cover de Facebook';

-- PASO 2: Crear bucket específico para fotos de perfil y portada (si no existe)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'estacionamientos-pms',
  'estacionamientos-pms',
  true,
  5242880, -- 5MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Políticas RLS para el bucket estacionamientos-pms
-- ============================================================================

-- Política 1: Permitir SELECT público (todos pueden ver las fotos)
DROP POLICY IF EXISTS "Public can view parking photos" ON storage.objects;
CREATE POLICY "Public can view parking photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'estacionamientos-pms');

-- Política 2: Propietarios pueden INSERT sus fotos
DROP POLICY IF EXISTS "Owners can upload their parking photos" ON storage.objects;
CREATE POLICY "Owners can upload their parking photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'estacionamientos-pms' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 3: Propietarios pueden UPDATE sus fotos
DROP POLICY IF EXISTS "Owners can update their parking photos" ON storage.objects;
CREATE POLICY "Owners can update their parking photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'estacionamientos-pms' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Propietarios pueden DELETE sus fotos
DROP POLICY IF EXISTS "Owners can delete their parking photos" ON storage.objects;
CREATE POLICY "Owners can delete their parking photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'estacionamientos-pms' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- PASO 4: Función helper para generar URLs públicas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_estacionamiento_foto_url(
  p_estacionamiento_id UUID,
  p_tipo_foto TEXT -- 'perfil' o 'portada'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_url TEXT;
  v_bucket_name TEXT := 'estacionamientos-pms';
  v_file_path TEXT;
BEGIN
  -- Obtener la URL base del proyecto
  v_project_url := current_setting('app.settings.supabase_url', true);
  
  -- Construir la ruta del archivo
  v_file_path := p_estacionamiento_id::text || '/' || p_tipo_foto || '.jpg';
  
  -- Retornar URL completa
  RETURN v_project_url || '/storage/v1/object/public/' || v_bucket_name || '/' || v_file_path;
END;
$$;

-- PASO 5: Trigger para actualizar calificacion_promedio cuando hay nuevas fotos
-- (Las fotos bonitas mejoran la percepción del lugar)
-- ============================================================================
-- Comentado por ahora, puede implementarse más adelante si se desea

-- PASO 6: Verificación de cambios
-- ============================================================================
-- Verificar que las columnas se agregaron
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'estacionamientos'
  AND column_name IN ('foto_perfil_url', 'foto_portada_url')
ORDER BY column_name;

-- Verificar que el bucket se creó
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'estacionamientos-pms';

-- Verificar políticas del bucket
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%parking photos%'
ORDER BY policyname;

-- ============================================================================
-- ESTRUCTURA DE ARCHIVOS EN EL BUCKET:
-- ============================================================================
-- estacionamientos-pms/
--   └── {user_id}/
--       └── {estacionamiento_id}/
--           ├── perfil.jpg     (Foto de perfil circular)
--           └── portada.jpg    (Foto de portada horizontal)
--
-- Ejemplo:
-- estacionamientos-pms/cbbc8f8c-51c9-4c68-9c08-34d3e243847c/a64b4a0c-d201-4044-8425-3ca4668bc4db/perfil.jpg
-- estacionamientos-pms/cbbc8f8c-51c9-4c68-9c08-34d3e243847c/a64b4a0c-d201-4044-8425-3ca4668bc4db/portada.jpg
-- ============================================================================

-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Tamaños recomendados:
--    - Foto de perfil: 400x400px (se mostrará circular)
--    - Foto de portada: 1200x400px (ratio 3:1)
--
-- 2. Las URLs se guardarán en formato:
--    https://[project].supabase.co/storage/v1/object/public/estacionamientos-pms/{user_id}/{parking_id}/perfil.jpg
--
-- 3. El frontend debe redimensionar las imágenes antes de subirlas para optimizar el almacenamiento
--
-- 4. RLS está configurado para que:
--    - Todos pueden VER las fotos (público)
--    - Solo el propietario puede SUBIR/EDITAR/BORRAR sus fotos
-- ============================================================================

