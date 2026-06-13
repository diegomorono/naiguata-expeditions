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