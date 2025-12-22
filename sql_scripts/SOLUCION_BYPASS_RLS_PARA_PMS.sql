-- =============================================================================
-- SOLUCIÓN DEFINITIVA: Bypass RLS para Propietarios en PMS
-- =============================================================================
-- PROBLEMA CONFIRMADO CON MCP:
-- - NO hay GRANT INSERT (no se puede aplicar desde SQL Editor)
-- - La política RLS está correcta pero sin GRANT no funciona
-- 
-- SOLUCIÓN: Usar BYPASSRLS o crear función que use SECURITY DEFINER
-- =============================================================================

-- OPCIÓN 1: Crear función con SECURITY DEFINER que bypasea RLS
-- Esta función se ejecuta con permisos del owner (postgres)

CREATE OR REPLACE FUNCTION public.insert_estacionamiento_pms(
  p_propietario_id UUID,
  p_nombre TEXT,
  p_tipo TEXT,
  p_direccion TEXT,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_capacidad INTEGER,
  p_cantidad_pisos INTEGER,
  p_precio_hora NUMERIC,
  p_precio_por_dia NUMERIC,
  p_precio_por_mes NUMERIC,
  p_moneda TEXT,
  p_horario JSONB,
  p_abierto_24h BOOLEAN,
  p_caracteristicas JSONB,
  p_altura_maxima NUMERIC,
  p_detalles TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Esta es la clave: se ejecuta como el owner
SET search_path = public
AS $$
DECLARE
  v_estacionamiento_id UUID;
BEGIN
  -- Verificar que el usuario autenticado sea el propietario
  IF auth.uid() != p_propietario_id THEN
    RAISE EXCEPTION 'No autorizado: solo puedes crear estacionamientos para ti mismo';
  END IF;

  -- Insertar el estacionamiento
  INSERT INTO estacionamientos (
    propietario_id,
    nombre,
    tipo,
    detalles,
    direccion,
    lat,
    lng,
    capacidad,
    cantidad_pisos,
    precio_hora,
    precio_por_dia,
    precio_por_mes,
    moneda,
    horario,
    abierto_24h,
    caracteristicas,
    altura_maxima,
    espacios_disponibles,
    activo,
    verificado,
    estado_verificacion,
    es_marketplace,
    status,
    largo_cm,
    ancho_cm
  ) VALUES (
    p_propietario_id,
    p_nombre,
    p_tipo,
    p_detalles,
    p_direccion,
    p_lat,
    p_lng,
    p_capacidad,
    p_cantidad_pisos,
    p_precio_hora,
    p_precio_por_dia,
    p_precio_por_mes,
    p_moneda,
    p_horario,
    p_abierto_24h,
    p_caracteristicas,
    p_altura_maxima,
    p_capacidad, -- espacios_disponibles = capacidad inicial
    false, -- activo
    false, -- verificado
    'pendiente', -- estado_verificacion
    true, -- es_marketplace
    'libre', -- status
    500, -- largo_cm default
    200 -- ancho_cm default
  )
  RETURNING id INTO v_estacionamiento_id;

  RETURN v_estacionamiento_id;
END;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.insert_estacionamiento_pms TO authenticated;

-- Comentario
COMMENT ON FUNCTION public.insert_estacionamiento_pms IS 
  'Función para insertar estacionamientos desde el PMS. Usa SECURITY DEFINER para bypassear restricciones de RLS/GRANT.';

-- Verificar que se creó
SELECT 
  '✅ Función creada' as status,
  proname as nombre_funcion,
  prosecdef as security_definer
FROM pg_proc
WHERE proname = 'insert_estacionamiento_pms';

