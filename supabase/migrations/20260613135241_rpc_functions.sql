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
    p_total_usd        NUMERIC,
    p_payment_method   TEXT,
    p_reference_number TEXT
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_max_capacity  INTEGER;
    v_server_total  NUMERIC := 50.00;
    v_rental_item   JSONB;
    v_catering_item JSONB;
    v_item_price    NUMERIC;
    v_item_qty      INTEGER;
    v_porter_price  NUMERIC := 0;
    v_updated_rows  INTEGER;
BEGIN
    -- 1. Leer capacidad configurada
    SELECT (value->>'per_date')::INTEGER
    INTO v_max_capacity
    FROM system_settings
    WHERE key = 'max_capacity';

    v_max_capacity := COALESCE(v_max_capacity, 12);

    -- 2. Manejo de concurrencia atómica de cupos
    INSERT INTO expedition_slots (date, reserved, max_capacity)
    VALUES (p_date, 1, v_max_capacity)
    ON CONFLICT (date) DO UPDATE
        SET reserved = expedition_slots.reserved + 1
        WHERE expedition_slots.reserved < expedition_slots.max_capacity
    RETURNING reserved INTO v_updated_rows;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Lo sentimos, los cupos para esta fecha se han agotado.');
    END IF;

    -- 3. Recálculo e integridad de precios server-side
    FOR v_rental_item IN SELECT * FROM jsonb_array_elements(p_rentals)
    LOOP
        SELECT price_usd INTO v_item_price FROM inventory_stock WHERE item_id = (v_rental_item->>'item_id');
        v_item_qty    := COALESCE((v_rental_item->>'qty')::INTEGER, 0);
        v_server_total := v_server_total + COALESCE(v_item_price, 0) * v_item_qty;
    END LOOP;

    FOR v_catering_item IN SELECT * FROM jsonb_array_elements(p_catering)
    LOOP
        SELECT price_usd INTO v_item_price FROM catering_inventory WHERE item_id = (v_catering_item->>'item_id');
        v_item_qty    := COALESCE((v_catering_item->>'qty')::INTEGER, 0);
        v_server_total := v_server_total + COALESCE(v_item_price, 0) * v_item_qty;
    END LOOP;

    IF p_porter_service IS NOT NULL THEN
        SELECT price_usd INTO v_porter_price FROM logistic_services WHERE service_id = p_porter_service;
        v_server_total := v_server_total + COALESCE(v_porter_price, 0);
    END IF;

    -- 4. Validación estricta contra manipulaciones en cliente
    IF ABS(v_server_total - p_total_usd) > 0.01 THEN
        UPDATE expedition_slots SET reserved = reserved - 1 WHERE date = p_date;
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error de validación de precio. Recarga la página e intenta nuevamente.'
        );
    END IF;

    -- 5. Inserción del registro definitivo
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

    -- 6. Generación automatizada de asiento contable
    INSERT INTO financial_transactions (
        registration_id, date, type, concept, category, account, currency,
        amount_original, exchange_rate, total_neto_usd
    )
    SELECT
        p_id, p_date, 'Ingreso', 'Ingreso Cliente: ' || p_name, 'Ingreso Cliente',
        CASE p_payment_method
            WHEN 'pagomovil' THEN 'Banco Bs'
            WHEN 'binance'   THEN 'Binance'
            WHEN 'zelle'     THEN 'Zelle'
            ELSE 'Efectivo'
        END,
        CASE WHEN p_payment_method = 'pagomovil' THEN 'VES' ELSE 'USD' END,
        v_server_total,
        COALESCE((SELECT (value->>'rate')::NUMERIC FROM system_settings WHERE key = 'last_valid_bcv'), 40.0),
        v_server_total;

    -- RETORNO PERSONALIZADO: Retorna 'registration_id' para compatibilidad con tu JS frontend
    RETURN jsonb_build_object(
        'success', true, 
        'registration_id', p_id,
        'total_usd', v_server_total
    );

EXCEPTION WHEN OTHERS THEN
    UPDATE expedition_slots SET reserved = GREATEST(reserved - 1, 0) WHERE date = p_date;
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_excursionista TO anon;