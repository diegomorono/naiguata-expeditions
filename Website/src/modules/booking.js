/* ==========================================================================
   DOMINIO DE INSCRIPCIONES - FORMULARIO DE RESERVAS (REFACCIONADO)
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appState } from '../config/state.js';

export function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    // Escuchas reactivos para auto-guardado
    ['input', 'change'].forEach(evtType => {
        form.addEventListener(evtType, () => {
            saveFormDraft();
            calculateFormCosts();
        });
    });

    form.addEventListener('submit', handleFormSubmission);
}

// --- NUEVA FUNCIÓN DE RENDERIZADO DINÁMICO ---
// Esta función escucha al evento global de datos
window.addEventListener('app:data-ready', () => {
    console.log("[Booking] Datos recibidos. Renderizando opciones...");
    renderBookingOptions();
});

function renderBookingOptions() {
    const cateringContainer = document.getElementById('catering-options-container');
    const rentalContainer = document.getElementById('rental-options-container');

    // 1. Render Catering
    if (cateringContainer && appState.cateringCatalog) {
        cateringContainer.innerHTML = appState.cateringCatalog.map(item => `
            <label class="option-item">
                <input type="radio" name="catering" class="catering-radio" value="${item.name}" data-price="${item.price}">
                ${item.name} - $${item.price}
            </label>
        `).join('');
    }

    // 2. Render Equipamiento (Inventory)
    if (rentalContainer && appState.inventory) {
        rentalContainer.innerHTML = appState.inventory.map(item => `
            <label class="option-item">
                <input type="checkbox" class="rental-checkbox" value="${item.name}" data-price="${item.price}">
                ${item.name} - $${item.price}
            </label>
        `).join('');
    }
}

// --- RESTO DE TU LÓGICA (CALCULOS Y ENVÍO) ---

function calculateFormCosts() {
    // Nota: Esta función ya funcionará porque el DOM habrá sido poblado 
    // antes de que el usuario interactúe.
    let basePrice = 50.00;
    let extraCosts = 0.00;

    document.querySelectorAll('.rental-checkbox:checked').forEach(box => {
        extraCosts += parseFloat(box.getAttribute('data-price') || '0');
    });

    document.querySelectorAll('.catering-radio:checked').forEach(radio => {
        extraCosts += parseFloat(radio.getAttribute('data-price') || '0');
    });

    const porterService = document.getElementById('hiker-porter')?.value;
    if (porterService === 'full') extraCosts += 35.00;
    if (porterService === 'shared') extraCosts += 20.00;

    const totalUSD = basePrice + extraCosts;
    const totalVES = totalUSD * (appState.bcvRate || 1); // Fallback por seguridad

    // ... (resto de tu lógica de formateo y actualización de nodos) ...
    document.getElementById('summary-total-usd')?.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD);
    document.getElementById('summary-total-ves')?.textContent = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(totalVES);
}

// ... (handleFormSubmission, sanearTexto, saveFormDraft, restoreFormDraft se mantienen IGUAL) ...