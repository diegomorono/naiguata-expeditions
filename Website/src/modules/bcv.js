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
        
        // Peticiones paralelas de catálogos obligatorios para reducir latencia de red
        const [invRes, servRes, catRes] = await Promise.all([
            supabase.from('inventory_catalog').select('*').eq('available', true),
            supabase.from('logistic_services').select('*'),
            supabase.from('catering_catalog').select('*')
        ]);

        if (invRes.data) appState.inventory = invRes.data;
        if (servRes.data) appState.logisticServices = servRes.data;
        if (catRes.data) appState.cateringCatalog = catRes.data;

        console.log("[Naiguatá API] Catálogos y almacenes cargados de forma modular.");
        
        // Disparar evento para recalcular costos si el formulario ya está renderizado
        const triggerElement = document.getElementById('hiker-date');
        if (triggerElement) {
            triggerElement.dispatchEvent(new Event('change'));
        }
    } catch (error) {
        console.error("[Naiguatá API Error] Falla crítica descargando catálogos del ecosistema:", error);
    }
}