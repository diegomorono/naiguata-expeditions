/* ==========================================================================
   DOMINIO DE INSCRIPCIONES - FORMULARIO DE RESERVAS
   ========================================================================== */

import { getSupabaseClient } from '../config/supabase.js';
import { appStore } from '../config/state.js';

export function initBookingForm() {
    const form = document.getElementById('expedition-form');
    if (!form) return;

    // Poblar fechas de los próximos 4 sábados
    populateDates();

    // Eventos reactivos de autoguardado y cálculo de costos
    ['input', 'change'].forEach(evtType => {
        form.addEventListener(evtType, (e) => {
            saveFormDraft();
            calculateFormCosts();
        });
    });

    form.addEventListener('submit', handleFormSubmission);

    // Inicializar botones Stepper (+/-)
    document.querySelectorAll('.stepper-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            let val = parseInt(input.value || '0', 10);
            if (e.target.classList.contains('plus')) {
                const max = parseInt(input.getAttribute('data-max') || '99', 10);
                if (val < max) val++;
            } else if (e.target.classList.contains('minus')) {
                const min = parseInt(input.getAttribute('min') || '0', 10);
                if (val > min) val--;
            }

            input.value = val;
            input.dispatchEvent(new Event('change')); // Desencadena el cálculo
        });
    });

    // Inicializar botones del Portador (Carrier buttons)
    document.querySelectorAll('.carrier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.carrier-btn').forEach(b => b.classList.remove('active'));
            const currentBtn = e.target.closest('.carrier-btn');
            currentBtn.classList.add('active');

            const select = document.getElementById('logistic-carrier-select');
            if (select) {
                select.value = currentBtn.getAttribute('data-value');
                select.dispatchEvent(new Event('change'));
            }
        });
    });

    // NUEVO: Escuchador para validación de disponibilidad por fecha
    const dateSelect = document.getElementById('booking-date');
    if (dateSelect) {
        dateSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val && val !== 'custom') {
                checkDateAvailability(val);
            } else if (val === 'custom') {
                // Si es fecha personalizada, siempre permitimos (el guía coordinará luego)
                const dateTip = document.getElementById('booking-date')?.closest('.form-input-wrapper')?.querySelector('.input-tip');
                const btnSubmit = document.getElementById('btn-submit-booking');
                if (dateTip) {
                    dateTip.innerHTML = "✨ <strong>¡Excelente elección!</strong> Procesa tu registro y coordinaremos la fecha propuesta contigo.";
                    dateTip.style.color = "var(--secondary)";
                }
                if (btnSubmit) btnSubmit.disabled = false;
            }
        });
    }

    // Suscripción al estado global
    appStore.subscribe(() => {
        calculateFormCosts();
    });
}

/**
 * CONSULTA DE DISPONIBILIDAD EN TIEMPO REAL
 * Cruza los datos de stock total vs reservas confirmadas para la fecha.
 */
async function checkDateAvailability(selectedDate) {
    const btnSubmit = document.getElementById('btn-submit-booking');
    const dateTip = document.getElementById('booking-date')?.closest('.form-input-wrapper')?.querySelector('.input-tip');

    if (dateTip) {
        dateTip.textContent = "⏳ Verificando disponibilidad para esta fecha...";
        dateTip.style.color = "var(--secondary)";
    }

    try {
        const supabase = await getSupabaseClient();
        
        // 1. Obtenemos las reservas activas para esta fecha
        const { data: reservations, error } = await supabase
            .from('registrations')
            .select('rentals')
            .eq('date', selectedDate)
            .neq('status', '🔴 Cancelado');

        if (error) throw error;

        // 2. Validamos Aforo de Senderistas
        const state = appStore.get();
        const maxHikers = state.maxCapacityPerDate || 12;
        const currentHikers = reservations.length;
        const availableSpots = maxHikers - currentHikers;

        if (dateTip) {
            if (availableSpots <= 0) {
                dateTip.innerHTML = "⚠️ <strong>CUPOS AGOTADOS</strong> para este sábado. Por favor elige otra fecha.";
                dateTip.style.color = "var(--error)";
                if (btnSubmit) btnSubmit.disabled = true;
            } else {
                dateTip.innerHTML = `✅ <strong>¡Hay lugar!</strong> Quedan ${availableSpots} cupos disponibles para esta expedición.`;
                dateTip.style.color = "var(--primary)";
                if (btnSubmit) btnSubmit.disabled = false;
            }
        }

        // 3. Validamos Stock de Equipos Alquilables
        const rentedAgg = {};
        reservations.forEach(res => {
            if (res.rentals) {
                Object.entries(res.rentals).forEach(([item, qty]) => {
                    rentedAgg[item] = (rentedAgg[item] || 0) + qty;
                });
            }
        });

        // Actualizamos los steppers de equipos
        const inventory = state.inventory || [];
        document.querySelectorAll('.equipment-input').forEach(input => {
            const itemId = input.id;
            const itemDef = inventory.find(i => i.item_id === itemId);
            if (itemDef) {
                const totalStock = itemDef.total_quantity || 0;
                const alreadyRented = rentedAgg[itemId] || 0;
                const currentAvailable = Math.max(0, totalStock - alreadyRented);

                input.setAttribute('data-max', currentAvailable);
                
                // Si el usuario ya tenía seleccionado más de lo que hay, bajamos el valor
                if (parseInt(input.value) > currentAvailable) {
                    input.value = currentAvailable;
                }

                // Actualizamos etiqueta visual
                const label = input.closest('.equipment-row')?.querySelector('.equipment-price small');
                if (label) {
                    if (currentAvailable <= 0) {
                        label.textContent = "(Agotado)";
                        label.style.color = "var(--error)";
                    } else {
                        label.textContent = `(Disponibles: ${currentAvailable})`;
                        label.style.color = "rgba(255,255,255,0.3)";
                    }
                }
            }
        });

        calculateFormCosts();

    } catch (err) {
        console.error("Error verificando disponibilidad:", err);
        if (dateTip) dateTip.textContent = "❌ Error al validar cupos. Intenta de nuevo.";
    }
}

function populateDates() {
    const select = document.getElementById('booking-date');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Selecciona tu sábado de ascenso</option>';
    let d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7)); // Próximo sábado
    if (d.getTime() < new Date().getTime() + 86400000) d.setDate(d.getDate() + 7);

    for (let i = 0; i < 4; i++) {
        const dateStr = d.toISOString().split('T')[0];
        const displayDate = d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' });
        select.innerHTML += `<option value="${dateStr}">${displayDate}</option>`;
        d.setDate(d.getDate() + 7);
    }

    // OPCIÓN DINÁMICA: Proponer fecha personalizada
    select.innerHTML += `<option value="custom">📅 Proponer otra fecha (Personalizado)</option>`;

    // Handler para mostrar/ocultar input de fecha personalizada
    select.addEventListener('change', (e) => {
        const wrapper = document.getElementById('custom-date-wrapper');
        const customInput = document.getElementById('custom-date-input');
        if (e.target.value === 'custom') {
            wrapper.style.display = 'block';
            if (customInput) customInput.required = true;
        } else {
            wrapper.style.display = 'none';
            if (customInput) {
                customInput.required = false;
                customInput.value = "";
            }
        }
    });
}

function calculateFormCosts() {
    const state = appStore.get();
    const basePrice = state.tourBasePrice || 50;
    let extraCosts = 0.00;

    // Equipos
    document.querySelectorAll('.equipment-input').forEach(input => {
        const qty = parseInt(input.value || '0', 10);
        const price = parseFloat(input.getAttribute('data-price') || '0');
        extraCosts += qty * price;
    });

    // Catering
    document.querySelectorAll('.catering-input').forEach(input => {
        const qty = parseInt(input.value || '0', 10);
        const price = parseFloat(input.getAttribute('data-price') || '0');
        extraCosts += qty * price;
    });

    // Portador
    const porterValue = parseFloat(document.getElementById('logistic-carrier-select')?.value || '0');
    extraCosts += porterValue;

    // Mostrar resumen extra
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

    const totalUSD = basePrice + extraCosts;
    const bcvRate = state.bcvRate || 1;
    const totalVES = totalUSD * bcvRate;

    const totalUsdEl = document.getElementById('form-total-usd');
    const totalVesEl = document.getElementById('form-total-ves');

    if (totalUsdEl) totalUsdEl.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD);
    if (totalVesEl) totalVesEl.textContent = new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(totalVES);
}

async function handleFormSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const btnSubmit = document.getElementById('btn-submit-booking');

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Procesando...';
    }

    try {
        const supabase = await getSupabaseClient();
        const formData = new FormData(form);

        const selectedRentals = {};
        document.querySelectorAll('.equipment-input').forEach(input => {
            const qty = parseInt(input.value || '0', 10);
            if (qty > 0) selectedRentals[input.id] = qty;
        });

        const selectedCatering = {};
        document.querySelectorAll('.catering-input').forEach(input => {
            const qty = parseInt(input.value || '0', 10);
            if (qty > 0) selectedCatering[input.id] = qty;
        });

        const porterSelect = document.getElementById('logistic-carrier-select');
        let porterService = null;
        if (porterSelect && porterSelect.value !== "0") {
            const val = porterSelect.value;
            if (val === "30") porterService = "porter-2p";
            if (val === "40") porterService = "porter-3p";
            if (val === "50") porterService = "porter-4p";
        }

        const groupCode = formData.get('group_code') || 'INDIVIDUAL';

        const state = appStore.get();
        const serverComputedTotal = (state.tourBasePrice || 50) + parseFloat(document.getElementById('rental-cost-display')?.textContent.replace(/[^0-9.]/g, '') || '0');

        // Lógica de Fecha Personalizada vs Estándar
        let inputDate = formData.get('date');
        const customDateText = formData.get('custom_date');
        let medicalNotes = sanearTexto(formData.get('medical') || 'Ninguna.');

        if (inputDate === 'custom') {
            const nextSat = new Date();
            nextSat.setDate(nextSat.getDate() + ((6 - nextSat.getDay() + 7) % 7));
            inputDate = nextSat.toISOString().split('T')[0];
            medicalNotes = `[PROPUESTA FECHA: ${customDateText}] ${medicalNotes}`;
        }

        const inputName = formData.get('name') || '';
        const inputCedula = formData.get('reference_number') || 'N/A';
        const passId = crypto.randomUUID();

        const { data, error } = await supabase.rpc('registrar_excursionista', {
            p_id: passId,
            p_date: inputDate,
            p_name: sanearTexto(inputName),
            p_email: sanearTexto(formData.get('email')),
            p_whatsapp: sanearTexto(formData.get('whatsapp')),
            p_group_code: groupCode,
            p_gender: formData.get('gender'),
            p_tent_preference: formData.get('tent_preference'),
            p_allergies: sanearTexto(formData.get('allergies') || 'Ninguna.'),
            p_diet: formData.get('diet') || 'Estándar',
            p_medical: medicalNotes,
            p_rentals: selectedRentals,
            p_catering: selectedCatering,
            p_porter_service: porterService,
            p_total_usd: serverComputedTotal,
            p_payment_method: formData.get('payment_method'),
            p_reference_number: sanearTexto(formData.get('reference_number') || 'N/A')
        });

        if (error) throw error;

        if (data && !data.success) {
            alert(data.message || "Error al procesar el cupo.");
            return;
        }

        const generatedId = passId;
        window.location.href = `./pass.html?id=${generatedId}`;

    } catch (err) {
        console.error("Error al enviar:", err);
        alert("Hubo un error al procesar tu inscripción. Revisa la consola.");
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Confirmar Registro y Generar Pase';
        }
    }
}

function sanearTexto(texto) {
    if (!texto) return '';
    return texto.toString().replace(/[<>"'`\\]/g, c => ({
        '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;', '\\': '&#x5C;'
    })[c]);
}

export function saveFormDraft() {
    const form = document.getElementById('expedition-form');
    if (!form) return;
    const data = new FormData(form);
    const obj = Object.fromEntries(data.entries());
    localStorage.setItem('naiguata_form_draft', JSON.stringify(obj));
}

export function restoreFormDraft() {
    const saved = localStorage.getItem('naiguata_form_draft');
    if (!saved) return;
    try {
        const data = JSON.parse(saved);
        Object.keys(data).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input && input.type !== 'file') input.value = data[key];
        });
        calculateFormCosts();
    } catch (e) { }
}
