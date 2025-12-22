-- ============================================================================
-- HARD DELETE: Eliminar usuarios permanentemente (físicamente)
-- ============================================================================
-- Este script elimina usuarios de forma PERMANENTE, no soft delete
-- ============================================================================

-- OPCIÓN 1: Eliminar un usuario específico (juan@integralo.io)
-- ============================================================================

-- 1. Primero verificar si existe
SELECT id, email, deleted_at 
FROM auth.users 
WHERE email = 'juan@integralo.io';

-- 2. Si existe, eliminarlo con todas sus dependencias
DO $$
DECLARE
  v_user_id UUID := '55601e33-1ea4-4cf4-9300-c604fb11ba72';
BEGIN
  -- Eliminar datos públicos
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.notificaciones WHERE usuario_id = v_user_id;
  DELETE FROM public.audit_log WHERE usuario_id = v_user_id;
  DELETE FROM public.resenas WHERE user_id = v_user_id;
  DELETE FROM public.reservas WHERE user_id = v_user_id;
  DELETE FROM public.kyc_submissions WHERE user_id = v_user_id;
  DELETE FROM public.mp_accounts_propietarios WHERE user_id = v_user_id;
  DELETE FROM public.estacionamientos WHERE propietario_id = v_user_id;
  DELETE FROM public.datos_fiscales WHERE user_id = v_user_id;
  
  -- Eliminar datos de auth (esto es clave para hard delete)
  DELETE FROM auth.identities WHERE user_id = v_user_id;
  DELETE FROM auth.sessions WHERE user_id = v_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;
  DELETE FROM auth.mfa_factors WHERE user_id = v_user_id;
  DELETE FROM auth.one_time_tokens WHERE user_id = v_user_id;
  DELETE FROM auth.mfa_amr_claims WHERE session_id IN (
    SELECT id FROM auth.sessions WHERE user_id = v_user_id
  );
  
  -- HARD DELETE del usuario
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RAISE NOTICE 'Usuario eliminado permanentemente';
END $$;

-- ============================================================================
-- OPCIÓN 2: Limpiar TODOS los usuarios soft-deleted
-- ============================================================================

-- Ver usuarios marcados como eliminados (soft delete)
SELECT 
  id,
  email,
  deleted_at,
  'Soft deleted' as status
FROM auth.users
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- Si quieres eliminar TODOS los usuarios soft-deleted de forma permanente:
-- ⚠️ CUIDADO: Esto es IRREVERSIBLE

/*
DELETE FROM auth.users 
WHERE deleted_at IS NOT NULL;
*/

-- ============================================================================
-- OPCIÓN 3: Eliminar usuario por email (más seguro)
-- ============================================================================

-- Función para eliminar usuario por email de forma segura
CREATE OR REPLACE FUNCTION delete_user_permanently(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Obtener user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN 'Usuario no encontrado: ' || user_email;
  END IF;
  
  -- Eliminar dependencias en public schema
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.notificaciones WHERE usuario_id = v_user_id;
  DELETE FROM public.audit_log WHERE usuario_id = v_user_id;
  DELETE FROM public.resenas WHERE user_id = v_user_id;
  DELETE FROM public.reservas WHERE user_id = v_user_id;
  DELETE FROM public.kyc_submissions WHERE user_id = v_user_id;
  DELETE FROM public.mp_accounts_propietarios WHERE user_id = v_user_id;
  DELETE FROM public.estacionamientos WHERE propietario_id = v_user_id;
  DELETE FROM public.datos_fiscales WHERE user_id = v_user_id;
  
  -- Eliminar dependencias en auth schema
  DELETE FROM auth.identities WHERE user_id = v_user_id;
  DELETE FROM auth.sessions WHERE user_id = v_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;
  DELETE FROM auth.mfa_factors WHERE user_id = v_user_id;
  DELETE FROM auth.one_time_tokens WHERE user_id = v_user_id;
  
  -- Hard delete del usuario
  DELETE FROM auth.users WHERE id = v_user_id;
  
  -- Verificar que se eliminó
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  IF v_count > 0 THEN
    RETURN 'Usuario eliminado permanentemente: ' || user_email;
  ELSE
    RETURN 'Error al eliminar usuario: ' || user_email;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Usar la función:
SELECT delete_user_permanently('juan@integralo.io');

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Ver todos los usuarios activos
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN deleted_at IS NOT NULL THEN 'Soft deleted'
    ELSE 'Active'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. SOFT DELETE vs HARD DELETE:
   - Soft delete: marca deleted_at pero mantiene el registro
   - Hard delete: elimina físicamente el registro

2. Dashboard de Supabase puede tener cache:
   - Refresca la página (Ctrl+Shift+R)
   - Cierra y vuelve a abrir el dashboard

3. Si los usuarios siguen apareciendo:
   - Es cache del navegador
   - Limpia cache del navegador
   - Usa modo incógnito para verificar

4. RLS Policies:
   - Asegúrate de tener permisos para eliminar usuarios
   - Puede que necesites deshabilitar RLS temporalmente
*/

