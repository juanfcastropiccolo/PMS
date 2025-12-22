-- ============================================================================
-- Agregar Foto de Perfil para Usuarios del PMS
-- ============================================================================
-- Agrega columna foto_perfil_url a la tabla users
-- Configura políticas RLS para el bucket avatars
-- ============================================================================

-- PASO 1: Agregar columna a la tabla users
-- ============================================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS foto_perfil_url TEXT,
ADD COLUMN IF NOT EXISTS telefono TEXT;

COMMENT ON COLUMN public.users.foto_perfil_url IS 
'URL de la foto de perfil del usuario';

COMMENT ON COLUMN public.users.telefono IS 
'Número de teléfono del usuario';

-- PASO 2: Configurar límites y tipos permitidos en el bucket avatars
-- ============================================================================
UPDATE storage.buckets 
SET 
  file_size_limit = 2097152,  -- 2MB límite
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
WHERE id = 'avatars';

-- PASO 3: Políticas RLS para el bucket avatars
-- ============================================================================

-- Política 1: Todos pueden ver los avatares (público)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política 2: Usuarios pueden subir su propio avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 3: Usuarios pueden actualizar su propio avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política 4: Usuarios pueden eliminar su propio avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- PASO 4: Verificación
-- ============================================================================
-- Verificar que las columnas se agregaron
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public'
  AND column_name IN ('foto_perfil_url', 'telefono')
ORDER BY column_name;

-- Verificar bucket actualizado
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- Verificar políticas
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

-- ============================================================================
-- ESTRUCTURA DE ARCHIVOS EN EL BUCKET:
-- ============================================================================
-- avatars/
--   └── {user_id}/
--       └── avatar.jpg
--
-- Ejemplo:
-- avatars/cbbc8f8c-51c9-4c68-9c08-34d3e243847c/avatar.jpg
-- ============================================================================



