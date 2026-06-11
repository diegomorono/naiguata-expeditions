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

// --- LÓGICA DE PERSISTENCIA Y ENVÍO ---

async function handleFormSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const btnSubmit = document.getElementById('btn-submit-booking');

    // Desactivar botón para evitar envíos duplicados
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const supabase = await getSupabaseClient();

        // Recopilación de datos
        const formData = new FormData(form);
        const registrationPayload = {
            name: sanearTexto(formData.get('name')),
            email: sanearTexto(formData.get('email')),
            whatsapp: sanearTexto(formData.get('whatsapp')),
            date: formData.get('date'),
            gender: formData.get('gender'),
            tent_preference: formData.get('tent_preference'),
            medical: sanearTexto(formData.get('medical')),
            allergies: sanearTexto(formData.get('allergies')),
            payment_method: formData.get('payment_method'),
            reference_number: sanearTexto(formData.get('reference_number')),
            // Aquí capturamos los precios dinámicos calculados
            total_usd: parseFloat(document.getElementById('summary-total-usd')?.textContent.replace(/[^0-9.]/g, '') || 0),
            status: '🟡 Pendiente por Verificar'
        };

        // --- CORRECCIÓN CRÍTICA DE SINTAXIS ---
        // Asegúrate de usar 'const { error }' y no asignar variables dentro del if
        const { error } = await supabase.from('registrations').insert([registrationPayload]);

        if (error) throw error;

        alert("¡Inscripción exitosa! Nos vemos en el Ávila.");
        localStorage.removeItem('naiguata_form_draft');
        form.reset();

    } catch (err) {
        console.error("Error al enviar:", err);
        alert("Hubo un error al procesar tu inscripción. Revisa la consola.");
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

function sanearTexto(texto) {
    if (!texto) return '';
    // Elimina caracteres peligrosos para evitar inyecciones XSS básicas
    return texto.toString().replace(/[<>]/g, '');
}

function saveFormDraft() {
    const form = document.getElementById('booking-form');
    if (!form) return;
    const data = new FormData(form);
    const obj = Object.fromEntries(data.entries());
    localStorage.setItem('naiguata_form_draft', JSON.stringify(obj));
}

function restoreFormDraft() {
    const saved = localStorage.getItem('naiguata_form_draft');
    if (!saved) return;
    const data = JSON.parse(saved);
    Object.keys(data).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = data[key];
    });
}