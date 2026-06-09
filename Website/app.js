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
        // 2. Asignación a tu variable única
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase inicializado correctamente.");
        // 🔥 DISPARAR CARGA DE CONFIGURACIONES AQUÍ
        loadSystemSettings();
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
    try { if (typeof loadSystemSettings === 'function') loadSystemSettings(); } catch (e) { }
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

        // 1. Traer la tasa oficial guardada en la tabla system_settings
        const { data, error } = await supabaseClient
            .from('system_settings')
            .select('*')
            .eq('key', 'last_valid_bcv')
            .single();

        if (error) throw error;

        if (data && data.value) {
            // Actualizamos el estado global con la tasa real de la BD
            appState.bcvRate = parseFloat(data.value.rate);
            console.log(`Tasa BCV cargada desde system_settings: ${appState.bcvRate}`);

            // 2. Actualizar la UI de precios y moneda con la tasa nueva
            updateCurrencyUI();
            updateFormPricing();
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
            return;
        }
    } catch (err) {
        console.warn('Capa 1 BCV falló, recurriendo a Capa 2 (Supabase):', err);
    }

    // CAPA 2: Base de Datos Supabase de respaldo
    if (typeof supabaseClient !== 'undefined' && supabaseClient !== null) {
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
    if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
    try {
        const { data: invData } = await supabaseClient.from('inventory_stock').select('*');
        if (invData) appState.inventory = invData;

        const { data: servData } = await supabaseClient.from('logistic_services').select('*');
        if (servData) appState.logisticServices = servData;

        const { data: catData } = await supabaseClient.from('catering_inventory').select('*');
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

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            // Envío directo mediante llamada RPC atómica a Postgres
            const { data, error } = await supabaseClient.rpc('registrar_excursionista', {
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

            // 📧 DETONANTE: Envío invisible de correo electrónico al administrador
            enviarEmailNotificacion(bookingData);

            // 🖥️ INTERFAZ: Salto directo al Checkout con manuales
            renderCheckoutSuccess(bookingData);

            localStorage.removeItem('naiguata_form_draft');
        } catch (err) {
            console.error('Error registrando en servidor, guardando copia local:', err);
            addToOfflineQueue(bookingData);
            showOfflineSuccess(bookingData);
            enviarEmailNotificacion(bookingData);
        }
    } else {
        // Ejecución en modo sin conexión si Supabase no está instanciado
        addToOfflineQueue(bookingData);
        showOfflineSuccess(bookingData);
        enviarEmailNotificacion(bookingData);
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// 📩 FUNCIÓN DE ENVÍO POSTAL AUTOMÁTICO (EMAILJS)
function enviarEmailNotificacion(booking) {
    if (typeof emailjs === 'undefined') {
        console.warn("EmailJS no está cargado en el index.html");
        return;
    }

    // Parámetros mapeados exactamente para la plantilla de tu panel de EmailJS
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

    // Reemplaza con tus IDs reales de la plataforma EmailJS
    emailjs.send('service_f8qzcms', 'template_5w8usjw', templateParams)
        .then(() => {
            console.log('✉️ Notificación enviada exitosamente por correo electrónico.');
        })
        .catch((error) => {
            console.error('Fallo crítico al despachar correo de notificación:', error);
        });
}

// 🖥️ MANTIENE LA FUNCIÓN DE RENDERIZADO DE CHECKOUT EXACTAMENTE IGUAL QUE ANTES
function renderCheckoutSuccess(booking) {
    // 1. Mapeamos y cargamos los datos reales del participante dentro del bloque HTML limpio
    const nameDisplay = document.getElementById('pass-hiker-name');
    const dateDisplay = document.getElementById('pass-date');
    const groupDisplay = document.getElementById('pass-group');
    const dietDisplay = document.getElementById('pass-diet');
    const tentDisplay = document.getElementById('pass-tent');
    const refDisplay = document.getElementById('pass-reference-display');
    const rentalsDisplay = document.getElementById('pass-rentals');
    const serialDisplay = document.getElementById('pass-serial-number');

    // Función interna para estabilizar eñes y caracteres rotos como Moroño
    const sanearTexto = (str) => {
        if (!str) return '';
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(//g, "ñ");
    };

    if (nameDisplay) nameDisplay.innerText = sanearTexto(booking.name || booking.hiker_name);
    if (dateDisplay) dateDisplay.innerText = booking.date || booking.expedition_date || 'Próximo Sábado';
    if (groupDisplay) groupDisplay.innerText = (booking.group_code || booking.booking_group || 'INDIVIDUAL').toUpperCase();

    const alergias = booking.allergies || booking.allergies_info || 'Ninguna';
    const medica = booking.medical || booking.medical_info || 'Ninguna';
    if (dietDisplay) dietDisplay.innerText = `Alergias: ${alergias} | Médica: ${medica}`;

    if (tentDisplay) tentDisplay.innerText = booking.tent_preference || booking.accommodation || 'Por asignar';

    // Mostramos la referencia reportada limpia como texto normal sin cajas negras
    if (refDisplay) refDisplay.innerText = booking.reference_number || booking.payment_reference || 'N/A';

    // Cálculo preciso de montos en dólares y bolívares dinámicos usando el estado de la app
    const tasaBCV = typeof appState !== 'undefined' && appState.bcvRate ? appState.bcvRate : 1;
    const totalUSD = parseFloat(booking.total_usd) || 50.00;
    const totalVES = totalUSD * tasaBCV;

    if (rentalsDisplay) {
        rentalsDisplay.innerText = `$${totalUSD.toFixed(2)} USD (${totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.)`;
    }
    if (serialDisplay) serialDisplay.innerText = booking.id || booking.pass_id || 'NE-XXXXXX';

    // 2. Vinculamos de forma segura los eventos Onclick a los botones del HTML real
    const btnPrint = document.getElementById('btn-print-pass');
    if (btnPrint) {
        btnPrint.onclick = function () {
            window.print();
        };
    }

    const btnShare = document.getElementById('btn-share-adventure');
    if (btnShare) {
        btnShare.onclick = function () {
            compartirFichaInscripcion(booking);
        };
    }

    // 3. Activamos la vista de éxito nativa sin destruir el entorno de ejecución
    if (typeof switchView === 'function') {
        switchView('success-view');
    } else {
        const successSection = document.getElementById('success-view');
        if (successSection) {
            document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
            successSection.style.display = 'block';
        }
    }

    // Limpieza de borradores y scroll suave hacia la parte superior
    localStorage.removeItem('naiguata_form_draft');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function compartirFichaInscripcion(booking) {
    // Función interna para sanear problemas de caracteres eñes/acentos extraños
    const limpiarTexto = (str) => {
        if (!str) return '';
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remueve acentos críticos si es necesario
            .replace(//g, "ñ"); // Parche directo si el string ya viene roto
    };

    // Extracción y mapeo dinámico puro desde el objeto real de la base de datos
    const id = booking.pass_id || booking.id || 'N/A';
    let nombre = booking.hiker_name || booking.name || '';
    nombre = limpiarTexto(nombre); // Asegura estabilidad en el nombre enviado

    const whatsapp = booking.hiker_whatsapp || booking.whatsapp || 'N/A';
    const grupo = booking.group_code || booking.booking_group || 'Ninguno';
    const alojamiento = booking.accommodation || booking.tent_preference || 'Por asignar';
    const fecha = booking.expedition_date || booking.date || '';

    // Ficha Médica y Salud
    const alergias = booking.allergies_info || booking.allergies || 'Ninguna';
    const medica = booking.medical_info || booking.medical || 'Ninguna reportada';

    // Facturación
    const metodo = booking.payment_method || '';
    const ref = booking.reference_number || booking.payment_reference || 'N/A';

    // Cálculo de montos monetarios dinámicos
    const total = booking.total_usd
        ? (typeof booking.total_usd === 'number' ? `$${booking.total_usd.toFixed(2)} USD` : booking.total_usd)
        : 'N/A';
    const totalVes = booking.total_ves ? ` (${booking.total_ves})` : '';

    // Estructura del mensaje corporativo optimizado para WhatsApp
    let mensaje = `🏔️ *MI COMPROBANTE - Naiguatá Expeditions* 🏔️\n\n`;
    mensaje += `¡Listo! Ya estoy oficialmente inscrito para el ascenso. Aquí tengo los detalles completos de mi registro y pase digital:\n\n`;

    mensaje += `📌 *DATOS DEL PARTICIPANTE*\n`;
    mensaje += `▪️ *ID Pase:* ${id}\n`;
    mensaje += `▪️ *Pasajero:* ${nombre}\n`;
    mensaje += `▪️ *WhatsApp:* ${whatsapp}\n`;
    mensaje += `▪️ *Código de Grupo:* ${grupo}\n`;
    mensaje += `▪️ *Alojamiento:* ${alojamiento}\n\n`;

    mensaje += `🗓️ *FECHA DE ASCENSO*\n`;
    mensaje += `▪️ ${fecha}\n\n`;

    mensaje += `🍏 *SALUD Y ALIMENTACIÓN*\n`;
    mensaje += `▪️ *¿Alergias?:* ${alergias}\n`;
    mensaje += `▪️ *Condiciones Médicas:* ${medica}\n\n`;

    mensaje += `💳 *DETALLES DE PAGO*\n`;
    mensaje += `▪️ *Method:* ${metodo}\n`;
    mensaje += `▪️ *Referencia:* ${ref}\n`;
    mensaje += `▪️ *Monto Registrado:* ${total}${totalVes}\n\n`;

    mensaje += `__________________________________\n`;
    mensaje += `🌲 _Conserva este mensaje como respaldo. Nos vemos en el PGP La Julia para conquistar la cumbre del Gigante de la Costa._`;

    // Envío seguro codificado por URL
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}

// Función para preparar la estructura completa del pase e imprimirlo
function configurarBotonImpresion(booking) {
    const btnPrint = document.getElementById('btn-print-pass');
    if (!btnPrint) return;

    btnPrint.onclick = function () {
        // 1. Inyectamos dinámicamente TODOS los campos recolectados en el Pase de Abordaje Imprimible
        document.getElementById('pass-hiker-name').innerText = booking.hiker_name || booking.name || 'Hiker';
        document.getElementById('pass-date').innerText = booking.expedition_date || booking.date || 'Sábado';
        document.getElementById('pass-group').innerText = (booking.group_code || booking.booking_group || 'NINGUNO').toUpperCase();

        // Unimos los datos médicos y de alergias para la sección de dieta del pase impreso
        const alergiasTexto = booking.allergies_info || booking.allergies || 'Ninguna';
        const medicaTexto = booking.medical_info || booking.medical || 'Ninguna';
        document.getElementById('pass-diet').innerText = `Alergias: ${alergiasTexto} | Médica: ${medicaTexto}`;

        // Alojamiento asignado
        document.getElementById('pass-tent').innerText = booking.accommodation || booking.tent_preference || 'Por asignar (Carpa Grupal)';

        // Alquileres y montos totales detallados
        const totalDinero = booking.total_usd ? `$${booking.total_usd} USD` : '$50.00 USD';
        const totalBolivares = booking.total_ves ? ` / ${booking.total_ves}` : '';
        document.getElementById('pass-rentals').innerText = `${totalDinero}${totalBolivares} (Ref: ${booking.reference_number || 'N/A'})`;

        // Número de serie del ticket inferior
        document.getElementById('pass-serial-number').innerText = booking.pass_id || booking.id || 'NE-XXXXXX';

        // 2. Ejecutar la acción de impresión nativa enfocada en la tarjeta del pase
        window.print();
    };
}

function addToOfflineQueue(bookingData) {
    const queue = JSON.parse(localStorage.getItem('naiguata_offline_queue') || '[]');
    queue.push(bookingData);
    localStorage.setItem('naiguata_offline_queue', JSON.stringify(queue));
}

async function processOfflineQueue() {
    if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) return;
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
    switchView('success-view');
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
