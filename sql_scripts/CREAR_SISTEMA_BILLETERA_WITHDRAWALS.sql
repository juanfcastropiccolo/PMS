-- ============================================================================
-- Sistema de Billetera y Withdrawals para PMS
-- ============================================================================
-- Crea las tablas y funciones necesarias para manejar:
-- - Saldo acumulado de propietarios (después de comisión del 15%)
-- - Retiros (withdrawals) mensuales automáticos
-- - Cuentas bancarias/Mercado Pago configurables
-- - Historial completo de transacciones
-- - Integración con tablas existentes (reservas, mp_accounts_propietarios)
-- ============================================================================
--
-- IMPORTANTE:
-- - La comisión de Parkit es del 15% sobre cada reserva completada
-- - Los retiros se procesan el primer día hábil de cada mes
-- - Monto mínimo de retiro: $1.000 ARS
-- - Compatible con cuentas de Mercado Pago ya vinculadas
-- ============================================================================

-- PASO 1: Crear ENUM para tipos de cuenta
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE tipo_cuenta_cobro AS ENUM (
        'mercado_pago',
        'cuenta_bancaria'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PASO 2: Crear ENUM para estados de withdrawal
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE estado_withdrawal AS ENUM (
        'pendiente',
        'procesando',
        'completado',
        'rechazado',
        'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PASO 3: Tabla de cuentas de cobro
-- ============================================================================
CREATE TABLE IF NOT EXISTS cuentas_cobro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de cuenta
    tipo tipo_cuenta_cobro NOT NULL,
    
    -- Referencia opcional a cuenta MP ya vinculada
    mp_account_id UUID REFERENCES mp_accounts_propietarios(id) ON DELETE SET NULL,
    
    -- Datos Mercado Pago (si no usa cuenta ya vinculada)
    mp_email VARCHAR(255),
    mp_user_id VARCHAR(100),
    mp_access_token TEXT,
    mp_refresh_token TEXT,
    mp_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Datos Cuenta Bancaria
    banco VARCHAR(100),
    tipo_cuenta VARCHAR(50), -- 'caja_ahorro', 'cuenta_corriente'
    cbu VARCHAR(22),
    alias VARCHAR(100),
    titular VARCHAR(255),
    cuit_cuil VARCHAR(13),
    
    -- Referencia a datos fiscales (validación cruzada)
    usa_datos_fiscales BOOLEAN DEFAULT true,
    
    -- Estado
    verificada BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    es_principal BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT check_mp_data CHECK (
        (tipo = 'mercado_pago' AND (mp_email IS NOT NULL OR mp_account_id IS NOT NULL)) 
        OR tipo != 'mercado_pago'
    ),
    CONSTRAINT check_banco_data CHECK (
        (tipo = 'cuenta_bancaria' AND cbu IS NOT NULL AND titular IS NOT NULL) 
        OR tipo != 'cuenta_bancaria'
    ),
    CONSTRAINT check_cbu_length CHECK (
        tipo != 'cuenta_bancaria' OR length(cbu) = 22
    ),
    CONSTRAINT check_cuit_format CHECK (
        tipo != 'cuenta_bancaria' OR cuit_cuil IS NULL OR length(cuit_cuil) >= 11
    )
);

-- Índices para cuentas_cobro
CREATE INDEX IF NOT EXISTS idx_cuentas_cobro_propietario ON cuentas_cobro(propietario_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_cobro_principal ON cuentas_cobro(propietario_id, es_principal) WHERE es_principal = true;
CREATE INDEX IF NOT EXISTS idx_cuentas_cobro_mp_account ON cuentas_cobro(mp_account_id) WHERE mp_account_id IS NOT NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cuentas_cobro_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cuentas_cobro_updated_at ON cuentas_cobro;
CREATE TRIGGER trigger_update_cuentas_cobro_updated_at
    BEFORE UPDATE ON cuentas_cobro
    FOR EACH ROW
    EXECUTE FUNCTION update_cuentas_cobro_updated_at();

-- PASO 4: Tabla de billetera (saldo acumulado)
-- ============================================================================
CREATE TABLE IF NOT EXISTS billetera_propietarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Saldos
    saldo_disponible DECIMAL(10, 2) DEFAULT 0 CHECK (saldo_disponible >= 0),
    saldo_pendiente DECIMAL(10, 2) DEFAULT 0 CHECK (saldo_pendiente >= 0),
    saldo_retenido DECIMAL(10, 2) DEFAULT 0 CHECK (saldo_retenido >= 0),
    
    -- Totales históricos
    total_ganado DECIMAL(10, 2) DEFAULT 0,
    total_retirado DECIMAL(10, 2) DEFAULT 0,
    
    -- Metadata
    ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para billetera
CREATE INDEX IF NOT EXISTS idx_billetera_propietario ON billetera_propietarios(propietario_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_billetera_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.ultima_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_billetera_updated_at ON billetera_propietarios;
CREATE TRIGGER trigger_update_billetera_updated_at
    BEFORE UPDATE ON billetera_propietarios
    FOR EACH ROW
    EXECUTE FUNCTION update_billetera_updated_at();

-- PASO 5: Tabla de withdrawals (retiros)
-- ============================================================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cuenta_cobro_id UUID REFERENCES cuentas_cobro(id) ON DELETE SET NULL,
    
    -- Montos
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    moneda VARCHAR(3) DEFAULT 'ARS',
    
    -- Estado
    estado estado_withdrawal DEFAULT 'pendiente',
    
    -- Procesamiento
    fecha_solicitada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_procesamiento TIMESTAMP WITH TIME ZONE,
    fecha_completado TIMESTAMP WITH TIME ZONE,
    
    -- Información adicional
    motivo_rechazo TEXT,
    notas TEXT,
    referencia_externa VARCHAR(255), -- ID de transacción de MP o banco
    
    -- Datos de la cuenta al momento del retiro (snapshot)
    snapshot_cuenta JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_propietario ON withdrawals(propietario_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_estado ON withdrawals(estado);
CREATE INDEX IF NOT EXISTS idx_withdrawals_fecha_solicitada ON withdrawals(fecha_solicitada DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_withdrawals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER trigger_update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_withdrawals_updated_at();

-- PASO 6: Tabla de movimientos de billetera
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos_billetera (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de movimiento
    tipo VARCHAR(50) NOT NULL, -- 'ingreso_reserva', 'retiro', 'comision', 'ajuste'
    
    -- Montos
    monto DECIMAL(10, 2) NOT NULL,
    saldo_anterior DECIMAL(10, 2) NOT NULL,
    saldo_nuevo DECIMAL(10, 2) NOT NULL,
    
    -- Referencia
    referencia_tipo VARCHAR(50), -- 'reserva', 'withdrawal', 'ajuste_manual'
    referencia_id UUID,
    
    -- Descripción
    descripcion TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para movimientos
CREATE INDEX IF NOT EXISTS idx_movimientos_propietario ON movimientos_billetera(propietario_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_billetera(tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_billetera(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_referencia ON movimientos_billetera(referencia_tipo, referencia_id);

-- PASO 7: Función para crear billetera al registrarse
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_billetera_propietario()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO billetera_propietarios (propietario_id)
    VALUES (NEW.id)
    ON CONFLICT (propietario_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear billetera automáticamente
DROP TRIGGER IF EXISTS trigger_crear_billetera ON auth.users;
CREATE TRIGGER trigger_crear_billetera
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION crear_billetera_propietario();

-- PASO 8: Función para actualizar saldo al completar reserva
-- ============================================================================
-- NOTA: La comisión de Parkit (15%) ya debe estar calculada en NEW.comision_parkit
-- Si no está calculada, se asume 15% del monto_estacionamiento
CREATE OR REPLACE FUNCTION actualizar_saldo_reserva_completada()
RETURNS TRIGGER AS $$
DECLARE
    v_monto_propietario DECIMAL(10, 2);
    v_propietario_id UUID;
    v_saldo_anterior DECIMAL(10, 2);
    v_saldo_nuevo DECIMAL(10, 2);
    v_comision DECIMAL(10, 2);
BEGIN
    -- Solo procesar cuando una reserva pasa a estado 'completada'
    IF NEW.estado = 'completada' AND (OLD.estado IS NULL OR OLD.estado != 'completada') THEN
        
        -- Obtener propietario del estacionamiento
        SELECT propietario_id INTO v_propietario_id
        FROM estacionamientos
        WHERE id = NEW.estacionamiento_id;
        
        -- Si no hay propietario (estacionamiento free), no procesar pago
        IF v_propietario_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Calcular comisión si no está ya calculada (15%)
        v_comision := COALESCE(NEW.comision_parkit, NEW.monto_estacionamiento * 0.15);
        
        -- Calcular monto neto para el propietario
        v_monto_propietario := COALESCE(NEW.monto_estacionamiento, 0) - v_comision;
        
        -- Crear billetera si no existe
        INSERT INTO billetera_propietarios (propietario_id, saldo_disponible)
        VALUES (v_propietario_id, 0)
        ON CONFLICT (propietario_id) DO NOTHING;
        
        -- Obtener saldo actual
        SELECT COALESCE(saldo_disponible, 0) INTO v_saldo_anterior
        FROM billetera_propietarios
        WHERE propietario_id = v_propietario_id;
        
        -- Calcular nuevo saldo
        v_saldo_nuevo := v_saldo_anterior + v_monto_propietario;
        
        -- Actualizar billetera
        UPDATE billetera_propietarios
        SET 
            saldo_disponible = saldo_disponible + v_monto_propietario,
            total_ganado = total_ganado + v_monto_propietario
        WHERE propietario_id = v_propietario_id;
        
        -- Registrar movimiento de ingreso
        INSERT INTO movimientos_billetera (
            propietario_id,
            tipo,
            monto,
            saldo_anterior,
            saldo_nuevo,
            referencia_tipo,
            referencia_id,
            descripcion,
            metadata
        ) VALUES (
            v_propietario_id,
            'ingreso_reserva',
            v_monto_propietario,
            v_saldo_anterior,
            v_saldo_nuevo,
            'reserva',
            NEW.id,
            'Ingreso por reserva ' || COALESCE(NEW.codigo_reserva, NEW.id::text),
            jsonb_build_object(
                'monto_bruto', NEW.monto_estacionamiento,
                'comision', v_comision,
                'porcentaje_comision', 15,
                'monto_neto', v_monto_propietario,
                'estacionamiento_id', NEW.estacionamiento_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION actualizar_saldo_reserva_completada() IS 
'Actualiza automáticamente el saldo de la billetera del propietario cuando se completa una reserva.
Descuenta la comisión de Parkit (15%) y registra el movimiento con metadata completa.';

-- Trigger para actualizar saldo
DROP TRIGGER IF EXISTS trigger_actualizar_saldo_reserva ON reservas;
CREATE TRIGGER trigger_actualizar_saldo_reserva
    AFTER INSERT OR UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_saldo_reserva_completada();

-- PASO 9: RLS Policies
-- ============================================================================

-- RLS para cuentas_cobro
ALTER TABLE cuentas_cobro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietarios pueden ver sus cuentas" ON cuentas_cobro;
CREATE POLICY "Propietarios pueden ver sus cuentas"
    ON cuentas_cobro FOR SELECT
    USING (auth.uid() = propietario_id);

DROP POLICY IF EXISTS "Propietarios pueden crear sus cuentas" ON cuentas_cobro;
CREATE POLICY "Propietarios pueden crear sus cuentas"
    ON cuentas_cobro FOR INSERT
    WITH CHECK (auth.uid() = propietario_id);

DROP POLICY IF EXISTS "Propietarios pueden actualizar sus cuentas" ON cuentas_cobro;
CREATE POLICY "Propietarios pueden actualizar sus cuentas"
    ON cuentas_cobro FOR UPDATE
    USING (auth.uid() = propietario_id);

DROP POLICY IF EXISTS "Propietarios pueden eliminar sus cuentas" ON cuentas_cobro;
CREATE POLICY "Propietarios pueden eliminar sus cuentas"
    ON cuentas_cobro FOR DELETE
    USING (auth.uid() = propietario_id);

-- RLS para billetera_propietarios
ALTER TABLE billetera_propietarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietarios pueden ver su billetera" ON billetera_propietarios;
CREATE POLICY "Propietarios pueden ver su billetera"
    ON billetera_propietarios FOR SELECT
    USING (auth.uid() = propietario_id);

-- RLS para withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietarios pueden ver sus withdrawals" ON withdrawals;
CREATE POLICY "Propietarios pueden ver sus withdrawals"
    ON withdrawals FOR SELECT
    USING (auth.uid() = propietario_id);

DROP POLICY IF EXISTS "Propietarios pueden crear withdrawals" ON withdrawals;
CREATE POLICY "Propietarios pueden crear withdrawals"
    ON withdrawals FOR INSERT
    WITH CHECK (auth.uid() = propietario_id);

-- RLS para movimientos_billetera
ALTER TABLE movimientos_billetera ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Propietarios pueden ver sus movimientos" ON movimientos_billetera;
CREATE POLICY "Propietarios pueden ver sus movimientos"
    ON movimientos_billetera FOR SELECT
    USING (auth.uid() = propietario_id);

-- PASO 10: Comentarios
-- ============================================================================
COMMENT ON TABLE cuentas_cobro IS 
'Almacena las cuentas de cobro (Mercado Pago o bancarias) de los propietarios.
Puede referenciar a mp_accounts_propietarios existente o crear nueva configuración.
Soporta múltiples cuentas por propietario, marcando una como principal.';

COMMENT ON COLUMN cuentas_cobro.mp_account_id IS 
'Referencia a cuenta de Mercado Pago ya vinculada vía OAuth.
Si se usa, no es necesario completar mp_email, mp_user_id, etc.';

COMMENT ON COLUMN cuentas_cobro.usa_datos_fiscales IS 
'Si TRUE, valida que el CUIT/CUIL coincida con datos_fiscales del propietario.
Mejora la verificación y cumplimiento fiscal.';

COMMENT ON TABLE billetera_propietarios IS 
'Saldo acumulado de cada propietario después de comisión del 15%.
- saldo_disponible: Listo para retirar
- saldo_pendiente: Reservas confirmadas pero no completadas
- saldo_retenido: Retenciones temporales por políticas
- total_ganado: Histórico completo de ingresos
- total_retirado: Histórico de retiros procesados';

COMMENT ON TABLE withdrawals IS 
'Historial de retiros solicitados por propietarios.
Los retiros se procesan automáticamente el primer día hábil de cada mes.
Monto mínimo: $1.000 ARS. Estados: pendiente → procesando → completado.';

COMMENT ON TABLE movimientos_billetera IS 
'Registro detallado de todos los movimientos de saldo para auditoría y transparencia.
Tipos: ingreso_reserva, retiro, comision, ajuste.
Cada movimiento incluye saldo anterior/nuevo y metadata con detalles.';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT 
    'cuentas_cobro' as tabla,
    COUNT(*) as registros
FROM cuentas_cobro
UNION ALL
SELECT 
    'billetera_propietarios',
    COUNT(*)
FROM billetera_propietarios
UNION ALL
SELECT 
    'withdrawals',
    COUNT(*)
FROM withdrawals
UNION ALL
SELECT 
    'movimientos_billetera',
    COUNT(*)
FROM movimientos_billetera;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. PAGOS MENSUALES: Se procesan el primer día hábil de cada mes
-- 2. COMISIÓN PARKIT: 15% sobre cada reserva (descontada automáticamente)
-- 3. CUENTAS DE COBRO: Propietarios pueden configurar:
--    - Mercado Pago (usando mp_accounts_propietarios o nueva cuenta)
--    - Cuenta Bancaria (CBU, Alias, Titular, CUIT/CUIL)
-- 4. SALDO DISPONIBLE: Acumulado mensual listo para retiro
-- 5. MONTO MÍNIMO: $1.000 ARS para solicitar retiro
-- 6. AUDITORÍA: Todos los movimientos se registran con metadata completa
-- 7. BILLETERA AUTOMÁTICA: Se crea al completarse la primera reserva
-- 8. SEGURIDAD: RLS habilitado para que cada propietario vea solo sus datos
-- 9. INTEGRACIÓN: Compatible con sistema de reservas y MP existente
-- 10. TRANSPARENCIA: Cada ingreso muestra el desglose bruto/comisión/neto
-- ============================================================================
--
-- FLUJO DE TRABAJO:
-- 1. Usuario completa reserva → Trigger detecta
-- 2. Calcula: monto_bruto - comisión(15%) = monto_neto
-- 3. Acredita monto_neto a billetera_propietarios.saldo_disponible
-- 4. Registra movimiento en movimientos_billetera
-- 5. Propietario solicita retiro desde /dashboard/cobros
-- 6. Admin/Sistema procesa retiro el 1er día hábil del mes
-- 7. Transfiere a cuenta configurada (MP o bancaria)
-- 8. Actualiza withdrawal a estado 'completado'
-- ============================================================================

