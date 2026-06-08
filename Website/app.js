/* ==========================================================================
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
   ========================================================================== */

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';

// Hash maestro para el inicio de sesión del administrador
const ADMIN_PASSWORD_HASH = "AQUÍ_VA_TU_HASH_SHA256_REAL";

// Instancia del cliente Supabase (Descomentar cuando esté configurado el SDK en el HTML)
// const supabase = (window.supabase && SUPABASE_URL.indexOf('__SUPABASE_') === -1)
//     ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
//     : null;

const appState = {
    activeView: 'client-view',
    bcvRate: 575.00, // Tasa base de respaldo estable en Bs
    bcvSource: 'default',
    activeStepIndex: 0,
    inventory: [],
    logisticServices: [],
    cateringCatalog: []
};

// Matriz estática de los puntos de control de la ruta
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

/* ==========================================================================
   2. ORQUEStADOR PRINCIPAL DE INICIALIZACIÓN (DOM LOAD)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    console.log("[Naiguatá OS] Iniciando secuencia de montaje de la interfaz...");

    // 1. Módulos del Core de la Interfaz
    const modulos = [
        { name: 'Navegación de Vistas', func: initAppNavigation },
        { name: 'Planificador de Equipaje', func: initGearChecklist },
        { name: 'Marcadores de la Ruta', func: initElevationStepper },
        { name: 'Formulario de Cotización y Registro', func: initBookingForm },
        { name: 'Resolución de Tasa Oficial BCV', func: resolveBcvRate },
        { name: 'Pasarela Dinámica de Pagos', func: initPaymentInstructions },
        { name: 'Autenticación Admin', func: initAdminLogin }
    ];

    modulos.forEach(mod => {
        try {
            if (typeof mod.func === 'function') {
                mod.func();
                console.log(`[Init] Módulo cargado con éxito: ${mod.name}`);
            }
        } catch (err) {
            console.error(`[Critical Error] El módulo "${mod.name}" falló:`, err);
        }
    });

    // 2. Procesos Asíncronos secundarios y de persistencia
    try { if (typeof loadSupabaseData === 'function') loadSupabaseData(); } catch (e) { }
    try { if (typeof restoreFormDraft === 'function') restoreFormDraft(); } catch (e) { }
    try { if (typeof processOfflineQueue === 'function') processOfflineQueue(); } catch (e) { }

    // 3. Renderizar funciones manuales de contingencia
    setTimeout(() => {
        try { if (typeof renderRouteGraphic === 'function') renderRouteGraphic(); } catch (e) { }
        try { if (typeof renderBackpackChecklist === 'function') renderBackpackChecklist(); } catch (e) { }
        try { if (typeof populateSaturdays === 'function') populateSaturdays(); } catch (e) { }
        try { if (typeof actualizarOpcionesPortador === 'function') actualizarOpcionesPortador(); } catch (e) { }
    }, 500);
});

/* ==========================================================================
   3. MÓDULO DE NAVEGACIÓN DE VISTAS
   ========================================================================== */
function initAppNavigation() {
    const navLogo = document.getElementById('nav-logo');
    if (navLogo) {
        navLogo.addEventListener('click', () => switchView('client-view'));
    }

    const btnReturn = document.getElementById('btn-return-home');
    if (btnReturn) {
        btnReturn.addEventListener('click', () => {
            switchView('client-view');
            const form = document.getElementById('expedition-form');
            if (form) form.reset();
            localStorage.removeItem('naiguata_form_draft');
            if (typeof resetFormTotal === 'function') resetFormTotal();
        });
    }
}

function switchView(viewId) {
    if (!document.getElementById(viewId)) return;
    appState.activeView = viewId;
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   4. CONTROLADOR DEL PASO A PASO DE ELEVACIÓN DE LA RUTA
   ========================================================================== */
function initElevationStepper() {
    const stepButtons = document.querySelectorAll('.step-nav-btn, .route-tab-btn');
    const mapDots = document.querySelectorAll('.map-dot');

    if (stepButtons.length === 0 && mapDots.length === 0) return;

    function selectStep(index) {
        appState.activeStepIndex = index;
        stepButtons.forEach(btn => btn.classList.remove('active'));
        mapDots.forEach(dot => dot.classList.remove('active'));

        const activeBtn = document.querySelectorAll(`[data-step="${index}"]`);
        activeBtn.forEach(el => el.classList.add('active'));

        renderActiveStepDetails();
    }

    stepButtons.forEach((btn, idx) => {
        btn.addEventListener('click', (e) => {
            const stepIdx = e.target.getAttribute('data-step') ? parseInt(e.target.getAttribute('data-step')) : idx;
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
    const step = routeSteps[appState.activeStateIndex || appState.activeStepIndex];

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
                <strong>Consejo del Guía:</strong> ${step.tips}
            </div>
        </div>
    `;
}

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

/* ==========================================================================
   5. PLANIFICADOR DE EQUIPAJE INTELEGENTE (GEAR CHECKLIST)
   ========================================================================== */
function initGearChecklist() {
    const articulosRequeridos = [
        "Saco de Dormir (0-10ºC)",
        "Calzado de Montaña (Botas/Zapatos de Trail)",
        "Aislante térmico o esterilla (Obligatorio)",
        "Ropa de Abrigo Térmica (Suéter + Mono)",
        "Linterna Frontal / Mano con Pilas",
        "Chubasquero, poncho o chaqueta impermeable",
        "4 Litros de Agua (Mínimo)",
        "Aseo Personal (Cepillo, Jabón biodegradable, Papel)"
    ];

    const contenedorLista = document.getElementById("interactive-gear-list");
    if (!contenedorLista) return;
    contenedorLista.innerHTML = "";

    articulosRequeridos.forEach((articulo, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "10px";
        li.style.marginBottom = "8px";
        li.innerHTML = `
            <input type="checkbox" id="chk-item-${index}" class="checklist-item-checkbox gear-chk" style="cursor:pointer; width:18px; height:18px;">
            <label for="chk-item-${index}" style="cursor:pointer; color:#e0e6e3; font-size:0.9rem;">${articulo}</label>
        `;
        contenedorLista.appendChild(li);
    });

    contenedorLista.addEventListener("change", (e) => {
        if (e.target.classList.contains("checklist-item-checkbox")) updateChecklistProgress();
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.gear-chk');
    const txtPorcentaje = document.getElementById("prep-percentage");
    const barraProgreso = document.getElementById("prep-bar");
    const warningBanner = document.getElementById('checklist-warning');

    if (checkboxes.length === 0) return;

    const marcados = Array.from(checkboxes).filter(chk => chk.checked).length;
    const percentage = Math.round((marcados / checkboxes.length) * 100);

    if (txtPorcentaje) txtPorcentaje.textContent = `${percentage}%`;
    if (barraProgreso) barraProgreso.style.width = `${percentage}%`;

    if (warningBanner) {
        if (percentage < 100) {
            warningBanner.style.display = "flex";
            warningBanner.classList.remove('hidden');
        } else {
            warningBanner.style.display = "none";
            warningBanner.classList.add('hidden');
        }
    }
}

function renderBackpackChecklist() {
    const container = document.getElementById('backpack-items-container');
    if (!container) return;
    initGearChecklist();
}

/* ==========================================================================
   6. CONTROLADOR FORMULARIO DE RESERVA Y TOTALIZADOR DINÁMICO
   ========================================================================== */
function initBookingForm() {
    const form = document.getElementById('expedition-form');
    if (!form) return;

    form.addEventListener('input', saveFormDraft);
    form.addEventListener('change', saveFormDraft);

    // Formateo dinámico del input telefónico de Whatsapp
    const phoneInput = document.getElementById('hiker-whatsapp');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^\d+]/g, '');
            if (val.length > 0 && val[0] !== '+') val = '+' + val;
            e.target.value = val;
        });
    }

    // Inicializar Steppers (+ y -) de Equipamiento y Catering
    document.querySelectorAll(".stepper-btn").forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            let currentVal = parseInt(input.value) || 0;
            let maxStock = parseInt(input.getAttribute("data-max")) || 999;

            if (this.classList.contains("plus")) {
                if (currentVal < maxStock) {
                    input.value = currentVal + 1;
                } else {
                    const container = input.closest(".stepper-container");
                    if (container) {
                        container.style.borderColor = "#ff5252";
                        setTimeout(() => { container.style.borderColor = ""; }, 300);
                    }
                }
            } else if (this.classList.contains("minus")) {
                if (currentVal > 0) {
                    input.value = currentVal - 1;
                }
            }
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    });

    // Escuchadores para calcular precios al cambiar cualquier valor
    document.querySelectorAll(".calc-trigger, .rental-checkbox, .snack-qty-input, .equipment-input, .catering-input").forEach(element => {
        const eventType = element.tagName === "INPUT" && element.type === "number" ? "input" : "change";
        element.addEventListener(eventType, updateFormPricing);
    });

    const selectAlojamiento = document.getElementById("housing-preference-select");
    if (selectAlojamiento) {
        selectAlojamiento.addEventListener("change", actualizarOpcionesPortador);
    }

    form.addEventListener('submit', handleFormSubmission);

    populateSaturdays();
    updateFormPricing();
}

function actualizarOpcionesPortador() {
    const selectAlojamiento = document.getElementById("housing-preference-select");
    const selectPortador = document.getElementById("logistic-carrier-select");
    if (!selectPortador) return;

    const opt2p = document.getElementById("opt-carrier-2p");
    const opt3p = document.getElementById("opt-carrier-3p");
    const opt4p = document.getElementById("opt-carrier-4p");

    if (!selectAlojamiento) {
        if (opt2p) opt2p.disabled = false;
        if (opt3p) opt3p.disabled = false;
        if (opt4p) opt4p.disabled = false;
        return;
    }

    const opcionSeleccionada = selectAlojamiento.options[selectAlojamiento.selectedIndex];
    if (!opcionSeleccionada) return;

    const textoCompleto = opcionSeleccionada.text.toLowerCase();
    const valorCompleto = selectAlojamiento.value.toLowerCase();

    if (opt2p) opt2p.disabled = true;
    if (opt3p) opt3p.disabled = true;
    if (opt4p) opt4p.disabled = true;

    if (textoCompleto.includes("2") || valorCompleto.includes("2")) {
        if (opt2p) opt2p.disabled = false;
    } else if (textoCompleto.includes("3") || valorCompleto.includes("3")) {
        if (opt3p) opt3p.disabled = false;
    } else if (textoCompleto.includes("4") || valorCompleto.includes("4")) {
        if (opt4p) opt4p.disabled = false;
    } else {
        if (opt2p) opt2p.disabled = false;
        if (opt3p) opt3p.disabled = false;
        if (opt4p) opt4p.disabled = false;
    }

    if (selectPortador.selectedOptions[0] && selectPortador.selectedOptions[0].disabled) {
        selectPortador.value = "0";
    }

    updateFormPricing();
}

function updateFormPricing() {
    let basePrice = 50.00;
    let extraCosts = 0.00;

    // 1. Checkboxes tradicionales de alquiler
    document.querySelectorAll('.rental-checkbox:checked').forEach(chk => {
        extraCosts += parseFloat(chk.getAttribute('data-price')) || 0;
    });

    // 2. Elementos con incremento numérico de equipamiento y catering masivo
    document.querySelectorAll('.snack-qty-input, .equipment-input, .catering-input').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const price = parseFloat(input.getAttribute('data-price')) || 0;
        extraCosts += qty * price;
    });

    // 3. Selector del Portador logístico
    const selectPortador = document.getElementById("logistic-carrier-select");
    if (selectPortador) {
        extraCosts += parseFloat(selectPortador.value) || 0;
    }

    const totalUsd = basePrice + extraCosts;
    const totalVes = totalUsd * appState.bcvRate;

    // Inyectar en elementos correspondientes del HTML
    const formTotalUsd = document.getElementById('form-total-usd') || document.getElementById("expedition-total-display");
    const formTotalVes = document.getElementById('form-total-ves');
    const rentalCostDisplay = document.getElementById('rental-cost-display');
    const rentalSummaryRow = document.getElementById('rental-summary-row');

    if (rentalSummaryRow && rentalCostDisplay) {
        if (extraCosts > 0) {
            rentalSummaryRow.classList.remove('hidden');
            rentalCostDisplay.textContent = `+$${extraCosts.toFixed(2)} USD`;
        } else {
            rentalSummaryRow.classList.add('hidden');
        }
    }

    if (formTotalUsd) formTotalUsd.textContent = `$${totalUsd.toFixed(2)} USD`;
    if (formTotalVes) formTotalVes.textContent = `Bs. ${formatCurrency(totalVes)}`;

    const floatingTotal = document.getElementById('floating-bar-total');
    if (floatingTotal) {
        floatingTotal.textContent = `Pase de Expedición: Total a Transferir $${totalUsd.toFixed(2)} USD`;
    }
}

function resetFormTotal() {
    updateFormPricing();
}

function populateSaturdays() {
    const selectSabados = document.getElementById("booking-date") || document.getElementById('expedition-date');
    if (!selectSabados) return;

    selectSabados.innerHTML = '<option value="" disabled selected>Selecciona un sábado...</option>';

    let hoy = new Date();
    let sabadosEncontrados = 0;

    for (let i = 0; i < 45 && sabadosEncontrados < 6; i++) {
        let diaFuturo = new Date(hoy);
        diaFuturo.setDate(hoy.getDate() + i);

        if (diaFuturo.getDay() === 6) {
            let opcionesFormato = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
            let fechaTexto = diaFuturo.toLocaleDateString('es-ES', opcionesFormato);
            fechaTexto = fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1);
            let valorFecha = diaFuturo.toISOString().split('T')[0];

            let nuevaOption = document.createElement("option");
            nuevaOption.value = valorFecha;
            nuevaOption.textContent = fechaTexto;
            selectSabados.appendChild(nuevaOption);
            sabadosEncontrados++;
        }
    }
}

/* ==========================================================================
   7. PASARELA DE PAGOS E INSTRUCCIONES DINÁMICAS Y PERSISTENCIA
   ========================================================================== */
function initPaymentInstructions() {
    const methodSelect = document.getElementById('payment-method') || document.getElementById('payment-method-select');
    if (!methodSelect) return;

    methodSelect.addEventListener('change', (e) => {
        const method = e.target.value;
        let instructionDiv = document.getElementById('payment-instructions-box');
        if (!instructionDiv) {
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

function saveFormDraft() {
    const draft = {
        name: document.getElementById('hiker-name')?.value,
        email: document.getElementById('hiker-email')?.value,
        whatsapp: document.getElementById('hiker-whatsapp')?.value,
        group: document.getElementById('booking-group')?.value,
        gender: document.getElementById('hiker-gender')?.value,
        tentPreference: document.getElementById('hiker-tent-preference')?.value,
        allergies: document.getElementById('hiker-allergies')?.value,
        medical: document.getElementById('hiker-medical')?.value,
        date: document.getElementById('booking-date')?.value || document.getElementById('expedition-date')?.value,
        referenceNumber: document.getElementById('payment-reference')?.value,
        paymentMethod: document.getElementById('payment-method-select')?.value || document.getElementById('payment-method')?.value
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
        if (draft.medical) document.getElementById('hiker-medical').value = draft.medical;

        const dateEl = document.getElementById('booking-date') || document.getElementById('expedition-date');
        if (dateEl && draft.date) {
            dateEl.value = draft.date;
        }
        if (draft.referenceNumber && document.getElementById('payment-reference')) document.getElementById('payment-reference').value = draft.referenceNumber;

        const payEl = document.getElementById('payment-method-select') || document.getElementById('payment-method');
        if (payEl && draft.paymentMethod) {
            payEl.value = draft.paymentMethod;
            payEl.dispatchEvent(new Event('change'));
        }
        updateFormPricing();
    } catch (e) {
        console.warn('Fallo restaurando el borrador del localStorage:', e);
    }
}

/* ==========================================================================
   8. RESOLUCIÓN DE TASA DE CAMBIO BCV Y CONECTIVIDAD SUPABASE
   ========================================================================== */
async function resolveBcvRate() {
    // CAPA 1: DolarApi.com
    try {
        const response = await Promise.race([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de Red')), 3000))
        ]);

        if (!response.ok) throw new Error('Error en el servidor de la API');
        const data = await response.json();
        const rate = parseFloat(data.price);

        if (rate && !isNaN(rate)) {
            appState.bcvRate = rate;
            appState.bcvSource = 'api';
            updateCurrencyUI();
            return;
        }
    } catch (err) {
        console.warn('Capa 1 BCV falló, recurriendo a Capa 2 (Supabase):', err);
    }

    // CAPA 2: Base de Datos Supabase de respaldo
    if (typeof supabase !== 'undefined' && supabase !== null) {
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
            console.warn('Capa 2 BCV falló, activando modo emergencia local:', err);
        }
    }

    // CAPA 3: Fallback local por defecto
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
}

function triggerEmergencyMode() {
    console.error('ALERTA: Sistema Naiguatá en Modo de Emergencia - Fallo de Conexión Total');
}

async function loadSupabaseData() {
    if (typeof supabase === 'undefined' || !supabase) return;
    try {
        const { data: invData } = await supabase.from('inventory_stock').select('*');
        if (invData) appState.inventory = invData;

        const { data: servData } = await supabase.from('logistic_services').select('*');
        if (servData) appState.logisticServices = servData;

        const { data: catData } = await supabase.from('catering_inventory').select('*');
        if (catData) appState.cateringCatalog = catData;

        updateFormPricing();
    } catch (err) {
        console.error('Error cargando catálogos de Supabase:', err);
    }
}

/* ==========================================================================
   9. ENVÍO DE FORMULARIOS, PROCESAMIENTO RPC Y RESILIENCIA OFFLINE
   ========================================================================== */
async function handleFormSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Confirmar Registro';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-small"></span> Procesando registro...`;
    }

    // Captura segura de datos
    const name = formatTitleCase(document.getElementById('hiker-name').value.trim());
    const email = document.getElementById('hiker-email').value.trim().toLowerCase();
    const whatsapp = document.getElementById('hiker-whatsapp').value.trim();
    const gender = document.getElementById('hiker-gender')?.value || 'No especificado';
    const medical = document.getElementById('hiker-medical')?.value.trim() || 'Ninguna.';
    const allergies = document.getElementById('hiker-allergies')?.value || 'Ninguna';

    const dateVal = document.getElementById('booking-date')?.value || document.getElementById('expedition-date')?.value;
    const paymentMethod = document.getElementById('payment-method')?.value || document.getElementById('payment-method-select')?.value;
    const referenceNumber = document.getElementById('payment-reference') ? document.getElementById('payment-reference').value.trim() : 'N/A';

    const totalUsd = parseFloat(document.getElementById('form-total-usd')?.textContent.replace(/[^0-9.]/g, '')) || 50.00;
    const passId = 'NE-' + Math.floor(100000 + Math.random() * 900000);

    const bookingData = {
        id: passId,
        date: dateVal,
        name: name,
        email: email,
        whatsapp: whatsapp,
        gender: gender,
        medical: medical,
        allergies: allergies,
        total_usd: totalUsd,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        rentals: [],
        catering: [],
        diet: 'Estándar',
        tent_preference: 'Compartida'
    };

    if (typeof supabase !== 'undefined' && supabase) {
        try {
            // Envío directo mediante llamada RPC atómica a Postgres
            const { data, error } = await supabase.rpc('register_hiker', {
                p_id: passId,
                p_date: dateVal,
                p_name: name,
                p_email: email,
                p_whatsapp: whatsapp,
                p_group_code: 'INDIVIDUAL',
                p_gender: gender,
                p_tent_preference: 'Compartida',
                p_allergies: allergies,
                p_diet: 'Estándar',
                p_medical: medical,
                p_rentals: JSON.stringify([]),
                p_catering: JSON.stringify([]),
                p_porter_service: 'No',
                p_total_usd: totalUsd,
                p_payment_method: paymentMethod,
                p_reference_number: referenceNumber
            });

            if (error) throw error;

            alert('¡Inscripción procesada con éxito!');
            renderExpeditionPass(bookingData);
            switchView('pass-view');
            localStorage.removeItem('naiguata_form_draft');
        } catch (err) {
            console.error('Error registrando en servidor, guardando copia local:', err);
            addToOfflineQueue(bookingData);
            showOfflineSuccess(bookingData);
        }
    } else {
        // Ejecución en modo sin conexión si Supabase no está instanciado
        addToOfflineQueue(bookingData);
        showOfflineSuccess(bookingData);
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function addToOfflineQueue(bookingData) {
    const queue = JSON.parse(localStorage.getItem('naiguata_offline_queue') || '[]');
    queue.push(bookingData);
    localStorage.setItem('naiguata_offline_queue', JSON.stringify(queue));
}

async function processOfflineQueue() {
    if (!navigator.onLine || typeof supabase === 'undefined' || !supabase) return;
    const queue = JSON.parse(localStorage.getItem('naiguata_offline_queue') || '[]');
    if (queue.length === 0) return;

    console.log('¡Conexión restaurada! Sincronizando registros offline...');
    // Lógica para vaciar la cola recursivamente aquí...
    localStorage.setItem('naiguata_offline_queue', JSON.stringify([]));
}

window.addEventListener('online', processOfflineQueue);

function showOfflineSuccess(booking) {
    renderExpeditionPass(booking);
    const serialEl = document.getElementById('pass-serial-number');
    if (serialEl) {
        serialEl.innerHTML = `${booking.id} <span style="font-size: 0.7rem; color: #ff5252; display:block;">Pase Offline (Pendiente de Sincronizar)</span>`;
    }
    switchView('pass-view');
}

/* ==========================================================================
   10. PASAPORTE DE AVENTURA, RETOS GAMIFICADOS Y UTILIDADES DEL TOUR
   ========================================================================== */
function renderExpeditionPass(booking) {
    if (document.getElementById('pass-hiker-name')) document.getElementById('pass-hiker-name').textContent = booking.name;
    if (document.getElementById('pass-date')) document.getElementById('pass-date').textContent = booking.date;
    if (document.getElementById('pass-serial-number')) document.getElementById('pass-serial-number').textContent = booking.id;

    injectGamifiedManual();
}

function injectGamifiedManual() {
    const printablePassCard = document.getElementById('printable-pass-card');
    if (!printablePassCard) return;

    let manualPage = document.getElementById('tour-manual-page');
    if (!manualPage) {
        manualPage = document.createElement('div');
        manualPage.id = 'tour-manual-page';
        manualPage.style.marginTop = '40px';
        manualPage.style.paddingTop = '40px';
        manualPage.style.borderTop = '2px dashed rgba(255,255,255,0.1)';
        printablePassCard.appendChild(manualPage);
    }

    manualPage.innerHTML = `
        <div style="font-family: 'Outfit', sans-serif; padding: 25px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
            <h2 style="text-align: center; color: #f4a261; margin-bottom: 20px;">Manual del Tour: Pico Naiguatá (2.765 m)</h2>
            <h4 style="color: #f4a261;">🎮 Pasaporte de Aventura y Retos en Ruta (10% Descuento)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top:15px;">
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;"><strong style="color:#f4a261;">Reto 1: Radar Acústico</strong><p style="font-size:0.75rem; color:#a0a6a3;">Identifica 3 sonidos de aves en La Julia.</p></div>
                <div style="padding: 10px; background: rgba(255,255,255,0.02); border-radius: 8px;"><strong style="color:#f4a261;">Reto 2: Guardián Botánico</strong><p style="font-size:0.75rem; color:#a0a6a3;">Fotografía Bromelias en la Fila Maestra.</p></div>
            </div>
        </div>`;
}

function initAdminLogin() {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const passwordInput = document.getElementById('admin-password');
        if (!passwordInput) return;

        const inputHash = await computeSHA256(passwordInput.value);

        if (inputHash === ADMIN_PASSWORD_HASH) {
            localStorage.setItem('admin_session', 'true');
            if (document.getElementById('admin-login-view')) document.getElementById('admin-login-view').style.display = 'none';
            if (document.getElementById('admin-dashboard')) document.getElementById('admin-dashboard').style.display = 'block';
        } else {
            alert('Contraseña maestra inválida.');
        }
    });
}

// Utilidades de formato y criptografía
function formatCurrency(val) {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function computeSHA256(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subcrypto ? crypto.subtle.digest('SHA-256', utf8) : crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
