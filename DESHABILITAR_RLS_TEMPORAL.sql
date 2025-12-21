-- ============================================================================
-- DESHABILITAR RLS TEMPORALMENTE (SOLO PARA DEBUGGING)
-- ============================================================================
-- Esto es TEMPORAL para confirmar que el problema es RLS
-- Una vez que funcione, podemos volver a habilitar RLS con políticas correctas
-- ============================================================================

-- Deshabilitar RLS en user_roles TEMPORALMENTE
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'user_roles';

-- Resultado esperado: rls_habilitado = false

-- ============================================================================
-- DESPUÉS DE PROBAR, VOLVER A HABILITAR RLS
-- ============================================================================

/*
-- Una vez que confirmes que funciona, VUELVE A HABILITAR RLS:
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Y mantén solo la política necesaria:
DROP POLICY IF EXISTS "Usuarios pueden ver sus roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins pueden gestionar roles" ON public.user_roles;

-- Política simple que funciona:
CREATE POLICY "Allow authenticated users to read roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
*/

-- ============================================================================
-- NOTA
-- ============================================================================
/*
Con RLS deshabilitado, CUALQUIER consulta autenticada puede leer user_roles.
Esto es OK para desarrollo, pero en producción debes habilitar RLS de nuevo.
*/

