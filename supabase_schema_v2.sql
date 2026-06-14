-- =============================================================================
-- supabase_schema_v2.sql
-- Migraciones segmentadas con RLS correctamente restrictivo
-- 
-- INSTRUCCIONES DE USO:
--   supabase migration new initial_schema
--   Pegar el contenido de este archivo en la migración generada.
--   supabase db push
-- =============================================================================

-- ─── 1. TABLAS BASE ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_settings (
    key   TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_stock (
    item_id          TEXT PRIMARY KEY,
    item_name        TEXT NOT NULL,
    owned_qty        INTEGER NOT NULL DEFAULT 0 CHECK (owned_qty >= 0),
    consignment_qty  INTEGER NOT NULL DEFAULT 0 CHECK (consignment_qty >= 0),
    total_quantity   INTEGER GENERATED ALWAYS AS (owned_qty + consignment_qty) STORED,
    price_usd        NUMERIC(10, 2) NOT NULL CHECK (price_usd > 0)
);

CREATE TABLE IF NOT EXISTS catering_inventory (
    item_id   TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd > 0)
);

CREATE TABLE IF NOT EXISTS logistic_services (
    service_id   TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    price_usd    NUMERIC(10, 2) NOT NULL CHECK (price_usd >= 0)
);

CREATE TABLE IF NOT EXISTS registrations (
    id               TEXT PRIMARY KEY,
    created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    date             DATE NOT NULL,
    name             TEXT NOT NULL,
    email            TEXT NOT NULL,
    whatsapp         TEXT NOT NULL,
    group_code       TEXT,
    gender           TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    tent_preference  TEXT NOT NULL CHECK (tent_preference IN ('carpa_2', 'carpa_3', 'carpa_4')),
    allergies        TEXT NOT NULL,
    diet             TEXT NOT NULL DEFAULT 'Estándar',
    medical          TEXT,
    rentals          JSONB DEFAULT '[]'::jsonb,
    catering         JSONB DEFAULT '[]'::jsonb,
    porter_service   TEXT,
    total_usd        NUMERIC(10, 2) NOT NULL CHECK (total_usd >= 50),
    payment_method   TEXT NOT NULL CHECK (payment_method IN ('pagomovil', 'binance', 'zelle', 'efectivo')),
    reference_number TEXT,
    status           TEXT NOT NULL DEFAULT '🟡 Pendiente por Verificar'
                     CHECK (status IN ('🟡 Pendiente por Verificar', '🟢 Confirmado', '🔴 Cancelado'))
);

CREATE TABLE IF NOT EXISTS financial_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('Ingreso', 'Egreso')),
    concept         TEXT NOT NULL,
    category        TEXT CHECK (category IN ('Catering/Alimentos', 'Guías Auxiliares', 'Logística/Transporte', 'Imprevistos', 'Ingreso Cliente', 'Permuta')),
    account         TEXT NOT NULL CHECK (account IN ('Efectivo', 'Binance', 'Zelle', 'Banco Bs')),
    currency        TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
    amount_original NUMERIC(10, 2) NOT NULL CHECK (amount_original > 0),
    exchange_rate   NUMERIC(10, 2) NOT NULL DEFAULT 1.0,
    total_neto_usd  NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS checklist_salidas (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_fecha         DATE NOT NULL,
    task_id          TEXT NOT NULL,
    completed        BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_group_id TEXT,
    UNIQUE(id_fecha, task_id)
);

-- Tabla auxiliar para control atómico de cupos (previene race conditions)
CREATE TABLE IF NOT EXISTS expedition_slots (
    date         DATE PRIMARY KEY,
    reserved     INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    max_capacity INTEGER NOT NULL DEFAULT 12 CHECK (max_capacity > 0)
);

-- ─── 2. DATOS INICIALES ───────────────────────────────────────────────────────

INSERT INTO system_settings (key, value) VALUES
    ('last_valid_bcv',   '{"rate": 40.00, "updated_at": "2026-06-01T00:00:00Z"}'),
    ('tour_base_price',  '{"amount": 50.00, "currency": "USD"}'),
    ('max_capacity',     '{"per_date": 12}'),
    ('payment_info',     '{"pagomovil_banco": "0102 - Banco de Venezuela", "pagomovil_telefono": "04121234567", "pagomovil_cedula": "V-12345678", "binance_email": "pagos@naiguata.com", "zelle_titular": "Naiguata Expeditions", "zelle_correo": "zelle@naiguata.com"}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO inventory_stock (item_id, item_name, owned_qty, consignment_qty, price_usd) VALUES
    ('sleeping-bag',      'Saco de Dormir (0-10°C)',  1, 3, 10.00),
    ('sleeping-pad',      'Esterilla/Aislante',       6, 0,  5.00),
    ('waterproof-poncho', 'Poncho Impermeable',       10, 0,  5.00),
    ('headlamp',          'Linterna Frontal',          2, 0,  5.00),
    ('tent-lantern',      'Linterna de Tienda',        4, 0,  5.00),
    ('backpack-35l',      'Mochila de Travesía (35L)', 0, 1, 10.00)
ON CONFLICT (item_id) DO UPDATE SET
    owned_qty       = EXCLUDED.owned_qty,
    consignment_qty = EXCLUDED.consignment_qty,
    price_usd       = EXCLUDED.price_usd;

INSERT INTO catering_inventory (item_id, item_name, price_usd) VALUES
    ('guava-candy',  'Dulce de guayaba',          2.00),
    ('energy-bars',  'Barras Energéticas',         2.50),
    ('trail-mix',    'Mix de frutos secos (100g)', 4.00)
ON CONFLICT (item_id) DO UPDATE SET price_usd = EXCLUDED.price_usd;

INSERT INTO logistic_services (service_id, service_name, price_usd) VALUES
    ('porter-2p', 'Servicio de Portador para Carpa de 2 personas', 30.00),
    ('porter-3p', 'Servicio de Portador para Carpa de 3 personas', 40.00),
    ('porter-4p', 'Servicio de Portador para Carpa de 4 personas', 50.00)
ON CONFLICT (service_id) DO UPDATE SET price_usd = EXCLUDED.price_usd;

-- ─── 3. ROW LEVEL SECURITY ────────────────────────────────────────────────────

-- Habilitar RLS en TODAS las tablas sensibles
ALTER TABLE registrations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_salidas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock        ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_inventory     ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistic_services      ENABLE ROW LEVEL SECURITY;

-- registrations: anónimo puede SOLO insertar (formulario público)
DROP POLICY IF EXISTS "anon_insert_registrations" ON registrations;
CREATE POLICY "anon_insert_registrations" ON registrations
    FOR INSERT TO anon WITH CHECK (true);

-- registrations: service_role tiene acceso completo (Edge Function del admin)
DROP POLICY IF EXISTS "service_role_all_registrations" ON registrations;
CREATE POLICY "service_role_all_registrations" ON registrations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- financial_transactions: SOLO service_role (nunca acceso público)
DROP POLICY IF EXISTS "service_role_all_financial" ON financial_transactions;
CREATE POLICY "service_role_all_financial" ON financial_transactions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- checklist_salidas: SOLO service_role
DROP POLICY IF EXISTS "service_role_all_checklist" ON checklist_salidas;
CREATE POLICY "service_role_all_checklist" ON checklist_salidas
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- expedition_slots: anónimo puede leer (para mostrar disponibilidad), solo service escribe
DROP POLICY IF EXISTS "anon_read_slots" ON expedition_slots;
CREATE POLICY "anon_read_slots" ON expedition_slots
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_write_slots" ON expedition_slots;
CREATE POLICY "service_role_write_slots" ON expedition_slots
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- system_settings: anónimo puede LEER (tasa BCV, precios base), solo service escribe
DROP POLICY IF EXISTS "anon_read_settings" ON system_settings;
CREATE POLICY "anon_read_settings" ON system_settings
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service_role_write_settings" ON system_settings;
CREATE POLICY "service_role_write_settings" ON system_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- inventory / catering / logistic: anónimo puede leer (mostrar en formulario), solo service escribe
DROP POLICY IF EXISTS "anon_read_inventory" ON inventory_stock;
CREATE POLICY "anon_read_inventory" ON inventory_stock FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "service_write_inventory" ON inventory_stock;
CREATE POLICY "service_write_inventory" ON inventory_stock FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_catering" ON catering_inventory;
CREATE POLICY "anon_read_catering" ON catering_inventory FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "service_write_catering" ON catering_inventory;
CREATE POLICY "service_write_catering" ON catering_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_logistic" ON logistic_services;
CREATE POLICY "anon_read_logistic" ON logistic_services FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "service_write_logistic" ON logistic_services;
CREATE POLICY "service_write_logistic" ON logistic_services FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 4. RPC ATÓMICA (REGISTRO LIBRE DE RACE CONDITIONS) ──────────────────────

CREATE OR REPLACE FUNCTION registrar_excursionista(
    p_id               TEXT,
    p_date             DATE,
    p_name             TEXT,
    p_email            TEXT,
    p_whatsapp         TEXT,
    p_group_code       TEXT,
    p_gender           TEXT,
    p_tent_preference  TEXT,
    p_allergies        TEXT,
    p_diet             TEXT,
    p_medical          TEXT,
    p_rentals          JSONB,
    p_catering         JSONB,
    p_porter_service   TEXT,
    p_total_usd        NUMERIC,   -- El cliente envía su cálculo; el server valida
    p_payment_method   TEXT,
    p_reference_number TEXT
) RETURNS JSONB
SECURITY DEFINER  -- Ejecuta con permisos del owner, no del caller anónimo
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_max_capacity  INTEGER;
    v_server_total  NUMERIC := 50.00;  -- Precio base
    v_rental_item   JSONB;
    v_catering_item JSONB;
    v_item_price    NUMERIC;
    v_item_qty      INTEGER;
    v_porter_price  NUMERIC := 0;
    v_updated_rows  INTEGER;
BEGIN
    -- 1. Leer capacidad máxima desde system_settings (configurable sin tocar código)
    SELECT (value->>'per_date')::INTEGER
    INTO v_max_capacity
    FROM system_settings
    WHERE key = 'max_capacity';

    v_max_capacity := COALESCE(v_max_capacity, 12);

    -- 2. Garantía atómica de cupos usando INSERT con ON CONFLICT
    --    Incrementa el contador solo si hay capacidad disponible
    INSERT INTO expedition_slots (date, reserved, max_capacity)
    VALUES (p_date, 1, v_max_capacity)
    ON CONFLICT (date) DO UPDATE
        SET reserved = expedition_slots.reserved + 1
        WHERE expedition_slots.reserved < expedition_slots.max_capacity
    RETURNING reserved INTO v_updated_rows;

    -- Si el UPDATE no afectó filas, los cupos están agotados
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Lo sentimos, los cupos para esta fecha se han agotado.');
    END IF;

    -- 3. Recalcular precio total SERVER-SIDE (nunca confiar en el cliente)
    -- Alquileres
    FOR v_rental_item IN SELECT * FROM jsonb_array_elements(p_rentals)
    LOOP
        SELECT price_usd INTO v_item_price
        FROM inventory_stock
        WHERE item_id = (v_rental_item->>'item_id');

        v_item_qty    := COALESCE((v_rental_item->>'qty')::INTEGER, 0);
        v_server_total := v_server_total + COALESCE(v_item_price, 0) * v_item_qty;
    END LOOP;

    -- Catering
    FOR v_catering_item IN SELECT * FROM jsonb_array_elements(p_catering)
    LOOP
        SELECT price_usd INTO v_item_price
        FROM catering_inventory
        WHERE item_id = (v_catering_item->>'item_id');

        v_item_qty    := COALESCE((v_catering_item->>'qty')::INTEGER, 0);
        v_server_total := v_server_total + COALESCE(v_item_price, 0) * v_item_qty;
    END LOOP;

    -- Portador
    IF p_porter_service IS NOT NULL THEN
        SELECT price_usd INTO v_porter_price
        FROM logistic_services
        WHERE service_id = p_porter_service;
        v_server_total := v_server_total + COALESCE(v_porter_price, 0);
    END IF;

    -- 4. Validar que el total del cliente no difiere en más de $0.01 (tolerancia de redondeo)
    IF ABS(v_server_total - p_total_usd) > 0.01 THEN
        -- Revertir el cupo reservado
        UPDATE expedition_slots SET reserved = reserved - 1 WHERE date = p_date;
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error de validación de precio. Recarga la página e intenta nuevamente.'
        );
    END IF;

    -- 5. Insertar el registro con el total validado por el servidor
    INSERT INTO registrations (
        id, date, name, email, whatsapp, group_code, gender,
        tent_preference, allergies, diet, medical, rentals,
        catering, porter_service, total_usd, payment_method, reference_number, status
    ) VALUES (
        p_id, p_date, p_name, p_email, p_whatsapp, p_group_code, p_gender,
        p_tent_preference, p_allergies, COALESCE(p_diet, 'Estándar'), p_medical, p_rentals,
        p_catering, p_porter_service, v_server_total, p_payment_method, p_reference_number,
        '🟡 Pendiente por Verificar'
    );

    -- 6. Registrar transacción financiera automáticamente
    INSERT INTO financial_transactions (
        registration_id, date, type, concept, category, account, currency,
        amount_original, exchange_rate, total_neto_usd
    )
    SELECT
        p_id,
        p_date,
        'Ingreso',
        'Ingreso Cliente: ' || p_name,
        'Ingreso Cliente',
        CASE p_payment_method
            WHEN 'pagomovil' THEN 'Banco Bs'
            WHEN 'binance'   THEN 'Binance'
            WHEN 'zelle'     THEN 'Zelle'
            ELSE 'Efectivo'
        END,
        CASE WHEN p_payment_method = 'pagomovil' THEN 'VES' ELSE 'USD' END,
        v_server_total,
        COALESCE((
            SELECT (value->>'rate')::NUMERIC
            FROM system_settings WHERE key = 'last_valid_bcv'
        ), 40.0),
        v_server_total;

    RETURN jsonb_build_object('success', true, 'id', p_id, 'total_usd', v_server_total);

EXCEPTION WHEN OTHERS THEN
    -- Revertir cupo en caso de error inesperado
    UPDATE expedition_slots SET reserved = GREATEST(reserved - 1, 0) WHERE date = p_date;
    RAISE;
END;
$$;

-- Otorgar permisos de ejecución solo al rol anónimo (para el formulario público)
GRANT EXECUTE ON FUNCTION registrar_excursionista TO anon;
