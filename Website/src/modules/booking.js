/* ==========================================================================
   DOMINIO DE INSCRIPCIONES - FORMULARIO DE RESERVAS (REFACCIONADO)
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

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

// --- CONFIGURACIÓN DE SUSCRIPCIÓN REACTIVA GLOBAL ---
// Reemplazamos la escucha del CustomEvent del navegador por una suscripción directa al Store
appStore.subscribe(() => {
    console.log("[Booking] Datos recibidos en el Store. Renderizando opciones...");
    renderBookingOptions();
});

function renderBookingOptions() {
    const cateringContainer = document.getElementById('catering-options-container');
    const rentalContainer = document.getElementById('rental-options-container');

    // 1. Render Catering usando .get() de forma inmutable
    if (cateringContainer && appStore.get().cateringCatalog) {
        cateringContainer.innerHTML = appStore.get().cateringCatalog.map(item => `
            <label class="option-item">
                <input type="radio" name="catering" class="catering-radio" value="${item.name}" data-price="${item.price}">
                ${item.name} - $${item.price}
            </label>
        `).join('');
    }

    // 2. Render Equipamiento (Inventory) usando .get() de forma inmutable
    if (rentalContainer && appStore.get().inventory) {
        rentalContainer.innerHTML = appStore.get().inventory.map(item => `
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
    // Extraemos la tasa cambiaria de forma segura consumiendo el contenedor protegido
    const totalVES = totalUSD * (appStore.get().bcvRate || 1);

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
        const formData = new FormData(form);

        // Extraer los arreglos de equipamiento y catering seleccionados (igual que en los cálculos)
        const selectedRentals = Array.from(document.querySelectorAll('.rental-checkbox:checked')).map(box => box.value);
        const selectedCatering = Array.from(document.querySelectorAll('.catering-radio:checked')).map(radio => radio.value);
        const porterService = document.getElementById('hiker-porter')?.value || 'No';
        const groupCode = formData.get('group_code') || 'INDIVIDUAL';

        // LLAMADO AL RPC: Ejecuta la función de control atómico de cupos
        const { data, error } = await supabase.rpc('registrar_excursionista', {
            p_id: crypto.randomUUID(),
            p_date: formData.get('date'),
            p_name: sanearTexto(formData.get('name')),
            p_email: sanearTexto(formData.get('email')),
            p_whatsapp: sanearTexto(formData.get('whatsapp')),
            p_group_code: groupCode,
            p_gender: formData.get('gender'),
            p_tent_preference: formData.get('tent_preference'),
            p_allergies: sanearTexto(formData.get('allergies') || 'Ninguna.'),
            p_diet: sanearTexto(formData.get('diet') || 'Estándar'),
            p_medical: sanearTexto(formData.get('medical') || 'Ninguna.'),
            p_rentals: JSON.stringify(selectedRentals),     // Enviado como texto serializado para el cast ::jsonb del RPC
            p_catering: JSON.stringify(selectedCatering),   // Enviado como texto serializado para el cast ::jsonb del RPC
            p_porter_service: porterService,
            p_total_usd: parseFloat(document.getElementById('summary-total-usd')?.textContent.replace(/[^0-9.]/g, '') || 0),
            p_payment_method: formData.get('payment_method'),
            p_reference_number: sanearTexto(formData.get('reference_number') || 'N/A')
        });

        if (error) throw error;

        // Validar si la base de datos rebotó la inscripción por falta de cupos
        if (data && !data.success) {
            alert(data.message); // Muestra: "Cupos completamente agotados para este sábado."
            return;
        }

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
    // Escapa caracteres peligrosos transformándolos en entidades HTML seguras
    return texto.toString().replace(/[<>"'`\\]/g, c => ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;',
        '\\': '&#x5C;'
    })[c]);
}

function saveFormDraft() {
    const form = document.getElementById('booking-form');
    if (!form) return;
    const data = new FormData(form);
    const obj = Object.fromEntries(data.entries());
    localStorage.setItem('naiguata_form_draft', JSON.stringify(obj));
}

export function restoreFormDraft() {
    const saved = localStorage.getItem('naiguata_form_draft');
    if (!saved) return;
    const data = JSON.parse(saved);
    Object.keys(data).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if (input) input.value = data[key];
    });
}