import { getSupabaseClient } from './config/supabase.js';
import { appStore } from './config/state.js';
import { resolveBcvRate, loadFormCatalogs } from './modules/bcv.js';
import { initGearChecklist } from './modules/checklist.js';
import { initBookingForm, restoreFormDraft } from './modules/booking.js';
import { initPaymentInstructions, loadPaymentData } from './modules/payment.js';

// Bandera para evitar ejecución prematura de renderizado antes del parseo del DOM
let isDomReady = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Main] Montando la estructura de la aplicación...");
    isDomReady = true;

    // 1. INICIALIZACIÓN DE EVENT LISTENERS
    initGearChecklist();
    initBookingForm();
    initPaymentInstructions();

    // 2. CONFIGURACIÓN DE SUSCRIPCIÓN REACTIVA GLOBAL
    appStore.subscribe(() => {
        // Guardia: Si el DOM no está listo, evitamos intentos de manipulación
        if (!isDomReady) return;

        console.log("[Main] Datos recibidos en el Store. Renderizando componentes remanentes...");
        restoreFormDraft();
        renderDynamicSystemValues();
    });

    // 3. FLUJO DE CARGA INMEDIATA (EAGER LOADING)
    try {
        await getSupabaseClient();
        await resolveBcvRate();
        await loadPaymentData();

        // Renderizado inicial garantizado después del DOMContentLoaded
        renderDynamicSystemValues();

    } catch (e) {
        console.error("Error crítico en la inicialización:", e);
        renderDynamicSystemValues();
    }

    // 4. INICIALIZACIÓN DE DISPARADORES DE LAZY LOADING
    setupLazyLoading();
});

/**
 * Configura los observadores y listeners para activar la carga diferida
 */
function setupLazyLoading() {
    const bookingForm = document.querySelector('#booking-form') || document.querySelector('.booking-section');
    const reserveButton = document.querySelector('#btn-reservar') || document.querySelector('.btn-booking');

    if (reserveButton) {
        reserveButton.addEventListener('click', () => {
            loadFormCatalogs();
        });
    }

    if (bookingForm && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadFormCatalogs();
                    observer.unobserve(bookingForm);
                }
            });
        }, {
            rootMargin: '200px 0px'
        });

        observer.observe(bookingForm);
    }
}

/**
 * Inyecta dinámicamente los valores económicos y logísticos
 * Nota: Implementa comprobación de existencia (Guardia) para cada elemento
 */
function renderDynamicSystemValues() {
    if (!isDomReady) return;

    try {
        const state = appStore.get();
        const currentPrice = state.tourBasePrice || 50;
        const currentCapacity = state.maxCapacityPerDate || 12;
        const bcvRate = state.bcvRate || 1;

        const priceElements = document.querySelectorAll('.tour-base-price-display');
        priceElements.forEach(el => el.textContent = currentPrice);

        const capacityElements = document.querySelectorAll('.max-capacity-display');
        capacityElements.forEach(el => el.textContent = currentCapacity);

        const bcvDisplay = document.getElementById('bcv-price-display');
        if (bcvDisplay) {
            const totalBs = currentPrice * bcvRate;
            const formattedBs = totalBs.toLocaleString('es-VE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            bcvDisplay.innerHTML = `<span style="color: var(--secondary); font-weight: 700;">Bs. ${formattedBs}</span> al cambio BCV`;
            bcvDisplay.style.color = '';
            bcvDisplay.style.fontWeight = '';
        }

        const bcvRateInfo = document.getElementById('bcv-rate-info');
        if (bcvRateInfo) {
            bcvRateInfo.textContent = `Tasa Oficial BCV: Bs. ${bcvRate}`;
        }
    } catch (error) {
        console.warn("[Render] Error no crítico durante la actualización de valores:", error);
    }
}