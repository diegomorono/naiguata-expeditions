/* ==========================================================================
   1. CONFIGURACIÓN, CONSTANTES Y ESTADO GLOBAL
   ========================================================================== */

const SUPABASE_URL = 'https://cnoeumcshfrfrzyvbxcn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qF2ETcffYEwh0nz27uV1rQ_JSxp7mA6';

// Inicialización:
let supabaseClient = null;
let _initPromise = null;

function getSupabaseClient() {
    if (_initPromise) return _initPromise;

    _initPromise = new Promise((resolve, reject) => {
        const MAX_WAIT = 5000;
        const start = Date.now();

        const check = () => {
            if (window.supabase && typeof window.supabase.createClient === 'function') {
                supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log("Supabase inicializado correctamente.");
                return resolve(supabaseClient);
            }
            if (Date.now() - start > MAX_WAIT) {
                return reject(new Error('Supabase CDN no cargó a tiempo'));
            }
            setTimeout(check, 100);
        };
        check();
    });

    return _initPromise;
}

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

    // 2. Seguridad con Supabase y Resolución de Tasa BCV
    try {
        console.log("[Init] Asegurando conexión con Supabase antes de cargar datos...");
        await getSupabaseClient(); // Obliga al sistema a esperar que la base de datos esté lista

        console.log("[Init] Resolviendo tasas cambiarias de respaldo...");
        if (typeof resolveBcvRate === 'function') {
            await resolveBcvRate();
        }
        if (typeof loadSystemSettings === 'function') {
            loadSystemSettings();
        }
    } catch (e) {
        console.error("[Network Error] Falló la configuración de red inicial (BCV) o Supabase:", e);
    }

    // 3. Inicialización de listeners para la vista de éxito
    try {
        initSuccessViewEvents();
    } catch (e) {
        console.error("[UI Error] No se pudieron vincular los eventos de éxito:", e);
    }

    // 4. Procesos asíncronos secundarios y persistencia local
    try { if (typeof loadSupabaseData === 'function') await loadSupabaseData(); } catch (e) { }
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

    // El símbolo '??' arregla el bug: ahora sí reconoce el paso inicial (0)
    const idx = appState.activeStepIndex ?? 0;
    const step = routeSteps[idx];

    // Red de seguridad: si no existe el paso, avisa en la consola y no rompe la página
    if (!step) {
        console.error(`[Stepper] El paso con número ${idx} no existe en tu lista de rutas.`);
        return;
    }

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
        await getSupabaseClient();
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
    try {
        await getSupabaseClient();
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
    console.log("Iniciando procesamiento de formulario...");

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Confirmar Registro';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-small"></span> Procesando registro...`;
    }

    try {
        // 1. CAPTURA BÁSICA (Alineada a los IDs reales de tu index.html)
        const name = formatTitleCase(document.getElementById('hiker-name')?.value.trim() || '');
        const email = document.getElementById('hiker-email')?.value.trim().toLowerCase() || '';
        const whatsapp = document.getElementById('hiker-whatsapp')?.value.trim() || '';
        const gender = document.getElementById('hiker-gender')?.value || 'No especificado';
        const tentValue = document.getElementById('hiker-tent-preference')?.value || 'Carpa compartida';
        const medical = document.getElementById('hiker-medical')?.value.trim() || 'Ninguna.';
        const allergies = document.getElementById('hiker-allergies')?.value || 'Ninguna';
        const dateVal = document.getElementById('booking-date')?.value || '';

        // CORRECCIÓN: ID exacto del método de pago
        const paymentMethod = document.getElementById('payment-method-select')?.value || 'No especificado';
        const referenceNumber = document.getElementById('payment-reference')?.value.trim() || 'N/A';

        const totalElement = document.getElementById('form-total-usd');
        const totalUsd = totalElement ? parseFloat(totalElement.textContent.replace(/[^0-9.]/g, '')) : 50.00;
        const passId = 'NE-' + Math.floor(100000 + Math.random() * 900000);

        const dietValue = document.getElementById('dietary-preference')?.value || 'Estándar';
        const groupCodeInput = document.getElementById('booking-group')?.value.trim();
        const finalGroupCode = (groupCodeInput && groupCodeInput.length > 0) ? groupCodeInput.toUpperCase() : 'INDIVIDUAL';

        // 2. CORRECCIÓN CRÍTICA: LECTURA DE CANTIDADES NUMÉRICAS EN EQUIPOS
        const rentalsList = [];
        document.querySelectorAll('.equipment-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                // Busca el nombre del equipo en el HTML cercano
                const row = input.closest('.equipment-row');
                const itemName = row ? row.querySelector('.equipment-name').textContent.trim() : input.id;
                rentalsList.push(`${qty}x ${itemName}`);
            }
        });

        // 3. CORRECCIÓN CRÍTICA: LECTURA DE CANTIDADES NUMÉRICAS EN CATERING
        const cateringList = [];
        document.querySelectorAll('.catering-input').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                const row = input.closest('.catering-row');
                const itemName = row ? row.querySelector('.catering-name').textContent.trim() : input.id;
                cateringList.push(`${qty}x ${itemName}`);
            }
        });

        // 4. CORRECCIÓN CRÍTICA: LECTURA DEL BOTÓN ACTIVO DEL PORTADOR
        const activeCarrierBtn = document.querySelector('.carrier-btn.active');
        const porterValue = activeCarrierBtn ? activeCarrierBtn.getAttribute('data-name') : 'No requerido';

        // 5. CONSTRUCCIÓN DEL OBJETO UNIFICADO SÓLIDO (Nombres de columnas idénticas a Supabase)
        const bookingData = {
            id: passId,
            date: dateVal,
            name: name,
            email: email,
            whatsapp: whatsapp,
            group_code: finalGroupCode,
            gender: gender,
            tent_preference: tentValue,
            allergies: allergies,
            diet: dietValue,
            medical: medical,
            rentals: rentalsList,        // Nombre exacto de la columna en BD
            catering: cateringList,      // Nombre exacto de la columna en BD
            porter_service: porterValue,
            total_usd: totalUsd,
            payment_method: paymentMethod,
            reference_number: referenceNumber
        };

        console.log("Payload extraído del HTML:", bookingData);

        // 6. PERSISTENCIA EN SUPABASE
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const { error: insertError } = await supabaseClient
                    .from('bookings') // Asegúrate de que tu tabla se llame 'bookings' o 'registrations' según la hayas nombrado
                    .insert([bookingData]);

                if (insertError) {
                    console.warn("Inserción directa falló, intentando RPC...", insertError);
                    // Si tienes el RPC configurado, lo intenta como plan B
                    const { error: rpcError } = await supabaseClient.rpc('registrar_excursionista', {
                        p_id: passId,
                        p_date: dateVal,
                        p_name: name,
                        p_email: email,
                        p_whatsapp: whatsapp,
                        p_group_code: finalGroupCode,
                        p_gender: gender,
                        p_tent_preference: tentValue,
                        p_allergies: allergies,
                        p_diet: dietValue,
                        p_medical: medical,
                        p_rentals: JSON.stringify(rentalsList),
                        p_catering: JSON.stringify(cateringList),
                        p_porter_service: porterValue,
                        p_total_usd: totalUsd,
                        p_payment_method: paymentMethod,
                        p_reference_number: referenceNumber
                    });
                    if (rpcError) throw rpcError;
                }
            } catch (dbErr) {
                console.error("Error BD, guardando offline:", dbErr);
                if (typeof addToOfflineQueue === 'function') addToOfflineQueue(bookingData);
            }
        } else {
            if (typeof addToOfflineQueue === 'function') addToOfflineQueue(bookingData);
        }

        // 7. FLUJO DE ÉXITO VISUAL
        if (typeof enviarEmailNotificacion === 'function') enviarEmailNotificacion(bookingData);
        if (typeof renderCheckoutSuccess === 'function') renderCheckoutSuccess(bookingData);

        // Pasa los datos a los botones de impresión/WhatsApp
        initPassButtons(bookingData);

        showView('success-view');
        localStorage.removeItem('naiguata_form_draft');

    } catch (err) {
        console.error('Error crítico en el formulario:', err);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
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
        total_usd: `${booking.total_usd.toFixed(2)} USD`,

        // NUEVOS CAMPOS AGREGADOS:
        hiker_gender: booking.gender,
        hiker_tent_preference: booking.tent_preference,
        group_code: booking.group_code
    };

    emailjs.send('service_f8qzcms', 'template_r1l52td', templateParams)
        .then(() => {
            console.log('✉️ Notificación enviada exitosamente por correo electrónico.');
        })
        .catch((error) => {
            console.error('Fallo crítico al despachar correo de notificación:', error);
        });
}

// ==========================================================================
// SECCIÓN DE ACCIONES DEL CHECKOUT (IMPRESIÓN Y WHATSAPP)
// ==========================================================================

function ejecutarImpresionCheckout() {
    // ID corregido según tu HTML anterior: 'printable-pass-card'
    const checkoutElement = document.getElementById('printable-pass-card');

    if (!checkoutElement) {
        alert('Error: No se encontró la tarjeta de pase.');
        return;
    }

    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>Pase de Abordaje - Naiguatá Expeditions</title>
                <style>
                    body { font-family: 'Outfit', sans-serif; color: #000; background: #fff; padding: 20px; }
                    /* Forzamos que el pase se vea bien */
                    .pass-card { border: 2px solid #000; padding: 20px; max-width: 500px; margin: auto; border-radius: 0; }
                    .pass-label { font-size: 10px; color: #666; text-transform: uppercase; display: block; }
                    .pass-value { font-size: 14px; font-weight: 700; color: #000; }
                    .pass-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
                    .pass-brand-logo { font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 5px; }
                </style>
            </head>
            <body>
                ${checkoutElement.innerHTML}
            </body>
        </html>
    `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();

    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 500);
}

function ejecutarCompartirWhatsApp(bookingData) {
    // Si la función se llama desde el flujo de éxito con los datos frescos de la reserva, los usamos.
    // Si no, intentamos recuperarlos del estado o del borrador guardado.
    let booking = bookingData || {};

    if (!booking.name) {
        try {
            const draft = localStorage.getItem('naiguata_form_draft');
            if (draft) booking = JSON.parse(draft);
        } catch (e) {
            console.error("No se pudo leer la información de la reserva para WhatsApp:", e);
        }
    }

    // 1. Construir el cuerpo del mensaje usando la nueva función centralizada
    const mensajeTexto = buildWhatsAppMessage(booking);

    // 2. Despachar apertura única de la API de WhatsApp de forma segura
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeTexto)}`, '_blank');
}

/* ==========================================================================
   FUNCIÓN DE ÉXITO INTEGRADA A LA NAVEGACIÓN NATIVA
   ========================================================================== */
function renderCheckoutSuccess(booking) {
    console.log("DEBUG: Iniciando renderizado de pase con:", booking);

    const successView = document.getElementById('success-view');
    if (!successView) {
        console.error("DEBUG: No se encontró el elemento 'success-view'");
        return;
    }

    // 1. Manejo de visibilidad (Limpiar interfaz)
    const clientView = document.getElementById('client-view');
    if (clientView) {
        clientView.classList.add('active');
    }

    const siblings = successView.parentElement.children;
    for (let child of siblings) {
        if (child !== successView) {
            child.style.display = 'none';
        }
    }

    successView.style.display = 'block';
    successView.classList.add('active');
    successView.classList.remove('hidden');

    // 2. Matriz de inyección de datos
    const fields = [
        { id: 'pass-hiker-name', val: booking.name },
        { id: 'pass-date', val: booking.date },
        { id: 'pass-group', val: booking.group_code || "Individual" },
        { id: 'pass-diet', val: booking.diet || 'Estándar / Ninguna' },
        { id: 'pass-tent', val: booking.tent_preference || 'Por asignar' },
        { id: 'pass-reference-display', val: booking.reference_number || 'N/A' },
        { id: 'pass-serial-number', val: booking.id },
        // Nueva línea para el monto
        { id: 'pass-total-amount', val: `${booking.total_usd.toFixed(2)} USD` }
    ];

    fields.forEach(field => {
        const el = document.getElementById(field.id);
        if (el) {
            el.textContent = field.val;
        } else {
            console.warn(`DEBUG: No se encontró el elemento ${field.id}, omitiendo.`);
        }
    });

    // 3. Inicializar los botones (Imprimir, WhatsApp, Home)
    initPassButtons(booking);

    // 4. Scroll suave
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initPassButtons(booking) {
    const btnShare = document.getElementById('btn-share-adventure');
    if (btnShare) {
        btnShare.onclick = () => {
            // Reemplazo de la segunda duplicación masiva usando la utilidad centralizada
            const msg = buildWhatsAppMessage(booking);
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
        };
    }

    const btnSave = document.getElementById('btn-print-pass');
    if (btnSave) {
        btnSave.onclick = () => {
            const alquileres = booking.rentals && booking.rentals.length > 0 ? booking.rentals.join(', ') : 'Ninguno';
            const catering = booking.catering && booking.catering.length > 0 ? booking.catering.join(', ') : 'Ninguno';
            const portador = booking.porter_service && booking.porter_service !== 'No' ? `Sí (${booking.porter_service})` : 'No requerido';
            const totalUSD = typeof booking.total_usd === 'number' ? booking.total_usd.toFixed(2) : (booking.total_usd || '50.00');

            const ventanaImpresion = window.open('', '_blank', 'height=850,width=800');

            ventanaImpresion.document.write('<html><head><title>Ficha Completa de Abordaje - Naiguatá Expeditions</title>');
            ventanaImpresion.document.write('<style>');
            ventanaImpresion.document.write(`
                body { font-family: 'Inter', sans-serif; color: #111; padding: 40px; background: #fff; line-height: 1.5; }
                .print-wrapper { border: 2px solid #111; padding: 30px; border-radius: 0px; max-width: 650px; margin: 0 auto; }
                .header-table { width: 100%; border-bottom: 3px solid #111; padding-bottom: 10px; margin-bottom: 20px; }
                .brand-title { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                .pass-id { font-size: 18px; font-weight: 700; color: #059669; text-align: right; }
                .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; background: #f3f4f6; padding: 6px 10px; margin-top: 20px; margin-bottom: 12px; border-left: 4px solid #111; letter-spacing: 0.5px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 25px; padding: 0 10px; }
                .info-item { display: flex; flex-direction: column; }
                .label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; margin-bottom: 2px; }
                .value { font-size: 14px; color: #000; font-weight: 500; }
                .footer-banner { margin-top: 35px; border-top: 1px dashed #cdcdd2; padding-top: 15px; text-align: center; }
                .total-box { font-size: 18px; font-weight: 800; text-align: right; margin-top: 25px; padding-right: 10px; text-transform: uppercase; }
            `);
            ventanaImpresion.document.write('</style></head><body>');
            ventanaImpresion.document.write('<div class="print-wrapper">');

            ventanaImpresion.document.write(`
                <table class="header-table">
                    <tr>
                        <td class="brand-title">🏔️ Naiguatá Expeditions</td>
                        <td class="pass-id">PASE: ${booking.id || 'NE-PENDIENTE'}</td>
                    </tr>
                </table>

                <div class="section-title">1. Información del Senderista</div>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Nombre Completo</span><span class="value">${booking.name || 'No especificado'}</span></div>
                    <div class="info-item"><span class="label">Género / Sexo</span><span class="value">${booking.gender || 'No especificado'}</span></div>
                    <div class="info-item"><span class="label">WhatsApp</span><span class="value">${booking.whatsapp || 'No especificado'}</span></div>
                    <div class="info-item"><span class="label">Correo Electrónico</span><span class="value">${booking.email || 'No especificado'}</span></div>
                </div>

                <div class="section-title">2. Logística de la Ruta (Pico Naiguatá)</div>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Fecha de Expedición</span><span class="value">${booking.date || 'No especificada'}</span></div>
                    <div class="info-item"><span class="label">Código de Grupo</span><span class="value">${booking.group_code || 'INDIVIDUAL'}</span></div>
                    <div class="info-item"><span class="label">Preferencia de Carpa</span><span class="value">${booking.tent_preference || 'Compartida'}</span></div>
                    <div class="info-item"><span class="label">Preferencia Dietética</span><span class="value">${booking.diet || 'Estándar'}</span></div>
                </div>

                <div class="section-title">3. Servicios Adicionales Contratados</div>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Alquiler de Equipos</span><span class="value">${alquileres}</span></div>
                    <div class="info-item"><span class="label">Catering y Alimentación</span><span class="value">${catering}</span></div>
                    <div class="info-item" style="grid-column: span 2;"><span class="label">Servicio de Portador</span><span class="value">${portador}</span></div>
                </div>

                <div class="section-title">4. Ficha Médica y de Seguridad</div>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Alergias Declaradas</span><span class="value">${booking.allergies || 'Ninguna'}</span></div>
                    <div class="info-item"><span class="label">Condiciones Médicas / Observaciones</span><span class="value">${booking.medical || 'Ninguna.'}</span></div>
                </div>

                <div class="section-title">5. Transacción Financiera</div>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Método de Pago</span><span class="value">${booking.payment_method || 'No especificado'}</span></div>
                    <div class="info-item"><span class="label">Nro de Referencia Bancaria</span><span class="value">${booking.reference_number || 'N/A'}</span></div>
                </div>

                <div class="total-box">Total: ${totalUSD} USD</div>

                <div class="footer-banner">
                    <p style="font-size: 11px; color: #6b7280; margin: 0;">Este documento sirve como comprobante oficial de registro para la expedición al Pico Naiguatá.</p>
                    <p style="font-size: 10px; color: #9ca3af; margin-top: 5px; font-weight: bold;">Naiguatá Expeditions © 2026 · Caracas, Venezuela · Cumbre a 2.765 msnm.</p>
                </div>
            `);

            ventanaImpresion.document.write('</div></body></html>');
            ventanaImpresion.document.close();
            ventanaImpresion.focus();

            setTimeout(() => {
                ventanaImpresion.print();
                ventanaImpresion.close();
            }, 500);
        };
    }

    const btnHome = document.getElementById('btn-return-home');
    if (btnHome) {
        btnHome.onclick = () => location.reload();
    }
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

        const username = document.getElementById('admin-username')?.value;
        const password = document.getElementById('admin-password')?.value;

        try {
            // El cliente no hace ninguna operación de hashing. 
            // Envía la contraseña tal cual por HTTPS (canal seguro).
            const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) throw new Error('Credenciales inválidas');

            const { token } = await response.json();
            sessionStorage.setItem('admin_token', token);

            alert('Acceso autorizado.');
            // Aquí rediriges a tu dashboard

        } catch (error) {
            console.error('Error:', error);
            alert('Acceso denegado.');
        }
    });
}

/**
 * Función para abrir una ventana nueva, inyectar el pase limpio
 * y ejecutar la impresión nativa del navegador.
 */
function imprimirPase() {
    const checkoutElement = document.getElementById('printable-pass-card');

    if (!checkoutElement) {
        alert('No se pudo encontrar el pase para imprimir.');
        return;
    }

    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');

    ventanaImpresion.document.write(`
        <html>
            <head>
                <title>Pase de Abordaje - Naiguatá Expeditions</title>
                <style>
                    body { font-family: 'Outfit', sans-serif; color: #000; background: #fff; padding: 20px; }
                    .pass-card { border: 2px solid #000; padding: 20px; max-width: 500px; margin: auto; }
                    .pass-label { font-size: 10px; color: #666; text-transform: uppercase; display: block; }
                    .pass-value { font-size: 14px; font-weight: 700; color: #000; }
                    .pass-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
                    .pass-brand-logo { font-weight: 800; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                ${checkoutElement.innerHTML}
            </body>
        </html>
    `);

    ventanaImpresion.document.close();
    ventanaImpresion.focus();

    setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
    }, 500);
}

// Utilidades de formato y criptografía
function formatCurrency(val) {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// Función centralizada para construir el mensaje de WhatsApp (Optimización DRY)
function buildWhatsAppMessage(booking) {
    const fmt = (arr) => arr?.length ? arr.join(', ') : 'Ninguno';
    const totalUSD = typeof booking.total_usd === 'number'
        ? booking.total_usd.toFixed(2) : '0.00';

    return [
        `🏔️ *EXPEDICIONES NAIGUATÁ* 🥾`,
        ``,
        `👤 *SENDERISTA:*`,
        `• Nombre: ${booking.name}`,
        `• Género: ${booking.gender}`,
        `• WhatsApp: ${booking.whatsapp}`,
        `• Email: ${booking.email}`,
        ``,
        `⛺ *LOGÍSTICA:*`,
        `• Fecha: ${booking.date}`,
        `• Grupo: ${booking.group_code || 'Individual'}`,
        `• Carpa: ${booking.tent_preference}`,
        ``,
        `🎒 *SERVICIOS:*`,
        `• Equipos: ${fmt(booking.rentals)}`,
        `• Catering: ${fmt(booking.catering)}`,
        `• Portador: ${booking.porter_service || 'No requerido'}`,
        ``,
        `🏥 *SALUD:*`,
        `• Alergias: ${booking.allergies}`,
        `• Médico: ${booking.medical}`,
        ``,
        `💳 *PAGO:*`,
        `• Método: ${booking.payment_method}`,
        `• Ref: ${booking.reference_number || 'N/A'}`,
        `• Total: *$${totalUSD} USD*`,
        ``,
        `¡Nos vemos en la cumbre! 🧗‍♂️✨`,
    ].join('\n');
}

function saveFormDraft() {
    // Captura los valores actuales del formulario para guardarlos como borrador
    const draftData = {
        name: document.getElementById('hiker-name')?.value,
        email: document.getElementById('hiker-email')?.value,
        whatsapp: document.getElementById('hiker-whatsapp')?.value,
        medical: document.getElementById('hiker-medical')?.value,
        allergies: document.getElementById('hiker-allergies')?.value
    };

    try {
        localStorage.setItem('naiguata_form_draft', JSON.stringify(draftData));
    } catch (e) {
        console.warn("No se pudo guardar el borrador:", e);
    }
}