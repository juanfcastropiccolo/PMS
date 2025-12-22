-- =============================================================================
-- SOLUCIÓN: Row Level Security Policy - Estacionamientos Marketplace
-- =============================================================================
-- Las políticas actuales están en conflicto porque:
-- - est_insert_authenticated requiere user_id (para spots free)
-- - Propietarios pueden crear requiere propietario_id (para marketplace)
-- 
-- Solución: Modificar las políticas para que permitan ambos casos
-- =============================================================================

-- Paso 1: Eliminar las políticas conflictivas de INSERT
DROP POLICY IF EXISTS "Propietarios pueden crear estacionamientos" ON estacionamientos;
DROP POLICY IF EXISTS "est_insert_authenticated" ON estacionamientos;

-- Paso 2: Crear política unificada consistente con SELECT y UPDATE
CREATE POLICY "Propietarios pueden insertar estacionamientos"
ON estacionamientos
FOR INSERT
TO authenticated
WITH CHECK (
  -- Permite insertar si el usuario coincide con propietario_id o user_id
  auth.uid() = COALESCE(propietario_id, user_id)
);

-- Paso 3: Verificar que la política se creó correctamente
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'estacionamientos'
  AND cmd = 'INSERT';

