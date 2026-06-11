/* ==========================================================================
   DOMINIO FINANCIERO - CONSULTA DE TASAS E INVENTARIO DESDE SUPABASE
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appState } from '../config/state.js';

export async function resolveBcvRate() {
    try {
        console.log("[Naiguatá API] Consultando tasa cambiaria oficial en base de datos...");
        const supabase = await getSupabaseClient();

        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'last_valid_bcv')
            .single();

        if (error) throw error;

        if (data && data.value) {
            appState.bcvRate = parseFloat(data.value);
            appState.bcvSource = 'supabase_live';
            console.log(`[Naiguatá API] Tasa BCV sincronizada exitosamente: B$. ${appState.bcvRate}`);
        }
    } catch (err) {
        console.warn("[Naiguatá Fallback] Error resolviendo tasa BCV remota. Manteniendo respaldo por defecto:", err);
        // Preserva de manera segura el valor inicializado en state.js sin romper la ejecución
    }
}

export async function loadSystemSettings() {
    try {
        const supabase = await getSupabaseClient();
        console.log("[Naiguatá API] Iniciando carga de catálogos...");

        const [invRes, servRes, catRes] = await Promise.allSettled([
            supabase.from('inventory_stock').select('*'),
            supabase.from('logistic_services').select('*'),
            supabase.from('catering_inventory').select('*')
        ]);

        // Procesamiento seguro
        if (invRes.status === 'fulfilled' && invRes.value.data) {
            appState.inventory = invRes.value.data;
        } else {
            console.error("Error en inventory_stock:", invRes.reason || invRes.value?.error);
        }

        if (servRes.status === 'fulfilled' && servRes.value.data) {
            appState.logisticServices = servRes.value.data;
        }

        if (catRes.status === 'fulfilled' && catRes.value.data) {
            appState.cateringCatalog = catRes.value.data;
        }

        // --- ARQUITECTURA DE DATOS LISTOS ---
        console.log("[Naiguatá API] Catálogos cargados. Total items:", {
            inventory: appState.inventory?.length || 0,
            catering: appState.cateringCatalog?.length || 0
        });

        // DISPARADOR GLOBAL: Avisamos a los módulos que los datos existen
        window.dispatchEvent(new CustomEvent('app:data-ready'));

    } catch (error) {
        console.error("[Naiguatá API] Error crítico en red:", error);
    }
}