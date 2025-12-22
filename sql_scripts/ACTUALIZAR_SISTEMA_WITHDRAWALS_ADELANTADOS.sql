-- ============================================================================
-- Actualización: Sistema de Retiros Adelantados con Cargo Adicional
-- ============================================================================
-- NUEVAS REGLAS DE NEGOCIO:
-- - Monto mínimo de retiro: $20.000 ARS (antes $1.000)
-- - Retiros el 1er día hábil del mes: SIN cargo adicional (gratis)
-- - Retiros adelantados (antes del ciclo): CON cargo adicional por procesamiento
-- - Cargo adelantado configurable (ej: 5% extra sobre el monto)
-- ============================================================================

-- PASO 1: Agregar nuevas columnas a la tabla withdrawals
-- ============================================================================
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS es_adelantado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS porcentaje_cargo_adicional DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_cargo_adicional DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS monto_neto DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS fecha_programada_pago TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN withdrawals.es_adelantado IS 
'TRUE si el retiro es adelantado (antes del ciclo mensual).
FALSE si es retiro normal del ciclo mensual (sin cargo).';

COMMENT ON COLUMN withdrawals.porcentaje_cargo_adicional IS 
'Porcentaje de cargo adicional por retiro adelantado.
Ejemplo: 5.00 = 5% de cargo sobre el monto solicitado.
0 para retiros del ciclo mensual normal.';

COMMENT ON COLUMN withdrawals.monto_cargo_adicional IS 
'Monto calculado del cargo adicional en pesos.
Ejemplo: Si pide $20.000 con 5% cargo = $1.000 de cargo.';

COMMENT ON COLUMN withdrawals.monto_neto IS 
'Monto neto que recibirá el propietario después de descontar cargos.
Para retiro normal: monto_neto = monto
Para retiro adelantado: monto_neto = monto - monto_cargo_adicional';

COMMENT ON COLUMN withdrawals.fecha_programada_pago IS 
'Fecha del próximo ciclo de pago mensual.
Se calcula como el primer día hábil del próximo mes.';

-- PASO 2: Actualizar constraint de monto mínimo
-- ============================================================================
-- Eliminar constraint anterior si existe
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS withdrawals_monto_check;

-- Agregar nueva constraint con monto mínimo de $20.000
ALTER TABLE withdrawals 
ADD CONSTRAINT withdrawals_monto_check CHECK (monto >= 20000);

COMMENT ON CONSTRAINT withdrawals_monto_check ON withdrawals IS 
'El monto mínimo de retiro es $20.000 ARS';

-- PASO 3: Agregar constraint para validar cargos adelantados
-- ============================================================================
ALTER TABLE withdrawals DROP CONSTRAINT IF EXISTS check_cargo_adelantado;

ALTER TABLE withdrawals
ADD CONSTRAINT check_cargo_adelantado CHECK (
    (es_adelantado = false AND porcentaje_cargo_adicional = 0 AND monto_cargo_adicional = 0)
    OR (es_adelantado = true AND porcentaje_cargo_adicional > 0)
);

COMMENT ON CONSTRAINT check_cargo_adelantado ON withdrawals IS 
'Valida que:
- Retiros normales (es_adelantado=false) no tengan cargos
- Retiros adelantados (es_adelantado=true) tengan porcentaje de cargo > 0';

-- PASO 4: Función para calcular próximo día hábil del mes
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_proximo_dia_habil()
RETURNS DATE AS $$
DECLARE
    v_primer_dia DATE;
    v_dia_semana INTEGER;
BEGIN
    -- Obtener el primer día del próximo mes
    v_primer_dia := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')::DATE;
    
    -- Obtener día de la semana (0=Domingo, 6=Sábado)
    v_dia_semana := EXTRACT(DOW FROM v_primer_dia);
    
    -- Si es domingo (0), mover a lunes
    IF v_dia_semana = 0 THEN
        v_primer_dia := v_primer_dia + INTERVAL '1 day';
    -- Si es sábado (6), mover a lunes
    ELSIF v_dia_semana = 6 THEN
        v_primer_dia := v_primer_dia + INTERVAL '2 days';
    END IF;
    
    RETURN v_primer_dia;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_proximo_dia_habil() IS 
'Calcula el primer día hábil del próximo mes.
Si el 1 del mes cae en sábado o domingo, lo mueve al lunes siguiente.
Retorna DATE (sin hora).';

-- PASO 5: Función para calcular cargo por retiro adelantado
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_cargo_retiro_adelantado(
    p_monto DECIMAL,
    p_porcentaje DECIMAL DEFAULT 5.0
)
RETURNS TABLE(
    monto_cargo DECIMAL,
    monto_neto DECIMAL
) AS $$
BEGIN
    RETURN QUERY SELECT
        ROUND(p_monto * (p_porcentaje / 100), 2) as monto_cargo,
        ROUND(p_monto - (p_monto * (p_porcentaje / 100)), 2) as monto_neto;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calcular_cargo_retiro_adelantado(DECIMAL, DECIMAL) IS 
'Calcula el cargo adicional y monto neto para un retiro adelantado.
Parámetros:
  - p_monto: Monto solicitado para retiro
  - p_porcentaje: Porcentaje de cargo (default 5%)
Retorna:
  - monto_cargo: Cargo calculado
  - monto_neto: Monto que recibirá después del cargo';

-- Ejemplo de uso:
-- SELECT * FROM calcular_cargo_retiro_adelantado(20000, 5.0);
-- Resultado: monto_cargo = 1000, monto_neto = 19000

-- PASO 6: Trigger para auto-calcular valores del withdrawal
-- ============================================================================
CREATE OR REPLACE FUNCTION auto_calcular_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
    v_cargo DECIMAL;
    v_neto DECIMAL;
BEGIN
    -- Calcular fecha programada del próximo pago mensual
    NEW.fecha_programada_pago := calcular_proximo_dia_habil();
    
    -- Si es retiro adelantado, calcular cargos
    IF NEW.es_adelantado = true THEN
        -- Asegurar que tenga porcentaje (default 5% si no se especificó)
        IF NEW.porcentaje_cargo_adicional IS NULL OR NEW.porcentaje_cargo_adicional = 0 THEN
            NEW.porcentaje_cargo_adicional := 5.0; -- 5% por defecto
        END IF;
        
        -- Calcular cargo y monto neto
        SELECT monto_cargo, monto_neto 
        INTO v_cargo, v_neto
        FROM calcular_cargo_retiro_adelantado(NEW.monto, NEW.porcentaje_cargo_adicional);
        
        NEW.monto_cargo_adicional := v_cargo;
        NEW.monto_neto := v_neto;
        
        -- Agregar información en metadata
        NEW.metadata := jsonb_set(
            COALESCE(NEW.metadata, '{}'::jsonb),
            '{cargo_info}',
            jsonb_build_object(
                'es_adelantado', true,
                'porcentaje_aplicado', NEW.porcentaje_cargo_adicional,
                'cargo_calculado', v_cargo,
                'ahorro_si_espera', v_cargo,
                'fecha_proximo_ciclo', NEW.fecha_programada_pago
            )
        );
    ELSE
        -- Retiro normal del ciclo mensual: sin cargos
        NEW.porcentaje_cargo_adicional := 0;
        NEW.monto_cargo_adicional := 0;
        NEW.monto_neto := NEW.monto;
        
        -- Agregar información en metadata
        NEW.metadata := jsonb_set(
            COALESCE(NEW.metadata, '{}'::jsonb),
            '{cargo_info}',
            jsonb_build_object(
                'es_adelantado', false,
                'sin_cargos', true,
                'fecha_procesamiento', NEW.fecha_programada_pago
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_auto_calcular_withdrawal ON withdrawals;
CREATE TRIGGER trigger_auto_calcular_withdrawal
    BEFORE INSERT OR UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION auto_calcular_withdrawal();

COMMENT ON FUNCTION auto_calcular_withdrawal() IS 
'Trigger que se ejecuta antes de insertar/actualizar un withdrawal.
Calcula automáticamente:
- fecha_programada_pago (próximo día hábil del mes)
- monto_cargo_adicional (si es adelantado)
- monto_neto (monto final a recibir)
- metadata con información detallada del cargo';

-- PASO 7: Vista para análisis de retiros
-- ============================================================================
CREATE OR REPLACE VIEW v_resumen_withdrawals AS
SELECT 
    w.id,
    w.propietario_id,
    w.monto,
    w.es_adelantado,
    w.porcentaje_cargo_adicional,
    w.monto_cargo_adicional,
    w.monto_neto,
    w.estado,
    w.fecha_solicitada,
    w.fecha_programada_pago,
    w.fecha_completado,
    CASE 
        WHEN w.es_adelantado THEN 'Retiro Adelantado (con cargo)'
        ELSE 'Retiro Normal (sin cargo)'
    END as tipo_retiro,
    CASE 
        WHEN w.es_adelantado THEN 
            CONCAT('Cargo: ', w.porcentaje_cargo_adicional, '% = $', w.monto_cargo_adicional)
        ELSE 'Sin cargo'
    END as info_cargo,
    -- Días hasta el próximo ciclo
    EXTRACT(DAY FROM (w.fecha_programada_pago - w.fecha_solicitada::DATE)) as dias_hasta_proximo_ciclo,
    -- Info de la cuenta
    c.tipo as tipo_cuenta,
    CASE 
        WHEN c.tipo = 'mercado_pago' THEN c.mp_email
        WHEN c.tipo = 'cuenta_bancaria' THEN CONCAT(c.banco, ' - ', c.cbu)
    END as destino_pago
FROM withdrawals w
LEFT JOIN cuentas_cobro c ON w.cuenta_cobro_id = c.id;

COMMENT ON VIEW v_resumen_withdrawals IS 
'Vista resumen de todos los withdrawals con información calculada.
Incluye tipo de retiro, cargos, días hasta próximo ciclo, y destino de pago.';

-- PASO 8: Función helper para validar si puede hacer retiro adelantado
-- ============================================================================
CREATE OR REPLACE FUNCTION puede_solicitar_retiro(
    p_propietario_id UUID,
    p_monto DECIMAL,
    p_es_adelantado BOOLEAN DEFAULT false
)
RETURNS TABLE(
    puede_retirar BOOLEAN,
    mensaje TEXT,
    saldo_disponible DECIMAL,
    monto_minimo DECIMAL,
    cargo_si_adelantado DECIMAL,
    monto_neto_a_recibir DECIMAL
) AS $$
DECLARE
    v_saldo DECIMAL;
    v_monto_minimo DECIMAL := 20000;
    v_porcentaje_cargo DECIMAL := 5.0;
    v_cargo DECIMAL := 0;
    v_neto DECIMAL;
BEGIN
    -- Obtener saldo actual
    SELECT COALESCE(saldo_disponible, 0) INTO v_saldo
    FROM billetera_propietarios
    WHERE propietario_id = p_propietario_id;
    
    -- Calcular cargo si es adelantado
    IF p_es_adelantado THEN
        SELECT monto_cargo, monto_neto 
        INTO v_cargo, v_neto
        FROM calcular_cargo_retiro_adelantado(p_monto, v_porcentaje_cargo);
    ELSE
        v_cargo := 0;
        v_neto := p_monto;
    END IF;
    
    -- Validaciones
    IF v_saldo < p_monto THEN
        RETURN QUERY SELECT 
            false,
            'Saldo insuficiente. Disponible: $' || v_saldo::TEXT,
            v_saldo,
            v_monto_minimo,
            v_cargo,
            v_neto;
        RETURN;
    END IF;
    
    IF p_monto < v_monto_minimo THEN
        RETURN QUERY SELECT 
            false,
            'El monto mínimo de retiro es $' || v_monto_minimo::TEXT,
            v_saldo,
            v_monto_minimo,
            v_cargo,
            v_neto;
        RETURN;
    END IF;
    
    -- Todo OK
    RETURN QUERY SELECT 
        true,
        CASE 
            WHEN p_es_adelantado THEN 
                'Retiro adelantado aprobado. Cargo: $' || v_cargo::TEXT || ' (' || v_porcentaje_cargo::TEXT || '%)'
            ELSE 
                'Retiro normal aprobado. Sin cargos adicionales.'
        END,
        v_saldo,
        v_monto_minimo,
        v_cargo,
        v_neto;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION puede_solicitar_retiro(UUID, DECIMAL, BOOLEAN) IS 
'Valida si un propietario puede solicitar un retiro.
Verifica saldo disponible, monto mínimo, y calcula cargos si es adelantado.
Retorna toda la información necesaria para mostrar al usuario.';

-- Ejemplo de uso:
-- SELECT * FROM puede_solicitar_retiro('user-uuid-here', 25000, true);

-- PASO 9: Actualizar documentación en tabla
-- ============================================================================
COMMENT ON TABLE withdrawals IS 
'Historial de retiros solicitados por propietarios.

TIPOS DE RETIRO:
1. RETIRO NORMAL (es_adelantado = false):
   - Se procesa el primer día hábil del próximo mes
   - SIN cargo adicional (0%)
   - Monto neto = Monto solicitado

2. RETIRO ADELANTADO (es_adelantado = true):
   - Se procesa inmediatamente (1-2 días hábiles)
   - CON cargo adicional (default 5%)
   - Monto neto = Monto solicitado - cargo

REGLAS:
- Monto mínimo: $20.000 ARS
- Cargo adelantado configurable por admin
- fecha_programada_pago se calcula automáticamente
- monto_neto se calcula automáticamente vía trigger';

-- PASO 10: Datos de configuración
-- ============================================================================
-- Tabla para configurar porcentajes de cargo (opcional)
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insertar configuración de cargo por retiro adelantado
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo_dato)
VALUES 
    ('porcentaje_cargo_retiro_adelantado', '5.0', 'Porcentaje de cargo adicional por retiros adelantados', 'number'),
    ('monto_minimo_retiro', '20000', 'Monto mínimo en ARS para solicitar un retiro', 'number'),
    ('dia_procesamiento_retiros', '1', 'Día del mes para procesar retiros normales (1 = primer día hábil)', 'number')
ON CONFLICT (clave) DO UPDATE SET
    valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    updated_at = NOW();

COMMENT ON TABLE configuracion_sistema IS 
'Configuración global del sistema de retiros.
Permite ajustar porcentajes, montos mínimos y reglas sin modificar código.';

-- PASO 11: Verificación
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de Retiros Adelantados actualizado correctamente';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Nuevas reglas aplicadas:';
    RAISE NOTICE '   - Monto mínimo: $20.000';
    RAISE NOTICE '   - Retiros normales (ciclo mensual): SIN cargo';
    RAISE NOTICE '   - Retiros adelantados: CON cargo adicional (5%% default)';
    RAISE NOTICE '   - Cálculo automático vía triggers';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Nuevas funciones disponibles:';
    RAISE NOTICE '   - calcular_proximo_dia_habil()';
    RAISE NOTICE '   - calcular_cargo_retiro_adelantado(monto, porcentaje)';
    RAISE NOTICE '   - puede_solicitar_retiro(user_id, monto, es_adelantado)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Nueva vista disponible:';
    RAISE NOTICE '   - v_resumen_withdrawals';
END $$;

-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================

-- Ejemplo 1: Consultar si puede hacer retiro adelantado
-- SELECT * FROM puede_solicitar_retiro('user-uuid', 25000, true);

-- Ejemplo 2: Calcular cargo para un monto
-- SELECT * FROM calcular_cargo_retiro_adelantado(20000, 5.0);

-- Ejemplo 3: Ver próximo día de pago
-- SELECT calcular_proximo_dia_habil();

-- Ejemplo 4: Consultar resumen de withdrawals
-- SELECT * FROM v_resumen_withdrawals WHERE propietario_id = 'user-uuid' ORDER BY fecha_solicitada DESC;

-- Ejemplo 5: Insertar retiro adelantado (el trigger calculará todo automáticamente)
-- INSERT INTO withdrawals (propietario_id, cuenta_cobro_id, monto, es_adelantado)
-- VALUES ('user-uuid', 'cuenta-uuid', 25000, true);

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

