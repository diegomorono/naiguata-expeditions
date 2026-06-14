import { getSupabaseClient } from './config/supabase.js';
import { appStore } from './config/state.js';
import { resolveBcvRate, loadFormCatalogs } from './modules/bcv.js';
import { initElevationStepper, renderRouteGraphic } from './modules/route.js';
import { initGearChecklist } from './modules/checklist.js';
import { initBookingForm, restoreFormDraft } from './modules/booking.js';
import { initPaymentInstructions, loadPaymentData } from './modules/payment.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] Montando la estructura de la aplicación...");

    // 1. INICIALIZACIÓN DE EVENT LISTENERS (Seguro hacerlo de primero)
    initElevationStepper();
    initGearChecklist();
    initBookingForm();
    initPaymentInstructions();

    // 2. CONFIGURACIÓN DE SUSCRIPCIÓN REACTIVA GLOBAL
    appStore.subscribe(() => {
        console.log("[Main] Datos recibidos en el Store. Renderizando componentes remanentes...");
        restoreFormDraft();
        renderRouteGraphic();
    });

    // 3. FLUJO DE CARGA INMEDIATA (EAGER LOADING)
    try {
        await getSupabaseClient();

        // Ejecutamos únicamente la consulta de la tasa BCV al iniciar la carga de la página
        await resolveBcvRate();

        // Carga de forma segura los datos financieros desde la columna JSONB de Supabase
        await loadPaymentData();

        renderDynamicSystemValues();

    } catch (e) {
        console.error("Error crítico en la inicialización:", e);
    }

    // 4. INICIALIZACIÓN DE DISPARADORES DE LAZY LOADING
    setupLazyLoading();
});

/**
 * Configura los observadores y listeners para activar la carga diferida de los inventarios
 */
function setupLazyLoading() {
    // Selectores del DOM (Asegúrate de que coincidan con los IDs o clases reales de tus archivos HTML/UI)
    const bookingForm = document.querySelector('#booking-form') || document.querySelector('.booking-section');
    const reserveButton = document.querySelector('#btn-reservar') || document.querySelector('.btn-booking');

    // Disparador 1: Carga por clic directo en el botón de reservar
    if (reserveButton) {
        reserveButton.addEventListener('click', () => {
            loadFormCatalogs();
        });
    }

    // Disparador 2: Carga predictiva por scroll usando Intersection Observer
    if (bookingForm && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Si el usuario hace scroll y se acerca al formulario
                if (entry.isIntersecting) {
                    loadFormCatalogs();
                    // Una vez activada la carga, removemos el observer para liberar memoria
                    observer.unobserve(bookingForm);
                }
            });
        }, {
            // Margen de anticipación: inicia la petición 200px antes de que el formulario aparezca en pantalla
            rootMargin: '200px 0px'
        });

        observer.observe(bookingForm);
    }
}

function renderDynamicSystemValues() {
    const state = appStore.get();
    const currentPrice = state.tourBasePrice || 50;
    const currentCapacity = state.maxCapacityPerDate || 12;
    const bcvRate = state.bcvRate || 1;

    // Buscamos e inyectamos el precio en todos los elementos que lo muestren
    document.querySelectorAll('.tour-base-price-display').forEach(el => {
        el.textContent = currentPrice;
    });

    // Buscamos e inyectamos la capacidad máxima en la UI
    document.querySelectorAll('.max-capacity-display').forEach(el => {
        el.textContent = currentCapacity;
    });

    // Inyectar el precio en Bolívares y Tasa oficial
    const bcvDisplay = document.getElementById('bcv-price-display');
    if (bcvDisplay) {
        bcvDisplay.innerHTML = `Ref: Bs. ${(currentPrice * bcvRate).toFixed(2)} <small>(Tasa BCV: ${bcvRate})</small>`;
        bcvDisplay.style.color = '#10b981';
        bcvDisplay.style.fontWeight = '500';
    }

    const bcvRateInfo = document.getElementById('bcv-rate-info');
    if (bcvRateInfo) {
        bcvRateInfo.textContent = `Tasa Oficial BCV: Bs. ${bcvRate}`;
    }
}