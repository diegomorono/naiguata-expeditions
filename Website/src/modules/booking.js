/* ==========================================================================
   DOMINIO DE INSCRIPCIONES - FORMULARIO DE RESERVAS (REFACCIONADO)
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

export function initBookingForm() {
    // Se cambia 'booking-form' por 'expedition-form'
    const form = document.getElementById('expedition-form');
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
    calculateFormCosts(); // <-- ESTA ES LA LÍNEA QUE DEBES AGREGAR
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
    // 1. OBTENER EL PRECIO BASE DINÁMICO AL INICIO
    const basePrice = appStore.get().tourBasePrice || 50;
    let extraCosts = 0.00;

    // 2. SUMAR COSTOS MULTIPLICADOS DE EQUIPOS (STEPPERS NUMÉRICOS)
    document.querySelectorAll('.equipment-input').forEach(input => {
        const qty = parseInt(input.value || '0');
        const price = parseFloat(input.getAttribute('data-price') || '0');
        extraCosts += qty * price;
    });

    // 3. SUMAR COSTOS MULTIPLICADOS DE CATERING (STEPPERS NUMÉRICOS)
    document.querySelectorAll('.catering-input').forEach(input => {
        const qty = parseInt(input.value || '0');
        const price = parseFloat(input.getAttribute('data-price') || '0');
        extraCosts += qty * price;
    });

    // 4. CALCULAR SERVICIO DE PORTEO (Usando el valor numérico del input oculto)
    const porterValue = parseFloat(document.getElementById('logistic-carrier-select')?.value || '0');
    extraCosts += porterValue;

    // 5. MOSTRAR U OCULTAR EL RESUMEN DE ADICIONALES EN LA INTERFAZ
    const rentalSummaryRow = document.getElementById('rental-summary-row');
    const rentalCostDisplay = document.getElementById('rental-cost-display');
    if (rentalSummaryRow && rentalCostDisplay) {
        if (extraCosts > 0) {
            rentalSummaryRow.classList.remove('hidden');
            rentalCostDisplay.textContent = `+$${extraCosts.toFixed(2)} USD`;
        } else {
            rentalSummaryRow.classList.add('hidden');
        }
    }

    // 6. OPERACIONES FINALES
    const totalUSD = basePrice + extraCosts;
    const totalVES = totalUSD * (appStore.get().bcvRate || 1);

    // 7. ACTUALIZACIÓN DINÁMICA DE NODOS REALES EN TU HTML
    const totalUsdEl = document.getElementById('form-total-usd');
    const totalVesEl = document.getElementById('form-total-ves');
    
    if (totalUsdEl) totalUsdEl.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD);
    if (totalVesEl) totalVesEl.textContent = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(totalVES);
}

// --- LÓGICA DE PERSISTENCIA Y ENVÍO ---

async function handleFormSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const btnSubmit = document.getElementById('btn-submit-booking');

    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const supabase = await getSupabaseClient();
        const formData = new FormData(form);

        // 1. Extraemos los equipos estructurados como pares ID -> CANTIDAD
        const selectedRentals = {};
        document.querySelectorAll('.equipment-input').forEach(input => {
            const qty = parseInt(input.value || '0');
            if (qty > 0) {
                // Usamos el ID del input (o el atributo de base de datos) y su cantidad numérica
                selectedRentals[input.id] = qty;
            }
        });

        // 2. Extraemos el catering estructurado como pares ID -> CANTIDAD
        const selectedCatering = {};
        document.querySelectorAll('.catering-input').forEach(input => {
            const qty = parseInt(input.value || '0');
            if (qty > 0) {
                selectedCatering[input.id] = qty;
            }
        });

        // 3. Leer estado del portador (enviamos solo un booleano para validar del lado del servidor si aplica costo)
        const porterSelect = document.getElementById('logistic-carrier-select');
        const wantsPorter = porterSelect && porterSelect.value !== "0";
        
        const groupCode = formData.get('group_code') || 'INDIVIDUAL';

        // LLAMADO AL RPC ALTERADO: Ya no enviamos p_total_usd ni textos planos legibles
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
            p_diet: 'Estándar', 
            p_medical: sanearTexto(formData.get('medical') || 'Ninguna.'),
            
            // Enviamos los objetos JSON puros a la base de datos
            p_rentals: selectedRentals, 
            p_catering: selectedCatering,
            p_wants_porter: wantsPorter, 
            
            p_payment_method: formData.get('payment_method'),
            p_reference_number: sanearTexto(formData.get('reference_number') || 'N/A')
        });

        if (error) throw error;

        if (data && !data.success) {
            alert(data.message);
            return;
        }

        const generatedId = data.registration_id || data.id;
        localStorage.removeItem('naiguata_form_draft');
        form.reset();

        window.open(`/pass.html?id=${generatedId}`, '_blank');

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

export function saveFormDraft() {
    // Se cambia 'booking-form' por 'expedition-form'
    const form = document.getElementById('expedition-form');
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