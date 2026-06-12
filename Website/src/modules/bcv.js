/* ==========================================================================
   DOMINIO FINANCIERO - CONSULTA DE TASAS E INVENTARIO DESDE SUPABASE
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

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
            appStore.set({
                bcvRate: parseFloat(data.value),
                bcvSource: 'supabase_live'
            });
            console.log(`[Naiguatá API] Tasa BCV sincronizada exitosamente: B$. ${appStore.get().bcvRate}`);
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

        // 1. Definimos contenedores locales temporales
        let inventory = [];
        let logisticServices = [];
        let cateringCatalog = [];

        // 2. Procesamiento seguro asignando a las variables locales
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

        // 3. Modificamos el estado global de forma atómica e inmutable
        appStore.set({
            inventory,
            logisticServices,
            cateringCatalog
        });

        // --- ARQUITECTURA DE DATOS LISTOS ---
        // Leemos con .get() de forma segura para verificar la carga en la consola
        console.log("[Naiguatá API] Catálogos cargados. Total items:", {
            inventory: appStore.get().inventory?.length || 0,
            catering: appStore.get().cateringCatalog?.length || 0
        });

        // El CustomEvent 'app:data-ready' ha sido eliminado. 
        // La reactividad ahora se maneja automáticamente a través de las suscripciones al Store.

    } catch (error) {
        console.error("[Naiguatá API] Error crítico en red:", error);
    }
}