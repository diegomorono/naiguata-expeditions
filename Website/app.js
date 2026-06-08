/* ==========================================================================
   APP STATE, CONFIG & CONSTANTS
   ========================================================================== */

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';


// Initialize Supabase Client
// const supabase = (window.supabase && SUPABASE_URL.indexOf('__SUPABASE_') === -1)
//     ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
//     : null;

const appState = {
    activeView: 'client-view',
    bcvRate: 40.00, // Default fallback
    bcvSource: 'default', // 'api', 'supabase', 'default', 'manual'
    activeStepIndex: 0,
    inventory: [],
    logisticServices: [],
    cateringCatalog: []
};

// Route Checkpoints
const routeSteps = [
    {
        name: "PGP La Julia",
        altitude: "1,140 msnm",
        distance: "0.0 km (Inicio)",
        difficulty: "Fácil - Moderado",
        desc: "Puesto de Guardaparques ubicado en el sector El Marqués, Caracas. Punto de partida oficial de la expedición. Aquí realizaremos el control de pases, registro en Inparques y el chequeo de seguridad final del equipaje.",
        tips: "Asegúrate de llevar tu pase impreso o digital. Los guardaparques realizarán una revisión obligatoria para evitar el ingreso de materiales prohibidos.",
        icon: "⛰️"
    },
    {
        name: "El Tanque",
        altitude: "1,200 msnm",
        distance: "1.2 km de caminata",
        difficulty: "Moderado",
        desc: "Una agradable parada boscosa equipada con un tanque de almacenamiento metálico. El agua que surte este tanque proviene directamente de un manantial natural de la montaña, siendo apta para el consumo.",
        tips: "Este es el último punto confiable y seguro para recargar tus botellas de agua gratis antes de emprender la dura subida hacia Dos Banderas. ¡Llena al menos 3 a 4 litros!",
        icon: "🚰"
    },
    {
        name: "Mirador del Edén",
        altitude: "1,450 msnm",
        distance: "2.5 km de caminata",
        difficulty: "Exigente",
        desc: "Un clásico punto de descanso bajo la sombra de grandes árboles que ofrece una impresionante vista panorámica de la zona este y norte de Caracas. El clima aquí empieza a sentirse notablemente más fresco.",
        tips: "A partir de este punto, el sendero (Rancho Grande) se vuelve empinado y exigente. Mantén un ritmo de marcha lento pero constante y da pequeños sorbos de agua frecuentemente.",
        icon: "🌅"
    },
    {
        name: "Dos Banderas",
        altitude: "1,900 msnm",
        distance: "4.8 km de caminata",
        difficulty: "Muy Exigente",
        desc: "Una cresta montañosa abierta y expuesta al viento, famosa por albergar dos banderas de Venezuela. La vegetación boscosa desaparece por completo dando paso al matorral de sub-páramo.",
        tips: "El viento puede ser sumamente fuerte y frío aquí. Si el día está soleado, el sol golpea de forma directa. Usa protector solar, gorra y ten a la mano un cortavientos liviano.",
        icon: "🇻🇪"
    },
    {
        name: "El Anfiteatro",
        altitude: "2,700 msnm",
        distance: "7.5 km de caminata",
        difficulty: "Extrema (Desnivel)",
        desc: "Un majestuoso valle plano de hierba rodeado de inmensos monolitos de granito, ubicado justo debajo de la cumbre. Al estar resguardado de los vientos huracanados de la cima, es el sitio ideal para armar nuestro campamento.",
        tips: "La temperatura en el Anfiteatro desciende drásticamente al atardecer, pudiendo llegar a 8°C o menos en la madrugada. Sécate el sudor de inmediato, vístete con ropa térmica y prepárate para dormir.",
        icon: "⛺"
    },
    {
        name: "La Cumbre (Pico Naiguatá)",
        altitude: "2,765 msnm",
        distance: "8.0 km (Punto Final)",
        difficulty: "Fácil (desde campamento)",
        desc: "El punto más alto de la Cordillera de la Costa. Coronada por una gran cruz metálica de 5 metros de alto. Ofrece una vista insuperable de 360 grados: al norte el mar Caribe e Higuerote, y al sur el valle de Caracas y los Valles del Tuy.",
        tips: "Iniciamos el ascenso final desde las carpas a las 5:30 AM para ver el amanecer sobre el mar de nubes. Lleva tu linterna frontal y guantes gruesos para subir por las piedras frías.",
        icon: "👑"
    }
];

// Gear Checklist
const gearItems = [
    { id: "sleeping-bag", name: "Saco de Dormir (Sleeping Bag)", weight: "2 kg", critical: true },
    { id: "sleeping-pad", name: "Aislante Térmico (Sleeping Pad)", weight: "0.4 kg", critical: true },
    { id: "warm-clothes", name: "Ropa de Abrigo Térmica (Suéter + Mono)", weight: "0.8 kg", critical: true },
    { id: "water-4l", name: "4 Litros de Agua (Mínimo)", weight: "4.0 kg", critical: true },
    { id: "headlamp", name: "Linterna Frontal / Mano con Pilas", weight: "0.2 kg", critical: true },
    { id: "hiking-boots", name: "Calzado de Montaña (Botas/Zapatos de Trail)", weight: "1.2 kg", critical: false },
    { id: "hygiene-kit", name: "Aseo Personal (Cepillo, Jabón biodegradable, Papel)", weight: "0.3 kg", critical: false }
];

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAppNavigation();
    initElevationStepper();
    initGearChecklist();
    initBookingForm();
    loadSupabaseData();
    resolveBcvRate();
    restoreFormDraft();
    processOfflineQueue();
});

function initAppNavigation() {
    const navLogo = document.getElementById('nav-logo');
    navLogo.addEventListener('click', () => {
        switchView('client-view');
    });

    document.getElementById('btn-return-home').addEventListener('click', () => {
        switchView('client-view');
        document.getElementById('expedition-form').reset();
        localStorage.removeItem('naiguata_form_draft');
        resetFormTotal();
    });
}

function switchView(viewId) {
    appState.activeView = viewId;
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   CONCURRENCY & DATA RESOLUTION (SUPABASE)
   ========================================================================== */

async function loadSupabaseData() {
    if (!supabase) return;
    try {
        // Load inventory catalog
        const { data: invData } = await supabase.from('inventory_stock').select('*');
        if (invData) appState.inventory = invData;

        // Load services
        const { data: servData } = await supabase.from('logistic_services').select('*');
        if (servData) appState.logisticServices = servData;

        // Load catering
        const { data: catData } = await supabase.from('catering_inventory').select('*');
        if (catData) appState.cateringCatalog = catData;

        renderDynamicRentalsAndCatering();
        updateFormPricing();
    } catch (err) {
        console.error('Error loading catalogs from Supabase:', err);
    }
}

function renderDynamicRentalsAndCatering() {
    const rentalContainer = document.querySelector('.rental-options');
    if (!rentalContainer) return;

    rentalContainer.innerHTML = '';

    // 1. Render Equipment Rentals
    appState.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'rental-option-wrapper';
        div.style.marginBottom = '15px';

        div.innerHTML = `
            <label class="rental-item glass-panel-hover" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" class="rental-checkbox" data-item="${item.item_id}" data-price="${item.price_usd}">
                    <div class="rental-details">
                        <span class="rental-name" style="font-weight: 500;">${item.item_name}</span>
                        <span id="stock-indicator-${item.item_id}" style="display: block; font-size: 0.75rem; color: var(--text-muted);">Consultando disponibilidad...</span>
                    </div>
                </div>
                <span class="rental-price" style="font-weight: 600; color: var(--primary);">+$${item.price_usd} USD</span>
            </label>
        `;
        rentalContainer.appendChild(div);
    });

    // 2. Add Snacks Options (Dynamic)
    const snackTitle = document.createElement('div');
    snackTitle.className = 'form-group-title';
    snackTitle.style.marginTop = '20px';
    snackTitle.textContent = 'Snacks & Raciones de Marcha';
    rentalContainer.appendChild(snackTitle);

    appState.cateringCatalog.forEach(item => {
        const div = document.createElement('div');
        div.className = 'snack-option-row';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.style.marginBottom = '12px';
        div.style.padding = '10px 15px';
        div.style.background = 'rgba(255, 255, 255, 0.02)';
        div.style.borderRadius = '8px';

        div.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">${item.item_name} (Opcional)</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Adicional al kit básico provisto gratis. Costo: $${item.price_usd} c/u</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="number" class="snack-qty-input" data-item="${item.item_id}" data-price="${item.price_usd}" min="0" value="0" style="width: 60px; padding: 6px; text-align: center; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white;">
            </div>
        `;
        rentalContainer.appendChild(div);
    });

    // 3. Add Porter Service
    const porterTitle = document.createElement('div');
    porterTitle.className = 'form-group-title';
    porterTitle.style.marginTop = '20px';
    porterTitle.textContent = 'Servicio de Transportación y Carga (Portador)';
    rentalContainer.appendChild(porterTitle);

    const porterDesc = document.createElement('p');
    porterDesc.className = 'section-desc-small';
    porterDesc.style.marginBottom = '10px';
    porterDesc.textContent = 'El traslado físico de la carpa corre por cuenta del excursionista, salvo que contrate este servicio:';
    rentalContainer.appendChild(porterDesc);

    const porterSelect = document.createElement('select');
    porterSelect.id = 'porter-service-select';
    porterSelect.style.width = '100%';
    porterSelect.style.padding = '12px';
    porterSelect.style.borderRadius = '8px';
    porterSelect.style.border = '1px solid rgba(255,255,255,0.1)';
    porterSelect.style.background = 'rgba(0,0,0,0.4)';
    porterSelect.style.color = 'white';

    let optionsHtml = `<option value="none" selected>No, yo mismo cargaré mi carpa asignada ($0 USD)</option>`;
    appState.logisticServices.forEach(srv => {
        optionsHtml += `<option value="${srv.service_id}" data-price="${srv.price_usd}">${srv.service_name} (+$${srv.price_usd} USD)</option>`;
    });
    porterSelect.innerHTML = optionsHtml;
    rentalContainer.appendChild(porterSelect);

    // Event Delegation for price updates
    rentalContainer.querySelectorAll('.rental-checkbox, .snack-qty-input').forEach(el => {
        el.addEventListener('change', updateFormPricing);
        el.addEventListener('input', updateFormPricing);
    });
    porterSelect.addEventListener('change', updateFormPricing);

    // Initial stock check
    queryLiveStock();
}

/* ==========================================================================
   LIVE STOCK & INVENTORY AVALIABILITY CHECK
   ========================================================================== */

async function queryLiveStock() {
    const selectedDate = document.getElementById('booking-date').value;
    if (!supabase || !selectedDate) return;

    try {
        // Fetch all reservations for selected date
        const { data: dateBookings } = await supabase
            .from('registrations')
            .select('rentals')
            .eq('date', selectedDate)
            .neq('status', '🔴 Cancelado');

        // Sum rentals already compromised
        const rentedCounts = {};
        if (dateBookings) {
            dateBookings.forEach(booking => {
                const rentals = typeof booking.rentals === 'string' ? JSON.parse(booking.rentals) : booking.rentals;
                if (Array.isArray(rentals)) {
                    rentals.forEach(itemId => {
                        rentedCounts[itemId] = (rentedCounts[itemId] || 0) + 1;
                    });
                }
            });
        }

        // Update indicators
        appState.inventory.forEach(item => {
            const indicator = document.getElementById(`stock-indicator-${item.item_id}`);
            const checkbox = document.querySelector(`.rental-checkbox[data-item="${item.item_id}"]`);

            const totalStock = item.total_quantity;
            const reserved = rentedCounts[item.item_id] || 0;
            const remaining = Math.max(0, totalStock - reserved);

            if (indicator) {
                if (remaining === 0) {
                    indicator.innerHTML = `<span style="color: var(--error);">Agotado para esta fecha</span>`;
                    if (checkbox) {
                        checkbox.disabled = true;
                        checkbox.checked = false;
                    }
                } else {
                    indicator.innerHTML = `Disponibilidad: <strong style="color: var(--success);">${remaining} unidades</strong> restantes`;
                    if (checkbox) checkbox.disabled = false;
                }
            }
        });
    } catch (err) {
        console.error('Error calculating dynamic stock availability:', err);
    }
}

/* ==========================================================================
   EXCHANGE RATE RESOLVER (3 CAPAS DE SEGURIDAD)
   ========================================================================== */

async function resolveBcvRate() {
    // CAPA 1: DolarApi.com (Consulta dinámica)
    try {
        const response = await Promise.race([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);

        if (!response.ok) throw new Error('API Rate Error');

        const data = await response.json();
        const rate = parseFloat(data.promedio);

        if (rate && !isNaN(rate)) {
            appState.bcvRate = rate;
            appState.bcvSource = 'api';
            updateCurrencyUI();
            return;
        }
    } catch (err) {
        console.warn('Capa 1 BCV falló, recurriendo a Capa 2:', err);
    }

    // CAPA 2: Supabase (system_settings -> last_valid_bcv)
    if (supabase) {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'last_valid_bcv')
                .single();

            if (data && data.value && data.value.rate) {
                appState.bcvRate = parseFloat(data.value.rate);
                appState.bcvSource = 'supabase';
                updateCurrencyUI();
                return;
            }
        } catch (err) {
            console.warn('Capa 2 BCV falló, recurriendo a Capa 3:', err);
        }
    }

    // CAPA 3: Fallback local + Alerta de Emergencia silenciosa
    appState.bcvSource = 'default';
    updateCurrencyUI();
    triggerEmergencyMode();
}

function updateCurrencyUI() {
    const bcvPriceDisplay = document.getElementById('bcv-price-display');
    const bcvRateInfo = document.getElementById('bcv-rate-info');

    if (bcvPriceDisplay) {
        const priceBcv = 50.00 * appState.bcvRate;
        bcvPriceDisplay.innerHTML = `Bs. ${formatCurrency(priceBcv)} <span class="price-unit">al cambio BCV</span>`;
    }

    if (bcvRateInfo) {
        const sourceText = appState.bcvSource === 'api' ? 'API Oficial' : (appState.bcvSource === 'supabase' ? 'Base de Datos' : 'Emergencia');
        bcvRateInfo.innerHTML = `Tasa Oficial BCV: <strong>1 USD = Bs. ${appState.bcvRate.toFixed(2)}</strong> (${sourceText})`;
    }

    updateFormPricing();
}

function triggerEmergencyMode() {
    console.error('ALERTA: Sistema Naiguatá en Modo de Emergencia - Fallo de Conexión Base de Datos/BCV');

    // Notificación Silenciosa vía EmailJS a través de plantilla de emergencia
    const templateParams = {
        nombre: "Guía Administrativo",
        fecha: new Date().toISOString().split('T')[0],
        alquileres: "FALLO CRÍTICO CONEXIÓN BCV / SUPABASE - OPERANDO CON TASA DE RESPALDO"
    };

    if (window.emailjs) {
        window.emailjs.send('service_f8qzcms', 'template_b2ncvpr', templateParams, '9XBQKLOu-wgK2SGug')
            .then(() => console.log('Alerta de emergencia enviada por email.'))
            .catch(err => console.error('Fallo al enviar alerta por correo:', err));
    }
}

function formatCurrency(val) {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ==========================================================================
   ELEVATION STEPPER
   ========================================================================== */

function initElevationStepper() {
    const stepButtons = document.querySelectorAll('.step-nav-btn');
    const mapDots = document.querySelectorAll('.map-dot');

    function selectStep(index) {
        appState.activeStepIndex = index;
        stepButtons.forEach(btn => btn.classList.remove('active'));
        mapDots.forEach(dot => dot.classList.remove('active'));

        const activeBtn = document.querySelector(`.step-nav-btn[data-step="${index}"]`);
        const activeDot = document.querySelector(`.map-dot[data-step="${index}"]`);

        if (activeBtn) activeBtn.classList.add('active');
        if (activeDot) activeDot.classList.add('active');

        renderActiveStepDetails();
    }

    stepButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const stepIdx = parseInt(e.target.getAttribute('data-step'));
            selectStep(stepIdx);
        });
    });

    mapDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const stepIdx = parseInt(e.target.getAttribute('data-step'));
            selectStep(stepIdx);
        });
    });

    selectStep(0);
}

function renderActiveStepDetails() {
    const container = document.getElementById('active-step-details');
    if (!container) return;
    const step = routeSteps[appState.activeStepIndex];

    container.innerHTML = `
        <div class="step-details-meta">
            <div class="meta-row">
                <span class="meta-lbl">Altitud</span>
                <span class="meta-val font-green">${step.altitude}</span>
            </div>
            <div class="meta-row">
                <span class="meta-lbl">Distancia</span>
                <span class="meta-val">${step.distance}</span>
            </div>
            <div class="meta-row">
                <span class="meta-lbl">Dificultad</span>
                <span class="meta-val">${step.difficulty}</span>
            </div>
        </div>
        <div class="step-details-info">
            <h3 class="step-details-title">${step.icon} ${step.name}</h3>
            <p class="step-details-desc">${step.desc}</p>
            <div class="step-details-tips">
                <strong>Consejo del Guía:</strong>
                ${step.tips}
            </div>
        </div>
    `;
}

/* ==========================================================================
   SMART GEAR CHECKLIST
   ========================================================================== */

function initGearChecklist() {
    const listContainer = document.getElementById('interactive-gear-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    gearItems.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <label class="gear-item-checkbox">
                <input type="checkbox" class="gear-chk" data-id="${item.id}" ${item.critical ? 'data-critical="true"' : ''}>
                <div class="gear-item-details">
                    <span class="gear-item-name">${item.name}</span>
                    <span class="gear-item-weight">${item.weight}</span>
                </div>
            </label>
        `;
        listContainer.appendChild(li);
    });

    const checkboxes = document.querySelectorAll('.gear-chk');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', updateChecklistProgress);
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.gear-chk');
    if (checkboxes.length === 0) return;
    const total = checkboxes.length;
    let checkedCount = 0;
    let missingCritical = false;

    checkboxes.forEach(chk => {
        if (chk.checked) checkedCount++;
        else if (chk.getAttribute('data-critical') === 'true') missingCritical = true;
    });

    const percentage = Math.round((checkedCount / total) * 100);
    const percentageEl = document.getElementById('prep-percentage');
    const barEl = document.getElementById('prep-bar');
    const warningBanner = document.getElementById('checklist-warning');

    if (percentageEl) percentageEl.textContent = `${percentage}%`;
    if (barEl) barEl.style.width = `${percentage}%`;

    if (warningBanner) {
        if (missingCritical && checkedCount > 0) {
            warningBanner.classList.remove('hidden');
            document.getElementById('warning-text').textContent = "⚠️ ¡Falta equipamiento crítico de supervivencia! Asegúrate de empacar agua, abrigo térmico y saco de dormir.";
        } else {
            warningBanner.classList.add('hidden');
        }
    }
}

/* ==========================================================================
   TOTALIZER & DRAFT RESTORING (LOCALSTORAGE)
   ========================================================================== */

function updateFormPricing() {
    const basePrice = 50.00;
    let rentalsCost = 0.00;
    let snacksCost = 0.00;
    let porterCost = 0.00;

    // 1. Equipment Checkboxes
    document.querySelectorAll('.rental-checkbox:checked').forEach(chk => {
        rentalsCost += parseFloat(chk.getAttribute('data-price')) || 0;
    });

    // 2. Snacks quantities
    document.querySelectorAll('.snack-qty-input').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const price = parseFloat(input.getAttribute('data-price')) || 0;
        snacksCost += qty * price;
    });

    // 3. Porter service
    const porterSelect = document.getElementById('porter-service-select');
    if (porterSelect && porterSelect.value !== 'none') {
        const option = porterSelect.options[porterSelect.selectedIndex];
        porterCost += parseFloat(option.getAttribute('data-price')) || 0;
    }

    const totalUsd = basePrice + rentalsCost + snacksCost + porterCost;
    const totalVes = totalUsd * appState.bcvRate;

    // Update Form Display
    const rentalCostDisplay = document.getElementById('rental-cost-display');
    const rentalSummaryRow = document.getElementById('rental-summary-row');
    const formTotalUsd = document.getElementById('form-total-usd');
    const formTotalVes = document.getElementById('form-total-ves');

    if (rentalSummaryRow && rentalCostDisplay) {
        const extraSubtotal = rentalsCost + snacksCost + porterCost;
        if (extraSubtotal > 0) {
            rentalSummaryRow.classList.remove('hidden');
            rentalCostDisplay.textContent = `+$${extraSubtotal.toFixed(2)} USD`;
        } else {
            rentalSummaryRow.classList.add('hidden');
        }
    }

    if (formTotalUsd) formTotalUsd.textContent = `$${totalUsd.toFixed(2)} USD`;
    if (formTotalVes) formTotalVes.textContent = `Bs. ${formatCurrency(totalVes)}`;

    // Update Floating bar if exists
    const floatingTotal = document.getElementById('floating-bar-total');
    if (floatingTotal) {
        floatingTotal.textContent = `Pase de Expedición: Total a Transferir $${totalUsd.toFixed(2)} USD`;
    }
}

function resetFormTotal() {
    const rentalSummaryRow = document.getElementById('rental-summary-row');
    if (rentalSummaryRow) rentalSummaryRow.classList.add('hidden');

    const formTotalUsd = document.getElementById('form-total-usd');
    const formTotalVes = document.getElementById('form-total-ves');

    if (formTotalUsd) formTotalUsd.textContent = "$50.00 USD";
    if (formTotalVes) formTotalVes.textContent = `Bs. ${formatCurrency(50.00 * appState.bcvRate)}`;
}

// Autosave form inputs to localStorage
function saveFormDraft() {
    const draft = {
        name: document.getElementById('hiker-name')?.value,
        email: document.getElementById('hiker-email')?.value,
        whatsapp: document.getElementById('hiker-whatsapp')?.value,
        group: document.getElementById('booking-group')?.value,
        gender: document.getElementById('hiker-gender')?.value,
        tentPreference: document.getElementById('hiker-tent-preference')?.value,
        allergies: document.getElementById('hiker-allergies')?.value,
        diet: document.getElementById('hiker-diet')?.value,
        medical: document.getElementById('hiker-medical')?.value,
        date: document.getElementById('booking-date')?.value,
        referenceNumber: document.getElementById('payment-reference')?.value,
        paymentMethod: document.getElementById('payment-method-select')?.value
    };
    localStorage.setItem('naiguata_form_draft', JSON.stringify(draft));
}

function restoreFormDraft() {
    const saved = localStorage.getItem('naiguata_form_draft');
    if (!saved) return;
    try {
        const draft = JSON.parse(saved);
        if (draft.name) document.getElementById('hiker-name').value = draft.name;
        if (draft.email) document.getElementById('hiker-email').value = draft.email;
        if (draft.whatsapp) document.getElementById('hiker-whatsapp').value = draft.whatsapp;
        if (draft.group) document.getElementById('booking-group').value = draft.group;
        if (draft.gender) document.getElementById('hiker-gender').value = draft.gender;
        if (draft.tentPreference) document.getElementById('hiker-tent-preference').value = draft.tentPreference;
        if (draft.allergies) document.getElementById('hiker-allergies').value = draft.allergies;
        if (draft.diet) document.getElementById('hiker-diet').value = draft.diet;
        if (draft.medical) document.getElementById('hiker-medical').value = draft.medical;
        if (draft.date) {
            document.getElementById('booking-date').value = draft.date;
            queryLiveStock();
        }
        if (draft.referenceNumber) document.getElementById('payment-reference').value = draft.referenceNumber;
        if (draft.paymentMethod) {
            document.getElementById('payment-method-select').value = draft.paymentMethod;
            togglePaymentFields(draft.paymentMethod);
        }
    } catch (e) {
        console.warn('Failed restoring draft:', e);
    }
}

function togglePaymentFields(method) {
    // Hide all blocks
    document.querySelectorAll('.payment-info-block').forEach(b => b.classList.add('hidden'));

    // Show specific block
    if (method === 'Pago Móvil') {
        document.getElementById('pay-info-pagomovil')?.classList.remove('hidden');
    } else if (method === 'Binance') {
        document.getElementById('pay-info-binance')?.classList.remove('hidden');
    } else if (method === 'Zelle') {
        document.getElementById('pay-info-zelle')?.classList.remove('hidden');
    } else if (method === 'Efectivo') {
        document.getElementById('pay-info-efectivo')?.classList.remove('hidden');
    }
}

/* ==========================================================================
   OFFLINE RESILIENCE & QUEUE SYSTEM
   ========================================================================== */

function addToOfflineQueue(bookingData) {
    const queue = JSON.parse(localStorage.getItem('naiguata_offline_queue') || '[]');
    queue.push(bookingData);
    localStorage.setItem('naiguata_offline_queue', JSON.stringify(queue));
}

async function processOfflineQueue() {
    if (!navigator.onLine || !supabase) return;
    const queue = JSON.parse(localStorage.getItem('naiguata_offline_queue') || '[]');
    if (queue.length === 0) return;

    console.log('Online! Syncing offline reservations queue...');
    const remainingQueue = [];

    for (const booking of queue) {
        try {
            await insertToSupabase(booking);
        } catch (err) {
            console.error('Retry insert failed, preserving in queue:', err);
            remainingQueue.push(booking);
        }
    }

    localStorage.setItem('naiguata_offline_queue', JSON.stringify(remainingQueue));
}

window.addEventListener('online', processOfflineQueue);

/* ==========================================================================
   BOOKING SUBMISSION & RPC INSERTS
   ========================================================================== */

function initBookingForm() {
    const form = document.getElementById('expedition-form');
    if (!form) return;

    // Attach autosave draft listeners
    form.addEventListener('input', saveFormDraft);
    form.addEventListener('change', saveFormDraft);

    // Dynamic Sábados picker
    const dateSelect = document.getElementById('booking-date');
    if (dateSelect) {
        populateSaturdays(dateSelect);
        dateSelect.addEventListener('change', queryLiveStock);
    }

    // Payment method trigger
    const paySelect = document.getElementById('payment-method-select');
    if (paySelect) {
        paySelect.addEventListener('change', (e) => togglePaymentFields(e.target.value));
    }

    // Phone formatting mask
    const phoneInput = document.getElementById('hiker-whatsapp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^\d+]/g, '');
            if (val.length > 0 && val[0] !== '+') val = '+' + val;
            e.target.value = val;
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Estado de carga visual en el botón
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Confirmar Registro';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-small"></span> Procesando registro...`;
        }

        // Captura y mapeo correcto a los IDs reales del HTML
        const name = formatTitleCase(document.getElementById('hiker-name').value.trim());
        const email = document.getElementById('hiker-email').value.trim().toLowerCase();
        const whatsapp = document.getElementById('hiker-whatsapp').value.trim();
        const group = document.getElementById('booking-group') ? document.getElementById('booking-group').value.trim().toUpperCase().replace(/GRUPO DE|LOS|LAS/g, '').trim() : 'INDIVIDUAL';
        const gender = document.getElementById('hiker-gender').value;
        const tentPreference = document.getElementById('hiker-tent-preference') ? document.getElementById('hiker-tent-preference').value : 'Individual';
        const allergies = document.getElementById('hiker-allergies').value;
        const diet = document.getElementById('hiker-diet').value;
        const medical = document.getElementById('hiker-medical').value.trim() || 'Ninguna.';

        // Sincronización con selectores del HTML real
        const dateVal = document.getElementById('expedition-date').value;
        const paymentMethod = document.getElementById('payment-method').value;
        const referenceNumber = document.getElementById('payment-reference') ? document.getElementById('payment-reference').value.trim() : 'N/A';

        // Recopilación de alquileres
        const rentals = [];
        document.querySelectorAll('.rental-checkbox:checked').forEach(chk => {
            rentals.push(chk.getAttribute('data-item') || chk.value);
        });

        // Recopilación de catering
        const catering = [];
        document.querySelectorAll('.snack-qty-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                catering.push({ item_id: input.getAttribute('data-item'), qty });
            }
        });

        const totalUsd = parseFloat(document.getElementById('total-price-usd')?.textContent) || 0;
        const passId = 'NE-' + Math.floor(100000 + Math.random() * 900000);

        if (supabase) {
            try {
                const { data, error } = await supabase.rpc('register_hiker', {
                    p_id: passId,
                    p_date: dateVal,
                    p_name: name,
                    p_email: email,
                    p_whatsapp: whatsapp,
                    p_group_code: group,
                    p_gender: gender,
                    p_tent_preference: tentPreference,
                    p_allergies: allergies,
                    p_diet: diet,
                    p_medical: medical,
                    p_rentals: JSON.stringify(rentals),
                    p_catering: JSON.stringify(catering),
                    p_porter_service: 'No',
                    p_total_usd: totalUsd,
                    p_payment_method: paymentMethod,
                    p_reference_number: referenceNumber
                });

                if (error) throw error;

                alert('¡Inscripción procesada con éxito en Supabase!');

                if (document.getElementById('pass-serial-number')) document.getElementById('pass-serial-number').textContent = passId;
                if (document.getElementById('pass-date')) document.getElementById('pass-date').textContent = dateVal;

                if (typeof switchView === "function") {
                    switchView('pass-view');
                } else {
                    if (document.getElementById('client-view')) document.getElementById('client-view').style.display = 'none';
                    if (document.getElementById('pass-view')) document.getElementById('pass-view').style.display = 'block';
                }

                localStorage.removeItem('expedition_form_draft');

            } catch (err) {
                console.error('Error crítico en el registro:', err);
                alert('Error al registrar en la base de datos: ' + err.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        } else {
            alert('Error: El cliente de Supabase no se encuentra inicializado.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });

    // Share & Back up Aventura listener
    const shareBtn = document.getElementById('btn-print-pass');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Share Adventure API
    const shareAventuraBtn = document.getElementById('btn-share-adventure');
    if (shareAventuraBtn) {
        shareAventuraBtn.addEventListener('click', shareAdventureFlow);
    }
}

async function insertToSupabase(booking) {
    if (!supabase) throw new Error('Servidor de base de datos no configurado.');

    // Call atomic RPC registration
    const { data, error } = await supabase.rpc('registrar_excursionista', {
        p_id: booking.id,
        p_date: booking.date,
        p_name: booking.name,
        p_email: booking.email,
        p_whatsapp: booking.whatsapp,
        p_group_code: booking.group_code,
        p_gender: booking.gender,
        p_tent_preference: booking.tent_preference,
        p_allergies: booking.allergies,
        p_diet: booking.diet,
        p_medical: booking.medical,
        p_rentals: booking.rentals,
        p_catering: booking.catering,
        p_porter_service: booking.porter_service,
        p_total_usd: booking.total_usd,
        p_payment_method: booking.payment_method,
        p_reference_number: booking.reference_number
    });

    if (error) throw error;
    if (data && data.success === false) {
        throw new Error(data.message);
    }

    // Sincronizar transacciones financieras en Supabase
    await supabase.from('financial_transactions').insert({
        registration_id: booking.id,
        date: booking.date,
        type: 'Ingreso',
        concept: `Inscripción: ${booking.name}`,
        category: 'Ingreso Cliente',
        account: getAccountByMethod(booking.payment_method),
        currency: booking.payment_method === 'Pago Móvil' ? 'VES' : 'USD',
        amount_original: booking.payment_method === 'Pago Móvil' ? (booking.total_usd * appState.bcvRate) : booking.total_usd,
        exchange_rate: appState.bcvRate,
        total_neto_usd: booking.total_usd
    });

    // Dispatch notification
    sendNotificationDetails(booking);
}

function getAccountByMethod(method) {
    if (method === 'Pago Móvil') return 'Banco Bs';
    if (method === 'Binance') return 'Binance';
    if (method === 'Zelle') return 'Zelle';
    return 'Efectivo';
}

function populateSaturdays(selectEl) {
    const saturdays = [];
    const date = new Date();

    // Get next 6 Saturdays
    while (saturdays.length < 6) {
        date.setDate(date.getDate() + 1);
        if (date.getDay() === 6) {
            saturdays.push(new Date(date));
        }
    }

    selectEl.innerHTML = '';
    saturdays.forEach((sat, i) => {
        const value = sat.toISOString().split('T')[0];
        const label = sat.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        selectEl.innerHTML += `<option value="${value}">${label}</option>`;
    });
}

function showOfflineSuccess(booking) {
    renderExpeditionPass(booking);
    // Display offline label in pass
    document.getElementById('pass-serial-number').innerHTML = `${booking.id} <span style="font-size: 0.7rem; color: var(--error); display:block;">Pase Offline (Pendiente Sincronizar)</span>`;
    switchView('success-view');
}

/* ==========================================================================
   NOTIFICATIONS SYSTEM (WHATSAPP & EMAILJS)
   ========================================================================== */

function sendNotificationDetails(booking) {
    const rentalsLabel = booking.rentals.length > 0 ? booking.rentals.join(', ') : 'Ninguno';

    // 1. Trigger EmailJS
    const emailParams = {
        nombre: booking.name,
        email: booking.email,
        fecha: booking.date,
        alquileres: rentalsLabel,
        total: `$${booking.total_usd.toFixed(2)} USD`
    };

    if (window.emailjs) {
        window.emailjs.send('service_f8qzcms', 'template_b2ncvpr', emailParams, '9XBQKLOu-wgK2SGug')
            .then(() => console.log('Email enviado.'))
            .catch(err => console.error('Error EmailJS:', err));
    }

    // 2. Dispatch WhatsApp details structure
    const waText = `⛰️ *NUEVA INSCRIPCIÓN - EXPEDICIONES NAIGUATÁ* ⛰️
- Excursionista: ${booking.name} | C.I: ${booking.reference_number || 'No aportada'}
- Carpa Asignada: ${booking.tent_preference === 'couple' ? 'Pareja (Carpa 2 Personas)' : 'Compartido (2p/3p)'}
- Alquileres: ${rentalsLabel}
- Snacks: ${booking.catering.length > 0 ? booking.catering.map(c => `${c.qty}x ${c.item_id}`).join(', ') : 'Ninguno'}
- Portador de Carpa: ${booking.porter_service ? 'Contratado' : 'Ninguno - Carga el cliente'}
💰 *TOTAL GENERAL A PAGAR:* $${booking.total_usd.toFixed(2)} USD
_Confirma datos de pago._`;

    const waUrl = `https://wa.me/34673375681?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
}

/* ==========================================================================
   RENDER SUCCESS PASS & RENDER MANUAL CON RETOS GAMIFICADOS
   ========================================================================== */

function renderExpeditionPass(booking) {
    document.getElementById('pass-hiker-name').textContent = booking.name;
    document.getElementById('pass-date').textContent = booking.date;
    document.getElementById('pass-group').textContent = booking.group_code || 'NINGUNO';

    // Dieta / Alergias
    let allergyText = "Ninguna";
    if (booking.allergies === 'nuts') allergyText = "Alergia Frutos Secos";
    else if (booking.allergies === 'gluten') allergyText = "Intolerancia Gluten";
    else if (booking.allergies === 'other') allergyText = "Otras Alergias";
    document.getElementById('pass-diet').textContent = `${booking.diet.toUpperCase()} / ${allergyText}`;

    // Alojamiento
    let tentText = 'Por asignar';
    if (booking.tent_preference === 'couple') tentText = 'Carpa 2p (Privada Pareja)';
    else tentText = 'Compartida (2p/3p)';
    document.getElementById('pass-tent').textContent = tentText;

    // Alquileres
    let rentalText = 'Ninguno';
    if (booking.rentals.length > 0) {
        rentalText = booking.rentals.map(item_id => {
            const entry = appState.inventory.find(i => i.item_id === item_id);
            return entry ? entry.item_name : item_id;
        }).join(', ');
    }
    document.getElementById('pass-rentals').textContent = rentalText;

    // Serial & QR Code
    document.getElementById('pass-serial-number').textContent = booking.id;

    // Inject botanical challenges in the manual
    injectGamifiedManual();
}

function injectGamifiedManual() {
    const printablePassCard = document.getElementById('printable-pass-card');
    if (!printablePassCard) return;

    // Check if manual page is already appended to prevent duplicate additions
    let manualPage = document.getElementById('tour-manual-page');
    if (!manualPage) {
        manualPage = document.createElement('div');
        manualPage.id = 'tour-manual-page';
        manualPage.style.marginTop = '40px';
        manualPage.style.paddingTop = '40px';
        manualPage.style.borderTop = '2px dashed rgba(255,255,255,0.1)';
        manualPage.className = 'page-break';
        printablePassCard.appendChild(manualPage);
    }

    // Manual markup with Gamification Challenges
    manualPage.innerHTML = `
        <div style="font-family: 'Outfit', sans-serif; padding: 25px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <h2 style="text-align: center; color: var(--primary); margin-bottom: 20px;">Manual del Tour: Pico Naiguatá (2.765 m)</h2>
            
            <h4 style="color: var(--primary);">1. Itinerario y Tiempos Aproximados</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">
                <strong>1er Día:</strong> 07:30 AM Encuentro en sendero La Julia. Ascenso (~8-10 horas, desnivel ~1.800m). Montaje de campamento en el Anfiteatro y cena.<br>
                <strong>2do Día:</strong> 05:30 AM Ascenso final a cumbre para amanecer. 07:00 AM Desayuno y descenso (~5-7 horas). Retorno a Caracas por la tarde.
            </p>

            <h4 style="color: var(--primary);">2. Equipo y Pernocta Obligatorios</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted);">
                Saco de dormir (rating 0-5°C), esterilla aislante térmica (imprescindible contra el suelo frío), 3-4 litros de hidratación, linterna frontal con pilas cargadas, ropa de abrigo (gorro, guantes y pijama térmico).
            </p>

            <h4 style="color: var(--primary); margin-top: 25px;">🎮 Pasaporte de Aventura y Retos en Ruta (10% Descuento)</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-muted); margin-bottom: 15px;">
                Supera los siguientes hitos ecológicos y de orientación en montaña durante el ascenso. Registra tu respuesta o foto y valídalos con el guía en el campamento:
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                    <strong style="font-size: 0.85rem; color: var(--primary);">Reto 1: Radar Acústico (La Julia)</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; line-height: 1.3;">
                        Identifica y escribe 3 sonidos diferentes de la naturaleza en las zonas boscosas de La Julia. Valida con el guía.
                    </p>
                </div>
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                    <strong style="font-size: 0.85rem; color: var(--primary);">Reto 2: Cacería de Sombras (El Edén)</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; line-height: 1.3;">
                        Toma una fotografía creativa a una formación de raíces o rocas que se asemeje a un rostro o animal en las culebras.
                    </p>
                </div>
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                    <strong style="font-size: 0.85rem; color: var(--primary);">Reto 3: Guardián Botánico (Fila Maestra)</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; line-height: 1.3;">
                        Fotografía tres estados de vida de la flor de Inia o Bromelias locales. Hashtag: #GuardianBotanico #NaiguataExpeditions.
                    </p>
                </div>
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; border: 1px solid rgba(255,255,255,0.03);">
                    <strong style="font-size: 0.85rem; color: var(--primary);">Reto 4: El Topógrafo (Cumbre)</strong>
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 5px; line-height: 1.3;">
                        Adivina la altitud exacta de un punto de control del guía. El más cercano gana los puntos. Hashtag: #RetoTopografo #GeografiaActiva.
                    </p>
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size: 0.75rem; text-align: center; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                _Conserva esta guía offline. Respeta las normas de INPARQUES: No hacer fogatas ni botar basura._
            </div>
        </div>
    `;
}

function shareAdventureFlow() {
    const name = document.getElementById('pass-hiker-name').textContent;
    const serial = document.getElementById('pass-serial-number').textContent;
    const date = document.getElementById('pass-date').textContent;

    const shareText = `¡Ya me he registrado oficialmente para ascender al Pico Naiguatá con Naiguatá Expeditions! 🏔️ Mi código de pase es ${serial} para el próximo viaje. ¿Quién se suma a conquistar la cumbre? 🥾🧗‍♂️`;
    const shareUrl = 'https://naiguata-expeditions.vercel.app/';

    if (navigator.share) {
        navigator.share({
            title: 'Expedición Pico Naiguatá',
            text: shareText,
            url: shareUrl
        }).then(() => console.log('Compartido con éxito.'))
            .catch(err => console.warn('Error al compartir con Web Share API:', err));
    } else {
        // Fallback copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
            .then(() => alert('Enlace de invitación copiado al portapapeles. ¡Compártelo en tus redes!'))
            .catch(() => {
                // Last fallback: Open Whatsapp web chat
                const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
                window.open(waUrl, '_blank');
            });
    }
}

/* ==========================================================================
   SANITIZATION & NORMALIZATION UTILITIES
   ========================================================================== */

function formatTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}


/* ... Todo tu código anterior existente queda intacto arriba ... */

function formatTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}


/* ==========================================================================
   RESTAURACIÓN DE FUNCIONES DE INTERFAZ DINÁMICA (HECHO A MANO)
   ========================================================================== */

// 1. ARREGLA PUNTO 1: Gráfico y descripción interactiva de la Travesía
function renderRouteGraphic() {
    const container = document.getElementById('route-graphic-container');
    if (!container) return;
    container.innerHTML = '';

    routeSteps.forEach((step, index) => {
        const btn = document.createElement('button');
        btn.className = 'route-node-btn';
        btn.style.margin = "5px";
        btn.style.padding = "8px 12px";
        btn.style.backgroundColor = "var(--panel-bg)";
        btn.style.border = "1px solid var(--primary)";
        btn.style.color = "var(--text)";
        btn.style.borderRadius = "8px";
        btn.style.cursor = "pointer";
        btn.innerHTML = `${step.icon || '🏔️'} ${step.name}`;

        btn.onclick = () => {
            document.querySelectorAll('.route-node-btn').forEach(b => b.style.borderColor = 'var(--primary)');
            btn.style.borderColor = 'var(--secondary)';
            showRouteDetails(index);
        };
        container.appendChild(btn);
    });
    showRouteDetails(0);
}

function showRouteDetails(index) {
    const step = routeSteps[index];
    const title = document.getElementById('route-detail-title');
    const altitude = document.getElementById('route-detail-altitude');
    const desc = document.getElementById('route-detail-desc');
    const tips = document.getElementById('route-detail-tips');

    if (title) title.innerText = `${step.name} (${step.altitude})`;
    if (altitude) altitude.innerText = `Distancia: ${step.distance} | Dificultad: ${step.difficulty}`;
    if (desc) desc.innerText = step.desc;
    if (tips) tips.innerHTML = `<strong>💡 Tip del Guía:</strong> ${step.tips}`;
}

// 2. ARREGLA PUNTO 2: Lista del Planificador de Equipaje (Mochila)
function renderBackpackChecklist() {
    const container = document.getElementById('backpack-items-container');
    if (!container) return;

    const items = [
        "Saco de Dormir (0-10ºC)",
        "Calzado de Montaña (Botas/Zapatos de Trail)",
        "Aislante térmico o esterilla (Obligatorio)",
        "Ropa de Abrigo Térmica (Suéter + Mono)",
        "Linterna Frontal / Mano con Pilas",
        "Chubasquero, poncho o chaqueta impermeable",
        "4 Litros de Agua (Mínimo)",
        "Aseo Personal (Cepillo, Jabón biodegradable, Papel)"
    ];

    container.innerHTML = items.map(item => `
        <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" style="width:18px; height:18px; accent-color:var(--primary);"> 
            <span style="color: var(--text); font-size: 0.95rem;">${item}</span>
        </div>
    `).join('');
}

// 3. ARREGLA PUNTO 3: Generador dinámico de Sábados Disponibles para 2026
function populateSaturdays() {
    const select = document.getElementById('expedition-date');
    if (!select) return;
    select.innerHTML = '<option value="">Selecciona un Sábado Disponible *</option>';

    let d = new Date();
    d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);

    for (let i = 0; i < 6; i++) {
        let dateString = d.toISOString().split('T')[0];
        let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let formatted = d.toLocaleDateString('es-ES', options);

        let opt = document.createElement('option');
        opt.value = dateString;
        opt.innerText = formatted.charAt(0).toUpperCase() + formatted.slice(1);
        select.appendChild(opt);

        d.setDate(d.getDate() + 7);
    }
}

// Inicializador de seguridad para ejecutar las funciones añadidas
setTimeout(() => {
    renderRouteGraphic();
    renderBackpackChecklist();
    populateSaturdays();
}, 500);


// ARREGLA PUNTO 6: Listener dinámico de pasarela informativa de pagos
document.addEventListener('DOMContentLoaded', () => {
    const methodSelect = document.getElementById('payment-method');
    if (methodSelect) {
        methodSelect.addEventListener('change', (e) => {
            const method = e.target.value;
            // Busca o crea un contenedor para los datos
            let instructionDiv = document.getElementById('payment-instructions-box');
            if (!instructionDiv) {
                instructionDiv = document.createElement('div');
                instructionDiv = document.createElement('div');
                instructionDiv.id = 'payment-instructions-box';
                instructionDiv.style.marginTop = "15px";
                instructionDiv.style.padding = "15px";
                instructionDiv.style.borderRadius = "8px";
                instructionDiv.style.backgroundColor = "rgba(244, 162, 97, 0.1)";
                instructionDiv.style.border = "1px dashed var(--secondary)";
                methodSelect.parentNode.appendChild(instructionDiv);
            }

            let details = "";
            switch (method) {
                case 'Efectivo':
                    details = "<strong>Efectivo (USD):</strong> Se cancelará de forma presencial el día del control técnico y de seguridad previo en Caracas.";
                    break;
                case 'Zelle':
                    details = "<strong>Zelle (Divisas):</strong><br>Correo: <code>diego.morono03@gmail.com</code><br>A nombre de: Diego Moroño.<br><em>Por favor, guarda el capture de la operación.</em>";
                    break;
                case 'Binance':
                    details = "<strong>Binance Pay (USDT):</strong><br>Email de Pago: <code>thecardanomerch@gmail.com</code><br>Asegúrate de enviar el monto neto sin comisión de red.";
                    break;
                case 'Pago Móvil':
                    details = "<strong>Pago Móvil (Bs. a tasa BCV):</strong><br>Banco: Banesco (0134)<br>Cédula: V-24218655<br>Teléfono: 0426-2062588";
                    break;
                default:
                    details = "Por favor selecciona un método de pago válido para ver los datos de transferencia.";
            }
            instructionDiv.innerHTML = details;
        });
    }
});


/* ==========================================================================
   MÓDULO DE AUTENTICACIÓN INTEGRADO MANUALMENTE (ARREGLA PUNTO 8)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('admin-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const passwordInput = document.getElementById('admin-password');
            if (!passwordInput) {
                alert('Error del sistema: No se encontró el campo de contraseña en la interfaz.');
                return;
            }

            const passwordValue = passwordInput.value;

            // Generar Hash SHA-256 local de forma segura
            const inputHash = await computeSHA256(passwordValue);

            // Validación contra la constante maestra
            if (inputHash === ADMIN_PASSWORD_HASH) {
                localStorage.setItem('admin_session', 'true');

                const loginView = document.getElementById('admin-login-view');
                const dashboardView = document.getElementById('admin-dashboard');

                if (loginView) loginView.style.display = 'none';
                if (dashboardView) dashboardView.style.display = 'block';

                // Ejecuta las funciones nativas de carga si están definidas en el archivo
                if (typeof loadDashboardData === "function") {
                    loadDashboardData();
                } else if (typeof fetchAndRenderAdminData === "function") {
                    fetchAndRenderAdminData();
                } else if (typeof renderSettingsCatalog === "function") {
                    renderSettingsCatalog();
                }
            } else {
                alert('Contraseña maestra inválida. Intente nuevamente.');
            }
        });
    }
});