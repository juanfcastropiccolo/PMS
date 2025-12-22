-- =============================================================================
-- SOLUCIÓN FINAL: RLS Estacionamientos - EJECUTAR COMO POSTGRES/SUPERUSER
-- =============================================================================
-- PROBLEMA CONFIRMADO CON MCP:
-- 1. NO HAY GRANT INSERT (el permiso base falta)
-- 2. Hay 2 políticas duplicadas de INSERT
-- 
-- IMPORTANTE: Este script debe ejecutarse con permisos de postgres/superuser
-- En Supabase Dashboard → SQL Editor → ejecutar como está
-- =============================================================================

-- PASO 1: Eliminar TODAS las políticas de INSERT existentes
DROP POLICY IF EXISTS "Propietarios pueden crear estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Propietarios pueden insertar estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "est_insert_authenticated" ON estacionamientos;
DROP POLICY IF EXISTS "estacionamientos_insert_marketplace_y_free" ON estacionamientos;
DROP POLICY IF EXISTS "insert_estacionamiento_owner" ON estacionamientos;
DROP POLICY IF EXISTS "insert_estacionamiento_pms" ON estacionamientos;
DROP POLICY IF EXISTS "insert_estacionamiento_authenticated" ON estacionamientos;
DROP POLICY IF EXISTS "insert_estacionamiento_propietario_o_usuario" ON estacionamientos;

-- PASO 2: Otorgar permisos base (CRÍTICO - sin esto no funciona NADA)
GRANT INSERT ON TABLE public.estacionamientos TO authenticated;
GRANT INSERT ON TABLE public.estacionamientos TO service_role;

-- PASO 3: Crear UNA ÚNICA política simple que coincida con SELECT/UPDATE
CREATE POLICY "insert_estacionamiento"
ON public.estacionamientos
FOR INSERT
TO authenticated
WITH CHECK (
  -- Misma lógica que las políticas de SELECT y UPDATE existentes
  auth.uid() = COALESCE(propietario_id, user_id)
);

-- PASO 4: Verificación completa
SELECT 
  '=== VERIFICACIÓN FINAL ===' as titulo;

-- Ver permisos GRANT
SELECT 
  '✅ Permisos GRANT' as verificacion,
  grantee,
  string_agg(privilege_type, ', ') as permisos
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'estacionamientos'
  AND grantee IN ('authenticated', 'service_role')
GROUP BY grantee;

-- Ver políticas de INSERT
SELECT 
  '✅ Políticas INSERT' as verificacion,
  COUNT(*) as cantidad_politicas,
  string_agg(policyname, ', ') as nombres
FROM pg_policies
WHERE tablename = 'estacionamientos'
  AND cmd = 'INSERT';

-- Mostrar la política creada
SELECT 
  '✅ Detalle Política' as verificacion,
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'estacionamientos'
  AND cmd = 'INSERT';

