import { getSupabaseClient } from './config/supabase.js';
import { resolveBcvRate, loadSystemSettings } from './modules/bcv.js';
import { initElevationStepper, renderRouteGraphic } from './modules/route.js';
import { initGearChecklist } from './modules/checklist.js';
import { initBookingForm, restoreFormDraft } from './modules/booking.js';
import { initPaymentInstructions } from './modules/payments.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Inicializar UI inmediata (lo que el usuario ve al cargar)
    initElevationStepper();
    initGearChecklist();
    initBookingForm();
    initPaymentInstructions();

    // 2. Cargar datos de red (ordenados por dependencia)
    try {
        await getSupabaseClient(); // Primero la conexión
        await resolveBcvRate();    // Luego la tasa
        loadSystemSettings();      // Finalmente catálogos
        restoreFormDraft();        // Recuperar datos previos
        renderRouteGraphic();      // Dibujar elementos gráficos
    } catch (e) {
        console.error("Error al iniciar el núcleo:", e);
    }
});