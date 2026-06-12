import { getSupabaseClient } from './config/supabase.js';
import { appStore } from './config/state.js';
import { resolveBcvRate, loadSystemSettings } from './modules/bcv.js';
import { initElevationStepper, renderRouteGraphic } from './modules/route.js';
import { initGearChecklist } from './modules/checklist.js';
import { initBookingForm, restoreFormDraft } from './modules/booking.js';
import { initPaymentInstructions } from './modules/payment.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] Montando la estructura de la aplicación...");

    // 1. INICIALIZACIÓN DE EVENT LISTENERS (Seguro hacerlo de primero)
    // Estas funciones solo deben "escuchar" clics y eventos, NO cargar datos todavía.
    initElevationStepper();
    initGearChecklist();
    initBookingForm();
    initPaymentInstructions();

    // 2. CONFIGURACIÓN DE SUSCRIPCIÓN REACTIVA GLOBAL
    // Aquí es donde la reactividad sucede de manera interna y atómica: 
    // Cuando el Store cambie tras cargarse bcv.js, renderizamos los componentes visuales restantes.
    appStore.subscribe(() => {
        console.log("[Main] Datos recibidos en el Store. Renderizando componentes remanentes...");

        // Ahora sí, llamamos a lo que necesita datos reales para pintarse o restaurarse
        restoreFormDraft();
        renderRouteGraphic();
    });

    // 3. FLUJO DE CARGA
    try {
        await getSupabaseClient();

        // Ejecutamos en paralelo para ganar velocidad
        await Promise.all([
            resolveBcvRate(),
            loadSystemSettings() // Al actualizar el Store con appStore.set(), se disparará automáticamente la suscripción de arriba
        ]);

    } catch (e) {
        console.error("Error crítico en la inicialización:", e);
    }
});