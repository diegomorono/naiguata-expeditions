-- ─── 2. DATOS INICIALES ───────────────────────────────────────────────────────

INSERT INTO system_settings (key, value) VALUES
    ('last_valid_bcv',   '{"rate": 600.00, "updated_at": "2026-06-01T00:00:00Z"}'),
    ('tour_base_price',  '{"amount": 50.00, "currency": "USD"}'),
    ('max_capacity',     '{"per_date": 12}')
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

INSERT INTO system_settings (key, value) VALUES
('tour_base_price', '50'),
('max_capacity_per_date', '12');