-- Schema setup for Expediciones Naiguatá database in Supabase

-- 1. Tabla de Configuración del Sistema
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Inserción de tasa BCV inicial
INSERT INTO system_settings (key, value)
VALUES ('last_valid_bcv', '{"rate": 40.00, "updated_at": "2026-06-06T16:00:00Z"}')
ON CONFLICT (key) DO NOTHING;

-- 2. Tabla de Catálogo de Inventario de Equipos (Módulo Stock)
CREATE TABLE IF NOT EXISTS inventory_stock (
    item_id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    owned_qty INTEGER NOT NULL DEFAULT 0,
    consignment_qty INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER GENERATED ALWAYS AS (owned_qty + consignment_qty) STORED,
    price_usd NUMERIC(10, 2) NOT NULL
);

-- Insertar stock base
INSERT INTO inventory_stock (item_id, item_name, owned_qty, consignment_qty, price_usd) VALUES
('sleeping-bag', 'Saco de Dormir (0-10°C)', 1, 3, 10.00),
('sleeping-pad', 'Esterilla/Aislante', 6, 0, 5.00),
('waterproof-poncho', 'Poncho Impermeable', 10, 0, 5.00),
('headlamp', 'Linterna Frontal', 2, 0, 5.00),
('tent-lantern', 'Linterna de Tienda', 4, 0, 5.00),
('backpack', 'Mochila de Travesía (35L)', 0, 1, 10.00)
ON CONFLICT (item_id) DO UPDATE SET 
    owned_qty = EXCLUDED.owned_qty, 
    consignment_qty = EXCLUDED.consignment_qty, 
    price_usd = EXCLUDED.price_usd;

-- 3. Tabla de Catering
CREATE TABLE IF NOT EXISTS catering_inventory (
    item_id TEXT PRIMARY KEY,
    item_name TEXT NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL
);

INSERT INTO catering_inventory (item_id, item_name, price_usd) VALUES
('guava-candy', 'Dulce de guayaba', 2.00),
('energy-bars', 'Barras Energéticas', 2.50),
('trail-mix', 'Mix de frutos secos (100g)', 4.00)
ON CONFLICT (item_id) DO UPDATE SET price_usd = EXCLUDED.price_usd;

-- 4. Tabla de Servicios Logísticos (Portadores)
CREATE TABLE IF NOT EXISTS logistic_services (
    service_id TEXT PRIMARY KEY,
    service_name TEXT NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL
);

INSERT INTO logistic_services (service_id, service_name, price_usd) VALUES
('porter-2p', 'Servicio de Portador para Carpa de 2 personas', 30.00),
('porter-3p', 'Servicio de Portador para Carpa de 3 personas', 40.00),
('porter-4p', 'Servicio de Portador para Carpa de 4 personas', 50.00)
ON CONFLICT (service_id) DO UPDATE SET price_usd = EXCLUDED.price_usd;

-- 5. Tabla Principal de Registros/Reservas
CREATE TABLE IF NOT EXISTS registrations (
    id TEXT PRIMARY KEY, -- NG-XXXXXX
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    group_code TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('M', 'F')),
    tent_preference TEXT NOT NULL, -- carpa_2p, carpa_3p, carpa_4p
    allergies TEXT NOT NULL,
    diet TEXT NOT NULL,
    medical TEXT,
    rentals JSONB DEFAULT '[]'::jsonb, -- Array de items de alquiler
    catering JSONB DEFAULT '[]'::jsonb, -- Array de items de catering con cantidades
    porter_service TEXT, -- service_id o null/no contratado
    total_usd NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- Pago Móvil, Binance, Zelle, Efectivo
    reference_number TEXT,
    status TEXT NOT NULL DEFAULT '🟡 Pendiente por Verificar' CHECK (status IN ('🟡 Pendiente por Verificar', '🟢 Confirmado', '🔴 Cancelado'))
);

-- 6. Tabla de Transacciones Financieras
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    registration_id TEXT REFERENCES registrations(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Ingreso', 'Egreso')),
    concept TEXT NOT NULL,
    category TEXT CHECK (category IN ('Catering/Alimentos', 'Guías Auxiliares', 'Logística/Transporte', 'Imprevistos', 'Ingreso Cliente', 'Permuta')),
    account TEXT NOT NULL CHECK (account IN ('Efectivo', 'Binance', 'Zelle', 'Banco Bs')),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'VES')),
    amount_original NUMERIC(10, 2) NOT NULL,
    exchange_rate NUMERIC(10, 2) NOT NULL,
    total_neto_usd NUMERIC(10, 2) NOT NULL
);

-- 7. Tabla del Checklist de Salidas por Fecha
CREATE TABLE IF NOT EXISTS checklist_salidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_fecha DATE NOT NULL,
    task_id TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_group_id TEXT,
    UNIQUE(id_fecha, task_id)
);

-- Habilitar RLS en registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Permitir inserciones públicas" ON registrations;
CREATE POLICY "Permitir inserciones públicas" ON registrations
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura al administrador" ON registrations;
CREATE POLICY "Permitir lectura al administrador" ON registrations
FOR SELECT USING (true); -- Permitir select para la lógica simple del panel (puedes ajustar según requieras)

DROP POLICY IF EXISTS "Permitir actualizaciones al administrador" ON registrations;
CREATE POLICY "Permitir actualizaciones al administrador" ON registrations
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir borrados al administrador" ON registrations;
CREATE POLICY "Permitir borrados al administrador" ON registrations
FOR DELETE USING (true);

-- Habilitar RLS y políticas en transacciones financieras
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a transacciones" ON financial_transactions FOR ALL USING (true);

-- Habilitar RLS y políticas en checklist_salidas
ALTER TABLE checklist_salidas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir todo a checklist" ON checklist_salidas FOR ALL USING (true);

-- RPC para registrar excursionista de forma atómica y verificar límite de cupos
CREATE OR REPLACE FUNCTION registrar_excursionista(
    p_id TEXT,
    p_date DATE,
    p_name TEXT,
    p_email TEXT,
    p_whatsapp TEXT,
    p_group_code TEXT,
    p_gender TEXT,
    p_tent_preference TEXT,
    p_allergies TEXT,
    p_diet TEXT,
    p_medical TEXT,
    p_rentals JSONB,
    p_catering JSONB,
    p_porter_service TEXT,
    p_total_usd NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT
) RETURNS JSONB AS $$
DECLARE
    v_total_reserved INTEGER;
    v_capacity_limit INTEGER := 12; -- Máximo de participantes por salida
    v_result JSONB;
BEGIN
    -- Bloquear registros de esa fecha para evitar race conditions
    PERFORM id FROM registrations WHERE date = p_date FOR UPDATE;

    -- Contar registros activos para esa fecha
    SELECT COUNT(*) INTO v_total_reserved 
    FROM registrations 
    WHERE date = p_date AND status != '🔴 Cancelado';

    IF v_total_reserved >= v_capacity_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cupos agotados para esta fecha.');
    END IF;

    -- Insertar la reserva
    INSERT INTO registrations (
        id, date, name, email, whatsapp, group_code, gender, 
        tent_preference, allergies, diet, medical, rentals, 
        catering, porter_service, total_usd, payment_method, reference_number, status
    ) VALUES (
        p_id, p_date, p_name, p_email, p_whatsapp, p_group_code, p_gender,
        p_tent_preference, p_allergies, p_diet, p_medical, p_rentals,
        p_catering, p_porter_service, p_total_usd, p_payment_method, p_reference_number, '🟡 Pendiente por Verificar'
    );

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$ LANGUAGE plpgsql;
