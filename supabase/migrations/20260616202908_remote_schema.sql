


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."register_hiker"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_reserved INTEGER;
    v_capacity_limit INTEGER := 13; -- Límite máximo establecido por Naiguatá Expeditions
    v_result JSONB;
BEGIN
    -- Bloquear inserciones simultáneas concurrentes para evitar sobrecupos (Race Conditions)
    PERFORM id FROM registrations WHERE date = p_date FOR UPDATE;

    -- Contar cuántos cupos activos existen para ese sábado específico
    SELECT COUNT(*) INTO v_total_reserved 
    FROM registrations 
    WHERE date = p_date AND status != '🔴 Cancelado';

    -- Validar si hay disponibilidad
    IF v_total_reserved >= v_capacity_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cupos completamente agotados para este sábado.');
    END IF;

    -- Insertar el registro limpio mapeado uno a uno con las variables de app.js
    INSERT INTO registrations (
        id, date, name, email, whatsapp, group_code, gender, 
        tent_preference, allergies, diet, medical, rentals, 
        catering, porter_service, total_usd, payment_method, reference_number, status
    ) VALUES (
        p_id, p_date, p_name, p_email, p_whatsapp, p_group_code, p_gender,
        p_tent_preference, p_allergies, p_diet, p_medical, p_rentals::jsonb,
        p_catering::jsonb, p_porter_service, p_total_usd, p_payment_method, p_reference_number, '🟡 Pendiente'
    );

    RETURN jsonb_build_object('success', true, 'message', 'Registro guardado exitosamente.');
END;
$$;


ALTER FUNCTION "public"."register_hiker"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_excursionista"("p_id" "uuid", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_wants_porter" boolean, "p_payment_method" "text", "p_reference_number" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
    v_capacity_limit INTEGER;
    v_base_price NUMERIC;
    v_porter_cost NUMERIC := 0.00;
    v_extra_costs NUMERIC := 0.00;
    v_calculated_total NUMERIC := 0.00;
    
    -- Variables para los ciclos de cálculo
    v_key TEXT;
    v_qty INT;
    v_item_price NUMERIC;
    
    -- Arreglos para reconstruir el texto compatible con tu esquema anterior
    v_final_rentals_text TEXT[] := ARRAY[]::TEXT[];
    v_final_catering_text TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 1. OBTENER CONFIGURACIONES CENTRALIZADAS (Capacidad y Precio Base)
    SELECT value::INTEGER INTO v_capacity_limit 
    FROM system_settings 
    WHERE key = 'max_capacity_per_date';

    SELECT value::NUMERIC INTO v_base_price 
    FROM system_settings 
    WHERE key = 'tour_base_price';
    
    -- Por si acaso no existe la llave en la tabla, definimos un fallback seguro
    IF v_base_price IS NULL THEN
        v_base_price := 50.00;
    END IF;

    -- 2. BLOQUEAR REGISTROS (Evitar race conditions)
    PERFORM id FROM registrations WHERE date = p_date FOR UPDATE;

    -- 3. CALCULAR LOGÍSTICA DE PORTEO (Ajusta el precio si tu servicio de porteo cuesta algo distinto a $30)
    IF p_wants_porter THEN
        v_porter_cost := 30.00; 
    END IF;

    -- 4. PROCESAR Y CALCULAR EQUIPOS (RENTALS)
    -- Recorremos el JSONB enviado por JS mapeando las cantidades
    FOR v_key, v_qty IN SELECT * FROM jsonb_each_text(p_rentals)
    LOOP
        -- IMPORTANTE: Aquí busca el precio del ítem en tu tabla de catálogo.
        -- Estoy asumiendo que tu catálogo de inventario está en 'system_settings' o una tabla similar.
        -- Si tus precios de inventario/catering están guardados en el appStore y no en tablas,
        -- puedes usar un CASE condicional aquí abajo con los IDs fijos de tus ítems:
        CASE v_key
            -- Ejemplo con IDs comunes de equipos. Reemplaza por tus IDs reales de los inputs:
            WHEN 'sleeping-bag' THEN v_item_price := 10.00;
            WHEN 'tent' THEN v_item_price := 15.00;
            WHEN 'trekking-poles' THEN v_item_price := 5.00;
            ELSE v_item_price := 0.00;
        END CASE;
        
        v_extra_costs := v_extra_costs + (v_item_price * v_qty);
        v_final_rentals_text := array_append(v_final_rentals_text, v_key || ' (x' || v_qty || ')');
    END LOOP;

    -- 5. PROCESAR Y CALCULAR CATERING
    FOR v_key, v_qty IN SELECT * FROM jsonb_each_text(p_catering)
    LOOP
        CASE v_key
            -- Ejemplo con IDs comunes de catering. Reemplaza por tus IDs reales de los inputs:
            WHEN 'menu-estandar' THEN v_item_price := 12.00;
            WHEN 'menu-premium' THEN v_item_price := 20.00;
            ELSE v_item_price := 0.00;
        END CASE;
        
        v_extra_costs := v_extra_costs + (v_item_price * v_qty);
        v_final_catering_text := array_append(v_final_catering_text, v_key || ' (x' || v_qty || ')');
    END LOOP;

    -- 6. CALCULAR EL TOTAL INDESTRUCTIBLE EN BACKEND
    v_calculated_total := v_base_price + v_extra_costs + v_porter_cost;

    -- 7. INSERTAR LA RESERVA CON EL TOTAL VERIFICADO Y LOS TEXTOS FORMATEADOS
    INSERT INTO registrations (
        id, date, name, email, whatsapp, group_code, gender, 
        tent_preference, allergies, diet, medical, rentals, 
        catering, porter_service, total_usd, payment_method, reference_number, status
    ) VALUES (
        p_id, p_date, p_name, p_email, p_whatsapp, p_group_code, p_gender,
        p_tent_preference, p_allergies, p_diet, p_medical, 
        to_jsonb(v_final_rentals_text), -- Guarda ["item (x2)"] manteniendo compatibilidad
        to_jsonb(v_final_catering_text),
        CASE WHEN p_wants_porter THEN 'Asignado ($' || v_porter_cost || ' USD)' ELSE 'No' END, 
        v_calculated_total, -- El total real calculado matemáticamente en el servidor
        p_payment_method, p_reference_number, '🟡 Pendiente por Verificar'
    );

    -- 8. RETORNO DE CONTROL
    RETURN jsonb_build_object(
        'success', true, 
        'registration_id', p_id
    );
END;
$_$;


ALTER FUNCTION "public"."registrar_excursionista"("p_id" "uuid", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_wants_porter" boolean, "p_payment_method" "text", "p_reference_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_excursionista"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    v_total_reserved INTEGER;
    v_capacity_limit INTEGER; -- Quitamos el := 12 de aquí
    v_result JSONB;
BEGIN
    -- Obtener dinámicamente el límite de capacidad de la tabla centralizada
    SELECT value::INTEGER INTO v_capacity_limit 
    FROM system_settings 
    WHERE key = 'max_capacity_per_date';

    -- Bloquear registros de esa fecha para evitar race conditions
    PERFORM id FROM registrations WHERE date = p_date FOR UPDATE;

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

    -- RETORNO ACTUALIZADO: Coincide con tu JS
    RETURN jsonb_build_object(
        'success', true, 
        'registration_id', p_id
    );
END;$$;


ALTER FUNCTION "public"."registrar_excursionista"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_transaccion_segura"("p_registration_id" "text", "p_date" "date", "p_type" "text", "p_concept" "text", "p_category" "text", "p_account" "text", "p_currency" "text", "p_amount_original" numeric, "p_exchange_rate" numeric, "p_total_neto_usd" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.financial_transactions (
        registration_id,
        date,
        type,
        concept,
        category,
        account,
        currency,
        amount_original,
        exchange_rate,
        total_neto_usd
    )
    VALUES (
        p_registration_id,
        p_date,
        p_type,
        p_concept,
        p_category,
        p_account,
        p_currency,
        p_amount_original,
        p_exchange_rate,
        p_total_neto_usd
    );
END;
$$;


ALTER FUNCTION "public"."registrar_transaccion_segura"("p_registration_id" "text", "p_date" "date", "p_type" "text", "p_concept" "text", "p_category" "text", "p_account" "text", "p_currency" "text", "p_amount_original" numeric, "p_exchange_rate" numeric, "p_total_neto_usd" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_canceled_slot"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (OLD.status != '🔴 Cancelado' AND NEW.status = '🔴 Cancelado') THEN
        UPDATE public.expedition_slots
        SET reserved = GREATEST(0, reserved - 1)
        WHERE date = NEW.date;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_canceled_slot"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" bigint NOT NULL,
    "username" "text" NOT NULL,
    "email" "text",
    "password_hash" "text"
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


ALTER TABLE "public"."admin_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."admin_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."catering_inventory" (
    "item_id" "text" NOT NULL,
    "item_name" "text" NOT NULL,
    "price_usd" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."catering_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_salidas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "id_fecha" "date" NOT NULL,
    "task_id" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "whatsapp_group_id" "text"
);


ALTER TABLE "public"."checklist_salidas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expedition_slots" (
    "date" "date" NOT NULL,
    "reserved" integer DEFAULT 0,
    "max_capacity" integer DEFAULT 13
);


ALTER TABLE "public"."expedition_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "registration_id" "text",
    "date" "date" NOT NULL,
    "type" "text" NOT NULL,
    "concept" "text" NOT NULL,
    "category" "text",
    "account" "text" NOT NULL,
    "currency" "text" NOT NULL,
    "amount_original" numeric(10,2) NOT NULL,
    "exchange_rate" numeric(10,2) NOT NULL,
    "total_neto_usd" numeric(10,2) NOT NULL,
    CONSTRAINT "financial_transactions_account_check" CHECK (("account" = ANY (ARRAY['Efectivo'::"text", 'Binance'::"text", 'Zelle'::"text", 'Banco Bs'::"text"]))),
    CONSTRAINT "financial_transactions_category_check" CHECK (("category" = ANY (ARRAY['Catering/Alimentos'::"text", 'Guías Auxiliares'::"text", 'Logística/Transporte'::"text", 'Imprevistos'::"text", 'Ingreso Cliente'::"text", 'Permuta'::"text"]))),
    CONSTRAINT "financial_transactions_currency_check" CHECK (("currency" = ANY (ARRAY['USD'::"text", 'VES'::"text"]))),
    CONSTRAINT "financial_transactions_type_check" CHECK (("type" = ANY (ARRAY['Ingreso'::"text", 'Egreso'::"text"])))
);


ALTER TABLE "public"."financial_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_stock" (
    "item_id" "text" NOT NULL,
    "item_name" "text" NOT NULL,
    "owned_qty" integer DEFAULT 0 NOT NULL,
    "consignment_qty" integer DEFAULT 0 NOT NULL,
    "total_quantity" integer GENERATED ALWAYS AS (("owned_qty" + "consignment_qty")) STORED,
    "price_usd" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."inventory_stock" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."logistic_services" (
    "service_id" "text" NOT NULL,
    "service_name" "text" NOT NULL,
    "price_usd" numeric(10,2) NOT NULL,
    "is_per_day" boolean DEFAULT false
);


ALTER TABLE "public"."logistic_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "whatsapp" "text" NOT NULL,
    "group_code" "text" DEFAULT 'INDIVIDUAL'::"text" NOT NULL,
    "gender" "text" NOT NULL,
    "tent_preference" "text" DEFAULT 'Individual'::"text" NOT NULL,
    "allergies" "text" DEFAULT 'Ninguna.'::"text",
    "diet" "text" NOT NULL,
    "medical" "text" DEFAULT 'Ninguna.'::"text",
    "rentals" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "catering" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "porter_service" "text" DEFAULT 'No'::"text",
    "total_usd" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "payment_method" "text" NOT NULL,
    "reference_number" "text" DEFAULT 'N/A'::"text",
    "status" "text" DEFAULT '🟡 Pendiente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."catering_inventory"
    ADD CONSTRAINT "catering_inventory_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."checklist_salidas"
    ADD CONSTRAINT "checklist_salidas_id_fecha_task_id_key" UNIQUE ("id_fecha", "task_id");



ALTER TABLE ONLY "public"."checklist_salidas"
    ADD CONSTRAINT "checklist_salidas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expedition_slots"
    ADD CONSTRAINT "expedition_slots_pkey" PRIMARY KEY ("date");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_stock"
    ADD CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."logistic_services"
    ADD CONSTRAINT "logistic_services_pkey" PRIMARY KEY ("service_id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");



CREATE OR REPLACE TRIGGER "trigger_release_slot" AFTER UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."sync_canceled_slot"();



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE SET NULL;



CREATE POLICY "Borrado de registros para admins" ON "public"."registrations" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Borrado exclusivo para admins" ON "public"."financial_transactions" FOR DELETE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Edición exclusiva para admins" ON "public"."financial_transactions" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Gestión completa catering para admins" ON "public"."catering_inventory" TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Gestión completa checklist para admins" ON "public"."checklist_salidas" TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Gestión completa stock para admins" ON "public"."inventory_stock" TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Inserción exclusiva para service_role" ON "public"."financial_transactions" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Lectura de registros para admins" ON "public"."registrations" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Lectura exclusiva para admins" ON "public"."financial_transactions" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Lectura pública catering" ON "public"."catering_inventory" FOR SELECT USING (true);



CREATE POLICY "Lectura pública inventory" ON "public"."inventory_stock" FOR SELECT USING (true);



CREATE POLICY "Lectura pública logistic" ON "public"."logistic_services" FOR SELECT USING (true);



CREATE POLICY "Lectura pública system_settings" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Modificación de registros para admins" ON "public"."registrations" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text")) WITH CHECK (((("auth"."jwt"() -> 'app_metadata'::"text") ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Permitir inserciones públicas" ON "public"."registrations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Permitir registro público" ON "public"."registrations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Permitir todo a checklist" ON "public"."checklist_salidas" USING (true);



CREATE POLICY "Permitir todo a transacciones" ON "public"."financial_transactions" USING (true);



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."catering_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_salidas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expedition_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_public" ON "public"."registrations" FOR INSERT WITH CHECK ((("status" = '🟡 Pendiente por Verificar'::"text") AND ("total_usd" >= (50)::numeric)));



ALTER TABLE "public"."inventory_stock" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."logistic_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."register_hiker"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."register_hiker"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_hiker"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "uuid", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_wants_porter" boolean, "p_payment_method" "text", "p_reference_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "uuid", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_wants_porter" boolean, "p_payment_method" "text", "p_reference_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "uuid", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_wants_porter" boolean, "p_payment_method" "text", "p_reference_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_excursionista"("p_id" "text", "p_date" "date", "p_name" "text", "p_email" "text", "p_whatsapp" "text", "p_group_code" "text", "p_gender" "text", "p_tent_preference" "text", "p_allergies" "text", "p_diet" "text", "p_medical" "text", "p_rentals" "jsonb", "p_catering" "jsonb", "p_porter_service" "text", "p_total_usd" numeric, "p_payment_method" "text", "p_reference_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."registrar_transaccion_segura"("p_registration_id" "text", "p_date" "date", "p_type" "text", "p_concept" "text", "p_category" "text", "p_account" "text", "p_currency" "text", "p_amount_original" numeric, "p_exchange_rate" numeric, "p_total_neto_usd" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_transaccion_segura"("p_registration_id" "text", "p_date" "date", "p_type" "text", "p_concept" "text", "p_category" "text", "p_account" "text", "p_currency" "text", "p_amount_original" numeric, "p_exchange_rate" numeric, "p_total_neto_usd" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_transaccion_segura"("p_registration_id" "text", "p_date" "date", "p_type" "text", "p_concept" "text", "p_category" "text", "p_account" "text", "p_currency" "text", "p_amount_original" numeric, "p_exchange_rate" numeric, "p_total_neto_usd" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_canceled_slot"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_canceled_slot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_canceled_slot"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."admin_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."admin_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."admin_users_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."catering_inventory" TO "anon";
GRANT ALL ON TABLE "public"."catering_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."catering_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_salidas" TO "anon";
GRANT ALL ON TABLE "public"."checklist_salidas" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_salidas" TO "service_role";



GRANT ALL ON TABLE "public"."expedition_slots" TO "anon";
GRANT ALL ON TABLE "public"."expedition_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."expedition_slots" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_stock" TO "anon";
GRANT ALL ON TABLE "public"."inventory_stock" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_stock" TO "service_role";



GRANT ALL ON TABLE "public"."logistic_services" TO "anon";
GRANT ALL ON TABLE "public"."logistic_services" TO "authenticated";
GRANT ALL ON TABLE "public"."logistic_services" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


