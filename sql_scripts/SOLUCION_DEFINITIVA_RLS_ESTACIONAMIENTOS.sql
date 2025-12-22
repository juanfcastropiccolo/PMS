-- =============================================================================
-- SOLUCIÓN DEFINITIVA: RLS Estacionamientos - Análisis Completo con MCP
-- =============================================================================
-- PROBLEMA IDENTIFICADO:
-- 1. HAY DOS POLÍTICAS DE INSERT (duplicadas por error)
-- 2. FALTA GRANT INSERT para el rol 'authenticated'
-- 3. Las políticas RLS filtran DESPUÉS de verificar permisos base
-- =============================================================================

-- PASO 1: Eliminar TODAS las políticas de INSERT existentes
DROP POLICY IF EXISTS "Propietarios pueden crear estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "Propietarios pueden insertar estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "est_insert_authenticated" ON estacionamientos;
DROP POLICY IF EXISTS "estacionamientos_insert_marketplace_y_free" ON estacionamientos;

-- PASO 2: Otorgar permisos base de INSERT a usuarios autenticados
-- Sin esto, las políticas RLS no sirven de nada
GRANT INSERT ON estacionamientos TO authenticated;

-- PASO 3: Crear UNA SOLA política de INSERT SIMPLE Y SEGURA
-- Analizando el código del formulario: siempre envía propietario_id = user.id
CREATE POLICY "insert_estacionamiento_authenticated"
ON estacionamientos
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permite insertar si el usuario autenticado coincide con propietario_id o user_id
  auth.uid() = COALESCE(propietario_id, user_id)
);

-- PASO 4: Verificar que todo está correcto
SELECT 
  '✅ Políticas de INSERT' as verificacion,
  COUNT(*) as cantidad,
  string_agg(policyname, ', ') as nombres
FROM pg_policies
WHERE tablename = 'estacionamientos'
  AND cmd = 'INSERT';

-- PASO 5: Verificar permisos
SELECT 
  '✅ Permisos GRANT' as verificacion,
  grantee,
  string_agg(privilege_type, ', ') as permisos
FROM information_schema.role_table_grants
WHERE table_name = 'estacionamientos'
  AND grantee = 'authenticated'
GROUP BY grantee;

