/* ==========================================================================
   DOMINIO DE INSCRIPCIONES - FORMULARIO DE RESERVAS Y AUTOGUARDADO
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appState } from '../config/state.js';

export function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    // Escuchas reactivos para auto-guardado en LocalStorage ante cambios del cliente
    ['input', 'change'].forEach(evtType => {
        form.addEventListener(evtType, () => {
            saveFormDraft();
            calculateFormCosts();
        });
    });

    form.addEventListener('submit', handleFormSubmission);
}

function calculateFormCosts() {
    let basePrice = 50.00; // Tarifa fija estándar Naiguatá Expeditions (USD)
    let extraCosts = 0.00;

    // Sumar montos de alquiler de equipamiento adicional seleccionado
    document.querySelectorAll('.rental-checkbox:checked').forEach(box => {
        extraCosts += parseFloat(box.getAttribute('data-price') || '0');
    });

    // Sumar planes de alimentación/catering seleccionados
    document.querySelectorAll('.catering-radio:checked').forEach(radio => {
        extraCosts += parseFloat(radio.getAttribute('data-price') || '0');
    });

    // Cargo por servicio de portador si aplica
    const porterService = document.getElementById('hiker-porter')?.value;
    if (porterService === 'full') extraCosts += 35.00;
    if (porterService === 'shared') extraCosts += 20.00;

    const totalUSD = basePrice + extraCosts;
    const totalVES = totalUSD * appState.bcvRate;

    // Formateadores numéricos de precisión internacional
    const fmtUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD);
    const fmtVES = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(totalVES);

    const nodeUSD = document.getElementById('summary-total-usd');
    const nodeVES = document.getElementById('summary-total-ves');

    if (nodeUSD) nodeUSD.textContent = fmtUSD;
    if (nodeVES) nodeVES.textContent = fmtVES;
}

function sanearTexto(str) {
    if (!str) return '';
    return str.replace(/[<>'"/;`]/g, '').trim();
}

async function handleFormSubmission(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-booking');
    if (btnSubmit) btnSubmit.disabled = true;

    try {
        const supabase = await getSupabaseClient();

        // Extracción y saneamiento riguroso de variables contra inyecciones XSS
        const hikerName = sanearTexto(document.getElementById('hiker-name')?.value);
        const hikerEmail = sanearTexto(document.getElementById('hiker-email')?.value);
        const hikerWhatsapp = sanearTexto(document.getElementById('hiker-whatsapp')?.value);
        const hikerDate = document.getElementById('hiker-date')?.value;
        const hikerGender = document.getElementById('hiker-gender')?.value;
        const tentPref = document.getElementById('hiker-tent')?.value;
        const medical = sanearTexto(document.getElementById('hiker-medical')?.value || 'Ninguna');
        const allergies = sanearTexto(document.getElementById('hiker-allergies')?.value || 'Ninguna');
        const payMethod = document.getElementById('payment-method')?.value;
        const payRef = sanearTexto(document.getElementById('payment-ref')?.value || '');

        if (!hikerName || !hikerEmail || !hikerDate) {
            alert("Por favor completa los campos mandatorios del registro.");
            if (btnSubmit) btnSubmit.disabled = false;
            return;
        }

        // Estructuración del payload de datos para la tabla registrations en Supabase
        const registrationPayload = {
            name: hikerName,
            email: hikerEmail,
            whatsapp: hikerWhatsapp,
            date: hikerDate,
            gender: hikerGender,
            tent_preference: tentPref,
            medical_conditions: medical,
            allergies: allergies,
            payment_method: payMethod,
            payment_reference: payRef,
            status: '🟡 Pendiente por Verificar'
        };

        const { error } = await supabase.from('registrations').insert([registrationPayload]);
        if (error) throw error;

        // Limpieza preventiva de la sesión local al concretar el registro de forma exitosa
        localStorage.removeItem('naiguata_form_draft');
        
        alert("¡Inscripción registrada exitosamente! Nos vemos en la cumbre del Ávila.");
        document.getElementById('booking-form')?.reset();
        calculateFormCosts();

    } catch (err) {
        console.error("Falla en el envío del formulario:", err);
        alert("Ocurrió un error procesando tu inscripción en Supabase. Intenta nuevamente.");
    } finally {
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

export function saveFormDraft() {
    const draft = {
        name: document.getElementById('hiker-name')?.value,
        email: document.getElementById('hiker-email')?.value,
        whatsapp: document.getElementById('hiker-whatsapp')?.value,
        medical: document.getElementById('hiker-medical')?.value,
        allergies: document.getElementById('hiker-allergies')?.value,
    };
    localStorage.setItem('naiguata_form_draft', JSON.stringify(draft));
}

export function restoreFormDraft() {
    const raw = localStorage.getItem('naiguata_form_draft');
    if (!raw) return;
    try {
        const draft = JSON.parse(raw);
        if (draft.name) document.getElementById('hiker-name').value = draft.name;
        if (draft.email) document.getElementById('hiker-email').value = draft.email;
        if (draft.whatsapp) document.getElementById('hiker-whatsapp').value = draft.whatsapp;
        if (draft.medical) document.getElementById('hiker-medical').value = draft.medical;
        if (draft.allergies) document.getElementById('hiker-allergies').value = draft.allergies;
        calculateFormCosts();
    } catch (e) {
        console.error("Error parseando borrador técnico del LocalStorage:", e);
    }
}