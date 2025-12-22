-- =============================================================================
-- SOLUCIÓN: Error "relation vendedores does not exist"
-- =============================================================================
-- La tabla "vendedores" fue renombrada a "mp_accounts_propietarios"
-- Esta migración crea una vista de compatibilidad para que las referencias 
-- antiguas sigan funcionando
-- =============================================================================

-- Paso 1: Eliminar la vista si existe (para evitar conflictos)
DROP VIEW IF EXISTS vendedores;

-- Paso 2: Crear vista vendedores que apunte a mp_accounts_propietarios
CREATE VIEW vendedores AS
SELECT * FROM mp_accounts_propietarios;

-- Paso 3: Agregar comentario explicativo
COMMENT ON VIEW vendedores IS 'Vista de compatibilidad que apunta a mp_accounts_propietarios para mantener retrocompatibilidad';

-- Paso 4: Verificar que la vista funciona correctamente
SELECT 
  'Vista creada exitosamente' as status,
  COUNT(*) as registros_visibles
FROM vendedores;

