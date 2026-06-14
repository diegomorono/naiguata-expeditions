/* ==========================================================================
   DOMINIO FINANCIERO - CONSULTA DE TASAS E INVENTARIO DESDE SUPABASE
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

export async function resolveBcvRate() {
    try {
        console.log("[Naiguatá API] Consultando configuraciones globales en base de datos...");
        const supabase = await getSupabaseClient();

        // En lugar de pedir una sola fila, traemos todas las configuraciones del sistema
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value');

        if (error) throw error;

        if (data) {
            const settings = {};
            data.forEach(item => {
                if (item.key === 'last_valid_bcv') settings.bcvRate = parseFloat(item.value.rate);
                if (item.key === 'tour_base_price') settings.tourBasePrice = parseFloat(item.value.amount);
                if (item.key === 'max_capacity') settings.maxCapacityPerDate = parseInt(item.value.per_date, 10);
            });

            // Guardamos todo de forma segura en el store global
            appStore.set({
                ...appStore.get(),
                ...settings,
                bcvSource: 'supabase_live'
            });
            console.log("[Naiguatá API] Configuraciones globales sincronizadas con éxito:", settings);
        }
    } catch (err) {
        console.warn("[Naiguatá Fallback] Error resolviendo configuraciones remotas. Manteniendo respaldos:", err);
    }
}

/**
 * CARGA DIFERIDA (LAZY LOADING)
 * Se ejecuta únicamente cuando el usuario interactúa con la sección del formulario.
 */
export async function loadFormCatalogs() {
    // Control de seguridad: si el inventario ya tiene datos, cancelamos para evitar queries duplicadas
    const currentState = appStore.get();
    if (currentState.inventory && currentState.inventory.length > 0) {
        return;
    }

    try {
        const supabase = await getSupabaseClient();
        console.log("[Naiguatá API] [Lazy Load] Detectada proximidad al formulario. Descargando catálogos...");

        const [invRes, servRes, catRes] = await Promise.allSettled([
            supabase.from('inventory_stock').select('*'),
            supabase.from('logistic_services').select('*'),
            supabase.from('catering_inventory').select('*')
        ]);

        let inventory = [];
        let logisticServices = [];
        let cateringCatalog = [];

        if (invRes.status === 'fulfilled' && invRes.value.data) {
            inventory = invRes.value.data;
        } else {
            console.error("Error en inventory_stock:", invRes.reason || invRes.value?.error);
        }

        if (servRes.status === 'fulfilled' && servRes.value.data) {
            logisticServices = servRes.value.data;
        }

        if (catRes.status === 'fulfilled' && catRes.value.data) {
            cateringCatalog = catRes.value.data;
        }

        // Modificación del estado global de forma atómica
        appStore.set({
            inventory,
            logisticServices,
            cateringCatalog
        });

        console.log("[Naiguatá API] [Lazy Load] Catálogos cargados diferidamente. Total items:", {
            inventory: appStore.get().inventory?.length || 0,
            catering: appStore.get().cateringCatalog?.length || 0
        });

    } catch (error) {
        console.error("[Naiguatá API] Error crítico en red durante Lazy Load:", error);
    }
}