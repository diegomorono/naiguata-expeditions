/* ==========================================================================
   DOMINIO FINANCIERO - CONSULTA DE TASAS E INVENTARIO DESDE SUPABASE
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

/**
 * CAPA 1: Consumo Dinámico Localizado (API Externa)
 * Intenta obtener la tasa oficial del día con un timeout de 3 segundos.
 */
async function fetchExternalBcvRate() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
        // Usamos una API confiable de código abierto para la tasa BCV
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { 
            signal: controller.signal 
        });
        
        if (!response.ok) throw new Error('API Externa no respondió correctamente');
        
        const data = await response.json();
        // ve.dolarapi.com devuelve el promedio en el campo 'promedio'
        return parseFloat(data.promedio || data.price);
    } catch (err) {
        console.warn("[BCV Capa 1] Fallo o Timeout:", err.message);
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * CAPA 3: Alerta de Emergencia
 * Notifica al administrador cuando el sistema entra en modo de contingencia crítico.
 */
async function sendEmergencyAlert(errorDetails) {
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_name: "Diego Moroño",
                subject: "ALERTA: Sistema Naiguatá en Modo de Emergencia - Fallo de Conexión Base de Datos/BCV",
                message: `El sistema ha activado la Capa 3 de protección cambiaria. Fallo detectado: ${errorDetails}. Se está utilizando la tasa de emergencia hardcoded.`,
                is_emergency: "SÍ",
                timestamp: new Date().toLocaleString()
            })
        });
        console.log("[BCV Capa 3] Alerta de emergencia enviada al administrador.");
    } catch (e) {
        console.error("[BCV Capa 3] Error crítico al intentar enviar alerta:", e);
    }
}

export async function resolveBcvRate() {
    let finalRate = null;
    let source = 'fallback';

    console.log("[Naiguatá API] Iniciando resolución de tasa cambiaria (3 Capas)...");

    // --- CAPA 1: API EXTERNA ---
    finalRate = await fetchExternalBcvRate();
    if (finalRate) {
        source = 'external_api';
        console.log(`[BCV Capa 1] Tasa obtenida de API externa: ${finalRate}`);
    }

    // --- CAPA 2: SUPABASE (Fallback de Tasa) ---
    // También aprovechamos para traer el precio del tour y capacidad
    try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
            .from('system_settings')
            .select('key, value');

        if (error) throw error;

        const settings = {};
        if (data) {
            data.forEach(item => {
                // Manejamos tanto si el valor es un objeto como si es un valor directo (según core.js)
                const val = (typeof item.value === 'object' && item.value !== null) 
                    ? (item.value.rate || item.value.amount || item.value.per_date || item.value.value || item.value) 
                    : item.value;

                if (item.key === 'last_valid_bcv') {
                    settings.bcvRateDb = parseFloat(val);
                }
                if (item.key === 'tour_base_price') {
                    settings.tourBasePrice = parseFloat(val);
                }
                if (item.key === 'max_capacity') {
                    settings.maxCapacityPerDate = parseInt(val, 10);
                }
            });

            // Si la Capa 1 falló, usamos el valor de la base de datos
            if (!finalRate && settings.bcvRateDb) {
                finalRate = settings.bcvRateDb;
                source = 'supabase_fallback';
                console.log(`[BCV Capa 2] Usando última tasa válida de base de datos: ${finalRate}`);
            }

            // Actualizamos el store con los valores administrativos
            appStore.set({
                ...appStore.get(),
                tourBasePrice: settings.tourBasePrice || 50,
                maxCapacityPerDate: settings.maxCapacityPerDate || 12
            });
        }
    } catch (err) {
        console.warn("[BCV Capa 2] Error al conectar con Supabase:", err.message);
    }

    // --- CAPA 3: HARDCODE & ALERTA ---
    if (!finalRate) {
        finalRate = 45.00; // Tasa de emergencia hardcoded (ajustar según mercado actual)
        source = 'emergency_hardcode';
        console.error("[BCV Capa 3] ¡ALERTA! El sistema está operando con tasa de emergencia.");
        await sendEmergencyAlert("Fallo en Capa 1 (API) y Capa 2 (Database)");
    }

    // Guardamos la tasa final resuelta en el store global
    appStore.set({
        ...appStore.get(),
        bcvRate: finalRate,
        bcvSource: source
    });

    console.log(`[Naiguatá API] Tasa final resuelta: ${finalRate} (Origen: ${source})`);
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