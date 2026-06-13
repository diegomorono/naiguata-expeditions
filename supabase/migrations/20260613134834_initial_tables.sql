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

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
