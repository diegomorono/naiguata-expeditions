import { getSupabaseClient } from './config/supabase.js';
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

    // 2. CONFIGURACIÓN DEL EVENTO DE DATOS
    // Aquí es donde la "magia" sucede: esperamos a que bcv.js avise que tiene datos.
    window.addEventListener('app:data-ready', () => {
        console.log("[Main] Datos recibidos. Renderizando componentes...");

        // Ahora sí, llamamos a lo que necesita datos reales para pintarse
        restoreFormDraft();
        renderRouteGraphic();
        // Nota: Asegúrate de que tus funciones init... tengan lógica para actualizar el DOM
    });

    // 3. FLUJO DE CARGA
    try {
        await getSupabaseClient();

        // Ejecutamos en paralelo para ganar velocidad
        await Promise.all([
            resolveBcvRate(),
            loadSystemSettings() // ESTA FUNCIÓN DEBE DISPARAR EL EVENTO 'app:data-ready'
        ]);

    } catch (e) {
        console.error("Error crítico en la inicialización:", e);
    }
});