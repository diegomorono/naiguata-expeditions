/* ==========================================================================
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
   ========================================================================== */

const SUPABASE_URL = 'https://cnoeumcshfrfrzyvbxcn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qF2ETcffYEwh0nz27uV1rQ_JSxp7mA6';
const ADMIN_PASSWORD_HASH = 'f6146b8353b55e153bf40786ebe755ac8aff89586fbd6111a89f35e8ebe00904';

// INICIALIZACIÓN ROBUSTA:
let supabaseClient = null;

function initSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase inicializado correctamente.");
    } else {
        setTimeout(initSupabase, 500);
    }
}

// Ejecutar inicialización
initSupabase();

const appState = {
    activeView: 'client-view',
    bcvRate: 580.00,
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
document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Naiguatá OS] Iniciando secuencia de montaje de la interfaz...");

    // 1. Módulos del Core de la Interfaz (Ejecución aislada y segura)
    const modulos = [
        { name: 'Navegación de Vistas', func: initAppNavigation },
        { name: 'Planificador de Equipaje', func: initGearChecklist },
        { name: 'Marcadores de la Ruta', func: initElevationStepper },
        { name: 'Formulario de Cotización y Registro', func: initBookingForm },
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

    // 2. Resolución asíncrona segura de la Tasa BCV (Sin colgar el hilo principal)
    try {
        console.log("[Init] Resolviendo tasas cambiarias de respaldo...");
        if (typeof resolveBcvRate === 'function') {
            await resolveBcvRate();
        }
        if (typeof loadSystemSettings === 'function') {
            loadSystemSettings();
        }
    } catch (e) {
        console.error("[Network Error] Falló la configuración de red inicial (BCV):", e);
    }

    // 3. Inicialización de listeners para la vista de éxito
    try {
        initSuccessViewEvents();
    } catch (e) {
        console.error("[UI Error] No se pudieron vincular los eventos de éxito:", e);
    }

    // 4. Procesos asíncronos secundarios y persistencia local
    try { if (typeof loadSupabaseData === 'function') loadSupabaseData(); } catch (e) { }
    try { if (typeof restoreFormDraft === 'function') restoreFormDraft(); } catch (e) { }
    try { if (typeof processOfflineQueue === 'function') processOfflineQueue(); } catch (e) { }

    // 5. Renderizar componentes e inyecciones visuales (Sábados, Mochila, Portadores)
    setTimeout(() => {
        try { if (typeof renderRouteGraphic === 'function') renderRouteGraphic(); } catch (e) { }
        try { if (typeof renderBackpackChecklist === 'function') renderBackpackChecklist(); } catch (e) { }
        try { if (typeof populateSaturdays === 'function') populateSaturdays(); } catch (e) { }
        try { if (typeof actualizarOpcionesPortador === 'function') actualizarOpcionesPortador(); } catch (e) { }
    }, 500);
});

/* ==========================================================================
   2.1 FUNCIONES DE VISTA DE ÉXITO Y LIMPIEZA SANEADAS
   ========================================================================== */
function initSuccessViewEvents() {
    const btnPrint = document.getElementById('btn-print-pass');
    const btnShare = document.getElementById('btn-share-adventure');

    if (btnPrint) {
        btnPrint.onclick = function () {
            window.print();
        };
    }

    if (btnShare) {
        btnShare.onclick = function () {
            if (typeof appState !== 'undefined' && appState.lastBooking) {
                compartirFichaInscripcion(appState.lastBooking);
            } else {
                alert("No se encontraron registros de inscripción activos para respaldar.");
            }
        };
    }
}

function sanearTexto(str) {
    if (!str) return '';
    // Corregido eliminando la trampa de caracteres vacíos que rompía el compilador
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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

    // 1. Delegación de eventos: Escucha cualquier cambio en cualquier campo del formulario
    form.addEventListener('input', (e) => {
        saveFormDraft(); // Tu lógica de autoguardado
        updateFormPricing(); // <--- Ahora cada vez que algo cambia, recalcula
    });

    form.addEventListener('change', (e) => {
        saveFormDraft();
        updateFormPricing(); // <--- Recalcula también en cambios de select/checkbox
    });

    // 2. Lógica específica para los botones Stepper (+ / -)
    document.querySelectorAll(".stepper-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            const targetId = this.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            let currentVal = parseInt(input.value) || 0;
            let maxStock = parseInt(input.getAttribute("data-max")) || 999;

            if (this.classList.contains("plus")) {
                if (currentVal < maxStock) input.value = currentVal + 1;
            } else if (this.classList.contains("minus")) {
                if (currentVal > 0) input.value = currentVal - 1;
            }

            input.dispatchEvent(new Event("input", { bubbles: true }));
            updateFormPricing(); // Forzar recalculo inmediato
        });
    });

    // 3. Lógica específica de lógica condicional (Alojamiento -> Portador)
    const selectAlojamiento = document.getElementById("hiker-tent-preference");
    if (selectAlojamiento) {
        selectAlojamiento.addEventListener("change", actualizarOpcionesPortador);
    }

    form.addEventListener('submit', handleFormSubmission);

    // Inicialización
    populateSaturdays();
    updateFormPricing();
}

function actualizarOpcionesPortador() {
    const carrierButtons = document.querySelectorAll('.carrier-btn');
    const hiddenInput = document.getElementById('logistic-carrier-select');

    if (carrierButtons.length === 0 || !hiddenInput) return;

    carrierButtons.forEach(button => {
        // Clonamos para remover listeners viejos acumulados en memoria
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', () => {
            // 1. Apagar visualmente todos los botones de esta sección
            document.querySelectorAll('.carrier-btn').forEach(btn => btn.classList.remove('active'));

            // 2. Encender el botón presionado
            newButton.classList.add('active');

            // 3. Asignar el valor numérico al input oculto
            const valor = newButton.getAttribute('data-value');
            hiddenInput.value = valor;

            // 4. Disparar tu calculadora nativa para actualizar los totales en pantalla
            if (typeof updateFormPricing === "function") {
                updateFormPricing();
            }

            // 5. Guardar el borrador en el borrador automático si existe
            if (typeof saveFormDraft === "function") {
                saveFormDraft();
            }
        });
    });
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
   7. PASARELA DE PAGOS E INSTRUCCIONES DINÁMICAS Y PERSISTENCIA (SINCRO REAL)
   ========================================================================== */
function initPaymentInstructions() {
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const paymentSelect = document.getElementById('payment-method') || document.getElementById('payment-method-select');
    const container = document.getElementById('payment-instructions-box') || document.getElementById('payment-instructions');
    const paymentDetails = document.getElementById('payment-details');

    if (!container) return;

    // Diccionario con cálculo de montos dinámicos en tiempo real
    const data = {
        'zelle': [
            { label: 'Monto a Transferir', value: `${appState.totalCart || 0} USD` },
            { label: 'Titular', value: 'Diego Moroño' },
            { label: 'Email', value: 'diego.morono03@gmail.com' }
        ],
        'binance': [
            { label: 'Monto a Transferir', value: `${appState.totalCart || 0} USDT` },
            { label: 'Email', value: 'thecardanomerch@gmail.com' }
        ],
        'pagomovil': [
            { label: 'Monto en Bs.', value: `${((appState.totalCart || 0) * (appState.bcvRate || 1)).toFixed(2)} Bs.` },
            { label: 'Teléfono', value: '04262062588' },
            { label: 'Cédula', value: 'V24218655' },
            { label: 'Banco', value: 'Banesco (0134)' }
        ]
    };

    // Función interna encargada de procesar el método y renderizar los datos
    function updatePaymentUI(methodName) {
        if (!methodName) {
            container.innerHTML = '';
            container.style.display = 'none';
            if (paymentDetails) paymentDetails.style.display = 'none';
            return;
        }

        // LIMPIEZA RIGUROSA: Convierte "Pago Móvil" -> "pagomovil" para emparejar con el diccionario
        const method = methodName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

        // Sincronizar con el input/select si es necesario
        const hiddenInput = document.getElementById('payment-method-select') || document.getElementById('payment-method');
        if (hiddenInput && hiddenInput.value !== methodName) {
            hiddenInput.value = methodName;
        }

        if (data[method]) {
            container.style.display = 'block';
            container.innerHTML = `<div class="payment-grid" style="display: flex; flex-direction: column; gap: 12px; background: rgba(15, 22, 30, 0.4); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">` +
                data[method].map(item => `
                    <div class="pay-item" style="display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.04);">
                        <span class="pay-lbl" style="font-size: 0.75rem; color: #a1a1aa; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${item.label}</span>
                        <div class="pay-row" style="display: flex; justify-content: space-between; align-items: center; gap: 15px;">
                            <code style="font-family: monospace; font-size: 1rem; color: #10b981; background: transparent; padding: 0;">${item.value}</code>
                            <button type="button" class="mini-copy-btn" 
                                    style="padding: 5px 12px; font-size: 0.8rem; background: #10b981; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s;" 
                                    onclick="copyToClipboard('${item.value}', this)">
                                Copiar
                            </button>
                        </div>
                    </div>
                `).join('') + `</div>`;

            if (paymentDetails) paymentDetails.style.display = 'block';
        } else if (method === 'efectivo') {
            container.style.display = 'block';
            container.innerHTML = `
                <div style="background: rgba(15, 22, 30, 0.4); padding: 15px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <p class="payment-info" style="margin: 0; color: var(--text-muted, #a1a1aa); font-size: 0.88rem; line-height: 1.5;">
                        El pago se entregará en físico en persona al guía el día del inicio del tour en La Julia.
                    </p>
                </div>
            `;
            if (paymentDetails) paymentDetails.style.display = 'block';
        } else {
            container.innerHTML = '';
            container.style.display = 'none';
            if (paymentDetails) paymentDetails.style.display = 'none';
        }

        if (typeof saveFormDraft === 'function') {
            saveFormDraft();
        }
    }

    if (paymentSelect) {
        paymentSelect.addEventListener('change', (e) => {
            updatePaymentUI(e.target.value);
        });
        if (paymentSelect.value) {
            updatePaymentUI(paymentSelect.value);
        }
    }

    if (paymentButtons.length > 0) {
        paymentButtons.forEach(button => {
            button.addEventListener('click', () => {
                paymentButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const methodAttr = button.getAttribute('data-method') || button.getAttribute('data-data-method') || '';
                updatePaymentUI(methodAttr);
            });
        });
    }
}

// Función global limpia para el portapapeles
function copyToClipboard(text, element) {
    // Quitamos los sufijos de moneda para copiar únicamente el dato puro e impecable
    const cleanText = text.replace(' USD', '').replace(' USDT', '').replace(' Bs.', '').trim();

    navigator.clipboard.writeText(cleanText).then(() => {
        if (element) {
            const originalText = element.textContent;
            element.textContent = "✅ Listo";
            element.style.background = "#ffffff";
            element.style.color = "#000000";

            setTimeout(() => {
                element.textContent = originalText;
                element.style.background = "#10b981";
                element.style.color = "#000000";
            }, 1200);
        }
    }).catch(err => {
        console.error('Error al usar el portapapeles: ', err);
    });
}

// Ejecución automática al arrancar el script
initPaymentInstructions();

/* ==========================================================================
   8. RESOLUCIÓN DE TASA DE CAMBIO BCV Y CONECTIVIDAD SUPABASE
   ========================================================================== */
async function loadSystemSettings() {
    try {
        if (!supabaseClient) return;

        const { data, error } = await supabaseClient
            .from('system_settings')
            .select('*')
            .eq('key', 'last_valid_bcv')
            .single();

        if (error) throw error;

        if (data && data.value) {
            appState.bcvRate = parseFloat(data.value.rate);
            console.log(`Tasa BCV cargada desde system_settings: ${appState.bcvRate}`);
            updateCurrencyUI();
            if (typeof updateFormPricing === 'function') updateFormPricing();
        }
    } catch (err) {
        console.error("Error cargando la configuración inicial (BCV/Pagos):", err);
    }
}

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
            if (typeof updateFormPricing === 'function') updateFormPricing();
            return;
        }
    } catch (err) {
        console.warn('Capa 1 BCV falló, recurriendo a Capa 2 (Supabase):', err);
    }

    // CAPA 2: Base de Datos Supabase de respaldo
    if (supabaseClient !== null) {
        try {
            const { data } = await supabaseClient
                .from('system_settings')
                .select('value')
                .eq('key', 'last_valid_bcv')
                .single();

            if (data && data.value && data.value.rate) {
                appState.bcvRate = parseFloat(data.value.rate);
                appState.bcvSource = 'supabase';
                updateCurrencyUI();
                if (typeof updateFormPricing === 'function') updateFormPricing();
                return;
            }
        } catch (err) {
            console.warn('Capa 2 BCV falló, activando modo emergencia local:', err);
        }
    }

    // CAPA 3: Fallback local por defecto
    appState.bcvSource = 'default';
    updateCurrencyUI();
    if (typeof updateFormPricing === 'function') updateFormPricing();
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
    console.error('ALERTA: Sistema Naiguatá en Modo de Emergencia - Fallo de Conexión Total. Usando tasa base: ' + appState.bcvRate);
}

async function loadSupabaseData() {
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        const { data: invData } = await supabaseClient.from('inventory_stock').select('*');
        if (invData) appState.inventory = invData;

        const { data: servData } = await supabaseClient.from('logistic_services').select('*');
        if (servData) appState.logisticServices = servData;

        const { data: catData } = await supabaseClient.from('catering_inventory').select('*');
        if (catData) appState.cateringCatalog = catData;

        if (typeof updateFormPricing === 'function') updateFormPricing();
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

    // Captura estas variables ANTES de crear el objeto bookingData
    const dietValue = document.getElementById('hiker-diet')?.value || 'Estándar';
    const tentValue = document.getElementById('tent-preference')?.value || 'Compartida';
    // Asumiendo que estas funciones existen para obtener tus selecciones actuales
    const rentalsList = typeof getSelectedRentals === 'function' ? getSelectedRentals() : [];
    const cateringList = typeof getSelectedCatering === 'function' ? getSelectedCatering() : [];

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
        rentals: rentalsList,       // Ahora usa la variable dinámica
        catering: cateringList,     // Ahora usa la variable dinámica
        diet: dietValue,            // Ahora usa la variable dinámica
        tent_preference: tentValue  // Ahora usa la variable dinámica
    };

    // 1. Capturamos el valor del input específico según tu HTML
    const groupCodeInput = document.getElementById('booking-group')?.value.trim();

    // 2. Si está vacío, le asignamos 'INDIVIDUAL', sino usamos el valor del usuario en mayúsculas
    const finalGroupCode = (groupCodeInput && groupCodeInput.length > 0) ? groupCodeInput.toUpperCase() : 'INDIVIDUAL';

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const { data, error } = await supabaseClient.rpc('registrar_excursionista', {
                p_id: passId,
                p_date: dateVal,
                p_name: name,
                p_email: email,
                p_whatsapp: whatsapp,
                p_group_code: finalGroupCode, // <--- AQUÍ SE INYECTA LA VARIABLE DINÁMICA
                p_gender: gender,
                p_tent_preference: tentValue,
                p_allergies: allergies,
                p_diet: dietValue,
                p_medical: medical,
                p_rentals: rentalsList,
                p_catering: cateringList,
                p_porter_service: porterValue,
                p_total_usd: totalUsd,
                p_payment_method: paymentMethod,
                p_reference_number: referenceNumber
            });

            if (error) throw error;

            enviarEmailNotificacion(bookingData);
            if (typeof renderCheckoutSuccess === 'function') renderCheckoutSuccess(bookingData);
            localStorage.removeItem('naiguata_form_draft');
        } catch (err) {
            console.error('Error registrando en servidor, guardando copia local:', err);
            if (typeof addToOfflineQueue === 'function') addToOfflineQueue(bookingData);
            if (typeof showOfflineSuccess === 'function') showOfflineSuccess(bookingData);
            enviarEmailNotificacion(bookingData);
        }
    } else {
        if (typeof addToOfflineQueue === 'function') addToOfflineQueue(bookingData);
        if (typeof showOfflineSuccess === 'function') showOfflineSuccess(bookingData);
        enviarEmailNotificacion(bookingData);
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function enviarEmailNotificacion(booking) {
    if (typeof emailjs === 'undefined') {
        console.warn("EmailJS no está cargado en el index.html");
        return;
    }

    const templateParams = {
        admin_email: "diego.morono03@gmail.com",
        pass_id: booking.id,
        hiker_name: booking.name,
        hiker_email: booking.email,
        hiker_whatsapp: booking.whatsapp,
        expedition_date: booking.date,
        allergies_info: booking.allergies,
        medical_info: booking.medical,
        payment_method: booking.payment_method,
        reference_number: booking.reference_number,
        total_usd: `${booking.total_usd.toFixed(2)} USD`
    };

    emailjs.send('service_f8qzcms', 'template_5w8usjw', templateParams)
        .then(() => {
            console.log('✉️ Notificación enviada exitosamente por correo electrónico.');
        })
        .catch((error) => {
            console.error('Fallo crítico al despachar correo de notificación:', error);
        });
}

function renderCheckoutSuccess(booking) {
    const nameDisplay = document.getElementById('pass-hiker-name');
    const dateDisplay = document.getElementById('pass-date');
    const groupDisplay = document.getElementById('pass-group');
    const dietDisplay = document.getElementById('pass-diet');
    const tentDisplay = document.getElementById('pass-tent');
    const refDisplay = document.getElementById('pass-reference-display');
    const rentalsDisplay = document.getElementById('pass-rentals');
    const serialDisplay = document.getElementById('pass-serial-number');

    if (nameDisplay) nameDisplay.textContent = booking.name;
    if (dateDisplay) dateDisplay.textContent = booking.date;
    if (groupDisplay) groupDisplay.textContent = "Individual";
    if (dietDisplay) dietDisplay.textContent = booking.diet || "Estándar";
    if (tentDisplay) tentDisplay.textContent = booking.tent_preference || "Compartida";
    if (refDisplay) refDisplay.textContent = booking.reference_number;
    if (serialDisplay) serialDisplay.textContent = booking.id;

    // Mostrar sección de éxito y ocultar cliente
    if (document.getElementById('success-view')) document.getElementById('success-view').style.display = 'block';
    if (document.getElementById('client-view')) document.getElementById('client-view').style.display = 'none';
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
    // Usamos la API Web Crypto estándar del navegador
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convertimos a string hexadecimal
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
