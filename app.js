/* ==========================================================================
   APP STATE & STATIC DATA
   ========================================================================== */

const appState = {
    activeView: 'client-view', // 'client-view', 'success-view', 'admin-view'
    bcvRate: 40.00, // Default fallback exchange rate (VES per USD)
    bcvSource: 'default', // 'api' or 'default' or 'manual'
    bookings: [],
    tentStock: {
        '2p': 4,
        '3p': 3
    },
    tentAllocations: [],
    activeStepIndex: 0
};

// Route Checkpoint Data
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

// Gear Checklist Definition
const gearItems = [
    { id: "sleeping-bag", name: "Saco de Dormir (Sleeping Bag)", weight: "1.2 kg", critical: true },
    { id: "sleeping-pad", name: "Aislante Térmico (Sleeping Pad)", weight: "0.4 kg", critical: true },
    { id: "warm-clothes", name: "Ropa de Abrigo Térmica (Suéter + Mono)", weight: "0.8 kg", critical: true },
    { id: "water-4l", name: "4 Litros de Agua (Mínimo)", weight: "4.0 kg", critical: true },
    { id: "headlamp", name: "Linterna Frontal / Mano con Pilas", weight: "0.2 kg", critical: true },
    { id: "eating-kit", name: "Plato hondo, Taza y Cuchara (Plástico/Metal)", weight: "0.3 kg", critical: false },
    { id: "hiking-boots", name: "Calzado de Montaña (Botas/Zapatos de Trail)", weight: "1.2 kg", critical: false },
    { id: "hygiene-kit", name: "Aseo Personal (Cepillo, Jabón biodegradable, Papel)", weight: "0.3 kg", critical: false }
];

// Mock Hiker Database for preloading
const mockBookings = [
    {
        id: "NG-847291",
        name: "Carlos Mendoza",
        email: "carlos.mendoza@gmail.com",
        whatsapp: "+584125556677",
        group: "CAMP-NAIGUATA",
        gender: "M",
        tentPreference: "couple",
        allergies: "none",
        diet: "standard",
        medical: "Ninguna condición especial.",
        rentals: ["sleeping-bag", "sleeping-pad"],
        totalUsd: 65.00,
        date: "2026-05-28"
    },
    {
        id: "NG-847292",
        name: "Sofía Rodríguez",
        email: "sofia.rod@gmail.com",
        whatsapp: "+584149998877",
        group: "CAMP-NAIGUATA",
        gender: "F",
        tentPreference: "couple",
        allergies: "none",
        diet: "standard",
        medical: "Ninguna.",
        rentals: ["sleeping-bag"],
        totalUsd: 60.00,
        date: "2026-05-28"
    },
    {
        id: "NG-294012",
        name: "Luis Alviarez",
        email: "luis.alv@hotmail.com",
        whatsapp: "+584241112233",
        group: "",
        gender: "M",
        tentPreference: "share",
        allergies: "nuts",
        diet: "vegan",
        medical: "Asma leve. Trae su propio inhalador (salbutamol).",
        rentals: ["trekking-poles"],
        totalUsd: 55.00,
        date: "2026-05-29"
    },
    {
        id: "NG-918234",
        name: "María Gómez",
        email: "maria.gomez@outlook.com",
        whatsapp: "+584124445566",
        group: "",
        gender: "F",
        tentPreference: "share",
        allergies: "none",
        diet: "standard",
        medical: "",
        rentals: [],
        totalUsd: 50.00,
        date: "2026-05-29"
    }
];

/* ==========================================================================
   INITIALIZATION & CORNERSTONE METHODS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    initAppNavigation();
    initElevationStepper();
    initGearChecklist();
    initBookingForm();
    initAdminPanel();
    fetchBcvExchangeRate();
});

// Seed or load LocalStorage database
function initDatabase() {
    const savedBookings = localStorage.getItem('naiguata_bookings');
    if (savedBookings) {
        appState.bookings = JSON.parse(savedBookings);
    } else {
        // Preload demo data so the app looks premium on first open
        appState.bookings = [...mockBookings];
        localStorage.setItem('naiguata_bookings', JSON.stringify(appState.bookings));
    }

    const savedTentStock = localStorage.getItem('naiguata_tent_stock');
    if (savedTentStock) {
        appState.tentStock = JSON.parse(savedTentStock);
    }
}

// Navigation between views
function initAppNavigation() {
    const btnToggleAdmin = document.getElementById('btn-toggle-admin');
    const navLogo = document.getElementById('nav-logo');
    const clientOnlyLinks = document.querySelectorAll('.client-only-link');

    btnToggleAdmin.addEventListener('click', () => {
        if (appState.activeView === 'admin-view') {
            switchView('client-view');
        } else {
            // Password protection for Guía Console (optional but adds a professional touch)
            const password = prompt("Ingrese contraseña de guía (Por defecto es 'admin'):", "admin");
            if (password === 'admin') {
                switchView('admin-view');
            } else if (password !== null) {
                alert("Contraseña incorrecta. Acceso denegado.");
            }
        }
    });

    navLogo.addEventListener('click', () => {
        switchView('client-view');
    });

    // Handle return home button on success screen
    document.getElementById('btn-return-home').addEventListener('click', () => {
        switchView('client-view');
        document.getElementById('expedition-form').reset();
        resetFormTotal();
    });
}

function switchView(viewId) {
    appState.activeView = viewId;
    
    // Toggle active classes
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    // Update nav state
    const btnToggleAdmin = document.getElementById('btn-toggle-admin');
    const clientLinks = document.querySelectorAll('.client-only-link');

    if (viewId === 'admin-view') {
        btnToggleAdmin.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Volver a Clientes</span>
        `;
        clientLinks.forEach(link => link.classList.add('hidden'));
        btnToggleAdmin.classList.add('btn-book');
        
        // Rerender administrative contents
        renderAdminStats();
        renderAdminRoster();
        renderAdminSnacks();
        runTentAllocation();
    } else {
        btnToggleAdmin.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Panel de Guía</span>
        `;
        clientLinks.forEach(link => link.classList.remove('hidden'));
        btnToggleAdmin.classList.remove('btn-book');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   EXCHANGE RATE (BCV) LOGIC
   ========================================================================== */

async function fetchBcvExchangeRate() {
    const bcvPriceDisplay = document.getElementById('bcv-price-display');
    const bcvRateInfo = document.getElementById('bcv-rate-info');
    const adminBcvRateInput = document.getElementById('admin-bcv-rate');

    try {
        // Fetch from public open API for Venezuelan exchange rates
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        
        if (!response.ok) throw new Error('API Response Error');
        
        const data = await response.json();
        const rate = parseFloat(data.promedio);
        
        if (rate && !isNaN(rate)) {
            appState.bcvRate = rate;
            appState.bcvSource = 'api';
            updateCurrencyUI();
            
            // Sync Admin input field
            adminBcvRateInput.value = rate.toFixed(2);
            document.getElementById('admin-bcv-status').textContent = `Tasa sincronizada vía API oficial a Bs. ${rate.toFixed(2)}`;
            document.getElementById('admin-bcv-status').className = "input-tip-success";
        }
    } catch (error) {
        console.warn('Error fetching BCV API, using offline fallback rate:', error);
        appState.bcvSource = 'default';
        updateCurrencyUI();
        
        adminBcvRateInput.value = appState.bcvRate.toFixed(2);
        document.getElementById('admin-bcv-status').textContent = `Fallo de conexión API. Usando tasa por defecto Bs. ${appState.bcvRate.toFixed(2)}`;
        document.getElementById('admin-bcv-status').className = "input-tip";
    }
}

function updateCurrencyUI() {
    const bcvPriceDisplay = document.getElementById('bcv-price-display');
    const bcvRateInfo = document.getElementById('bcv-rate-info');
    
    const priceBcv = 50.00 * appState.bcvRate;
    
    bcvPriceDisplay.innerHTML = `Bs. ${formatCurrency(priceBcv)} <span class="price-unit">al cambio BCV</span>`;
    
    const sourceText = appState.bcvSource === 'api' ? 'API Oficial' : (appState.bcvSource === 'manual' ? 'Manual (Guía)' : 'Predeterminada');
    bcvRateInfo.innerHTML = `Tasa Oficial BCV: <strong>1 USD = Bs. ${appState.bcvRate.toFixed(2)}</strong> (${sourceText})`;

    // Trigger update on form if user is looking at it
    updateFormPricing();
}

function formatCurrency(val) {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ==========================================================================
   INTERACTIVE ELEVATION STEPPER
   ========================================================================== */

function initElevationStepper() {
    const stepButtons = document.querySelectorAll('.step-nav-btn');
    const mapDots = document.querySelectorAll('.map-dot');

    function selectStep(index) {
        appState.activeStepIndex = index;
        
        // Remove active class
        stepButtons.forEach(btn => btn.classList.remove('active'));
        mapDots.forEach(dot => dot.classList.remove('active'));

        // Add active class
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

    // Set initial
    selectStep(0);
}

function renderActiveStepDetails() {
    const container = document.getElementById('active-step-details');
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
    
    // Load initial checklist items
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

    // Add change listeners
    const checkboxes = document.querySelectorAll('.gear-chk');
    checkboxes.forEach(chk => {
        chk.addEventListener('change', updateChecklistProgress);
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.gear-chk');
    const total = checkboxes.length;
    let checkedCount = 0;
    let missingCritical = false;

    checkboxes.forEach(chk => {
        if (chk.checked) {
            checkedCount++;
        } else {
            // Check if missing is critical
            if (chk.getAttribute('data-critical') === 'true') {
                missingCritical = true;
            }
        }
    });

    // Update progress elements
    const percentage = Math.round((checkedCount / total) * 100);
    document.getElementById('prep-percentage').textContent = `${percentage}%`;
    document.getElementById('prep-bar').style.width = `${percentage}%`;

    // Warn if missing critical survival elements
    const warningBanner = document.getElementById('checklist-warning');
    if (missingCritical && checkedCount > 0) {
        warningBanner.classList.remove('hidden');
        document.getElementById('warning-text').textContent = "⚠️ ¡Falta equipamiento crítico de supervivencia! Asegúrate de empacar agua, abrigo térmico y saco de dormir.";
    } else {
        warningBanner.classList.add('hidden');
    }
}

/* ==========================================================================
   CLIENT REGISTRATION & BOOKING FORM
   ========================================================================== */

function initBookingForm() {
    const form = document.getElementById('expedition-form');
    const rentalCheckboxes = document.querySelectorAll('.rental-checkbox');
    const printButton = document.getElementById('btn-print-pass');

    // Attach listeners to rental options to calculate price dynamically
    rentalCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateFormPricing();
        });
    });

    // Submit Booking
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const name = document.getElementById('hiker-name').value;
        const email = document.getElementById('hiker-email').value;
        const whatsapp = document.getElementById('hiker-whatsapp').value;
        const group = document.getElementById('booking-group').value.trim().toUpperCase();
        const gender = document.getElementById('hiker-gender').value;
        const tentPreference = document.getElementById('hiker-tent-preference').value;
        const allergies = document.getElementById('hiker-allergies').value;
        const diet = document.getElementById('hiker-diet').value;
        const medical = document.getElementById('hiker-medical').value.trim();

        // Rentals
        const rentals = [];
        rentalCheckboxes.forEach(chk => {
            if (chk.checked) {
                rentals.push(chk.getAttribute('data-item'));
            }
        });

        // Price calculations
        const totals = calculatePrice(rentals);

        // Generate serial
        const serial = `NG-${Math.floor(100000 + Math.random() * 900000)}`;

        // Create booking object
        const booking = {
            id: serial,
            name,
            email,
            whatsapp,
            group: group || '',
            gender,
            tentPreference,
            allergies,
            diet,
            medical: medical || 'Ninguna.',
            rentals,
            totalUsd: totals.usd,
            date: new Date().toISOString().split('T')[0]
        };

        // Save in state
        appState.bookings.push(booking);
        localStorage.setItem('naiguata_bookings', JSON.stringify(appState.bookings));

        // Populate and display pass
        renderExpeditionPass(booking);
        switchView('success-view');
    });

    // Print pass PDF listener
    printButton.addEventListener('click', () => {
        window.print();
    });
}

function calculatePrice(rentals) {
    let basePrice = 50.00;
    let rentalCost = 0.00;

    rentals.forEach(item => {
        if (item === 'sleeping-bag') rentalCost += 10.00;
        else if (item === 'sleeping-pad') rentalCost += 5.00;
        else if (item === 'trekking-poles') rentalCost += 5.00;
    });

    return {
        usd: basePrice + rentalCost,
        rentalsOnly: rentalCost
    };
}

function updateFormPricing() {
    const rentalCheckboxes = document.querySelectorAll('.rental-checkbox');
    const rentals = [];
    
    rentalCheckboxes.forEach(chk => {
        if (chk.checked) {
            rentals.push(chk.getAttribute('data-item'));
        }
    });

    const prices = calculatePrice(rentals);

    // Update display
    const rentalRow = document.getElementById('rental-summary-row');
    const rentalCostDisplay = document.getElementById('rental-cost-display');
    const totalUsdDisplay = document.getElementById('form-total-usd');
    const totalVesDisplay = document.getElementById('form-total-ves');

    if (prices.rentalsOnly > 0) {
        rentalRow.classList.remove('hidden');
        rentalCostDisplay.textContent = `+$${prices.rentalsOnly.toFixed(2)} USD`;
    } else {
        rentalRow.classList.add('hidden');
    }

    totalUsdDisplay.textContent = `$${prices.usd.toFixed(2)} USD`;
    totalVesDisplay.textContent = `Bs. ${formatCurrency(prices.usd * appState.bcvRate)}`;
}

function resetFormTotal() {
    document.getElementById('rental-summary-row').classList.add('hidden');
    document.getElementById('form-total-usd').textContent = "$50.00 USD";
    document.getElementById('form-total-ves').textContent = `Bs. ${formatCurrency(50.00 * appState.bcvRate)}`;
}

/* ==========================================================================
   RENDER SUCCESS PASS
   ========================================================================== */

function renderExpeditionPass(booking) {
    document.getElementById('pass-hiker-name').textContent = booking.name;
    document.getElementById('pass-date').textContent = booking.date;
    document.getElementById('pass-group').textContent = booking.group || 'NINGUNO';
    
    // Allergies display
    let allergyText = "Estándar / Ninguna";
    if (booking.allergies === 'nuts') allergyText = "Alergia Frutos Secos";
    else if (booking.allergies === 'gluten') allergyText = "Intolerancia Gluten";
    else if (booking.allergies === 'other') allergyText = "Alergia (Ver Detalles)";
    document.getElementById('pass-diet').textContent = `${booking.diet.toUpperCase()} / ${allergyText}`;
    
    // Tent
    document.getElementById('pass-tent').textContent = "Auto-asignada en campamento";
    
    // Rentals
    let rentalText = "Ninguno";
    if (booking.rentals.length > 0) {
        const names = booking.rentals.map(item => {
            if (item === 'sleeping-bag') return 'Sleeping Bag';
            if (item === 'sleeping-pad') return 'Aislante';
            if (item === 'trekking-poles') return 'Bastones';
            return item;
        });
        rentalText = names.join(', ');
    }
    document.getElementById('pass-rentals').textContent = rentalText;

    // Serial
    document.getElementById('pass-serial-number').textContent = booking.id;
}

/* ==========================================================================
   ADMIN LOGISTICS PANEL
   ========================================================================== */

function initAdminPanel() {
    // Admin tab toggle
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            
            // Remove active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active classes
            e.target.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Update BCV rate manually
    document.getElementById('btn-update-bcv').addEventListener('click', () => {
        const rateInput = document.getElementById('admin-bcv-rate');
        const newRate = parseFloat(rateInput.value);
        if (newRate && !isNaN(newRate) && newRate > 0) {
            appState.bcvRate = newRate;
            appState.bcvSource = 'manual';
            updateCurrencyUI();
            
            document.getElementById('admin-bcv-status').textContent = `Tasa actualizada manualmente a Bs. ${newRate.toFixed(2)}`;
            document.getElementById('admin-bcv-status').className = "input-tip-success";
            
            renderAdminStats();
            renderAdminRoster();
        } else {
            alert("Por favor ingrese una tasa válida.");
        }
    });

    // Tent allocation recalculate button
    document.getElementById('btn-allocate-tents').addEventListener('click', () => {
        const t2p = parseInt(document.getElementById('tent-stock-2p').value) || 0;
        const t3p = parseInt(document.getElementById('tent-stock-3p').value) || 0;
        
        appState.tentStock['2p'] = t2p;
        appState.tentStock['3p'] = t3p;
        localStorage.setItem('naiguata_tent_stock', JSON.stringify(appState.tentStock));

        runTentAllocation();
        alert("Carpas reasignadas con éxito en base al roster actual.");
    });

    // Mock Booking Generator (for easy testing/demoing)
    document.getElementById('btn-add-mock').addEventListener('click', () => {
        const firstNames = ["Andrés", "Gabriela", "Daniel", "Patricia", "Roberto", "Valentina", "Jesús", "Mónica"];
        const lastNames = ["Castillo", "Flores", "Blanco", "Sánchez", "Torres", "Herrera", "Díaz", "Rondón"];
        const allergiesOpt = ["none", "none", "none", "nuts", "none"];
        const dietOpt = ["standard", "standard", "vegan", "standard"];
        const groupCodes = ["", "CORREDORES", "CAMP-NAIGUATA", ""];
        const genders = ["M", "F"];

        const randFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randLast = lastNames[Math.floor(Math.random() * lastNames.length)];
        const randGender = genders[Math.floor(Math.random() * genders.length)];
        const randAllergy = allergiesOpt[Math.floor(Math.random() * allergiesOpt.length)];
        const randDiet = dietOpt[Math.floor(Math.random() * dietOpt.length)];
        const randGroup = groupCodes[Math.floor(Math.random() * groupCodes.length)];
        
        const name = `${randFirst} ${randLast}`;
        const email = `${randFirst.toLowerCase()}.${randLast.toLowerCase()}@example.com`;
        const whatsapp = `+58424${Math.floor(1000000 + Math.random() * 9000000)}`;

        const rentals = [];
        if (Math.random() > 0.6) rentals.push("sleeping-bag");
        if (Math.random() > 0.8) rentals.push("sleeping-pad");
        if (Math.random() > 0.7) rentals.push("trekking-poles");

        const prices = calculatePrice(rentals);
        const serial = `NG-${Math.floor(100000 + Math.random() * 900000)}`;

        const booking = {
            id: serial,
            name,
            email,
            whatsapp,
            group: randGroup,
            gender: randGender,
            tentPreference: randGroup ? "couple" : (Math.random() > 0.7 ? "couple" : "share"),
            allergies: randAllergy,
            diet: randDiet,
            medical: randAllergy === 'nuts' ? 'Alergia severa al maní.' : 'Ninguna.',
            rentals,
            totalUsd: prices.usd,
            date: new Date().toISOString().split('T')[0]
        };

        appState.bookings.push(booking);
        localStorage.setItem('naiguata_bookings', JSON.stringify(appState.bookings));

        renderAdminStats();
        renderAdminRoster();
        renderAdminSnacks();
        runTentAllocation();
    });

    // Clear Database button
    document.getElementById('btn-clear-db').addEventListener('click', () => {
        if (confirm("¿Está seguro de que desea eliminar TODAS las reservas? Esta acción no se puede deshacer.")) {
            appState.bookings = [];
            localStorage.setItem('naiguata_bookings', JSON.stringify([]));
            renderAdminStats();
            renderAdminRoster();
            renderAdminSnacks();
            runTentAllocation();
        }
    });

    // CSV Report Export
    document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);

    // JSON Database Export
    document.getElementById('btn-export-json').addEventListener('click', exportToJSON);

    // JSON Import trigger
    document.getElementById('import-json-file').addEventListener('change', importJSONDatabase);
}

function renderAdminStats() {
    const count = appState.bookings.length;
    document.getElementById('stat-hikers-count').textContent = count;

    // Count unique group codes (excluding empty)
    const groups = new Set(appState.bookings.map(b => b.group).filter(g => g !== ''));
    document.getElementById('stat-groups-count').textContent = groups.size;

    // Calculate revenue
    const revenue = appState.bookings.reduce((sum, b) => sum + b.totalUsd, 0);
    document.getElementById('stat-revenue').textContent = `$${revenue.toFixed(2)} USD`;
}

function renderAdminRoster() {
    const tbody = document.querySelector('#roster-table-body tbody');
    tbody.innerHTML = '';

    if (appState.bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 30px;">
                    No hay senderistas registrados para esta expedición.
                </td>
            </tr>
        `;
        return;
    }

    appState.bookings.forEach((booking) => {
        const tr = document.createElement('tr');
        
        // WhatsApp clean URL
        const cleanPhone = booking.whatsapp.replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanPhone}`;

        // Health badges
        let healthBadge = `<span class="health-flag health-flag-none">Limpio</span>`;
        if (booking.allergies === 'nuts') {
            healthBadge = `<span class="health-flag health-flag-danger">Alergia Maní</span>`;
        } else if (booking.allergies !== 'none' || booking.medical.toLowerCase().includes('asma') || booking.medical.toLowerCase().includes('inhalador')) {
            healthBadge = `<span class="health-flag health-flag-warn">Ver Ficha</span>`;
        }

        // Rentals mapping
        let rentalBadges = 'Ninguno';
        if (booking.rentals && booking.rentals.length > 0) {
            rentalBadges = booking.rentals.map(item => {
                if (item === 'sleeping-bag') return '🎒 Bolsa';
                if (item === 'sleeping-pad') return '🛌 Aislante';
                if (item === 'trekking-poles') return '🦯 Bastones';
                return item;
            }).join(' | ');
        }

        // Search tent assignment from state
        let tentText = 'Por asignar';
        if (appState.tentAllocations && appState.tentAllocations.length > 0) {
            const assignment = appState.tentAllocations.find(a => a.occupants.some(h => h.id === booking.id));
            if (assignment) {
                tentText = `Carpa #${assignment.id} (${assignment.type.toUpperCase()})`;
            }
        }

        tr.innerHTML = `
            <td>
                <strong>${booking.name}</strong><br>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${booking.email}</span>
            </td>
            <td>
                <a href="${waLink}" target="_blank" class="roster-whatsapp-link">${booking.whatsapp}</a>
            </td>
            <td>
                <span class="occupant-group-tag">${booking.group || '-'}</span>
            </td>
            <td>${booking.gender}</td>
            <td>${tentText}</td>
            <td title="${booking.medical}">${healthBadge}</td>
            <td>${rentalBadges}</td>
            <td>
                <button class="btn-danger btn-small" onclick="deleteBooking('${booking.id}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global scope helper for delete button inside dynamically rendered HTML table
window.deleteBooking = function(id) {
    if (confirm(`¿Seguro que desea eliminar el registro ${id}?`)) {
        appState.bookings = appState.bookings.filter(b => b.id !== id);
        localStorage.setItem('naiguata_bookings', JSON.stringify(appState.bookings));
        
        renderAdminStats();
        renderAdminRoster();
        renderAdminSnacks();
        runTentAllocation();
    }
};

/* ==========================================================================
   SNACK LIST LOGISTICS GENERATOR
   ========================================================================== */

function renderAdminSnacks() {
    const totalPeople = appState.bookings.length;

    // Direct Formula:
    // Bananas = 1 per hiker
    // Bars = 2 per hiker
    // Fruits & nuts = 50g per hiker
    const bananas = totalPeople;
    const bars = totalPeople * 2;
    const nutsGrams = totalPeople * 50;

    document.getElementById('snack-total-bananas').textContent = bananas;
    document.getElementById('snack-total-bars').textContent = bars;
    document.getElementById('snack-total-nuts').textContent = `${nutsGrams} g (${(nutsGrams / 1000).toFixed(2)} kg)`;

    // Check for Nut Allergies
    const allergyHikers = appState.bookings.filter(b => b.allergies === 'nuts');
    const alertsContainer = document.getElementById('snack-alerts-container');
    alertsContainer.innerHTML = '';

    if (allergyHikers.length > 0) {
        allergyHikers.forEach(hiker => {
            const div = document.createElement('div');
            div.className = "snack-alert";
            div.innerHTML = `
                <strong>⚠️ ALERTA DE ALERGIA CRÍTICA: Frutos Secos</strong>
                <span>El excursionista <strong>${hiker.name}</strong> (${hiker.whatsapp}) tiene una alergia declarada a los frutos secos.
                <br><em>Sustitución recomendada:</em> Reemplazar su mix de 50g por galletas de avena y frutas deshidratadas libres de trazas de maní/almendras. Proveer barras energéticas comerciales con sello libre de alérgenos.</span>
            `;
            alertsContainer.appendChild(div);
        });
    }

    // Dynamic grocery list
    const groceryList = document.getElementById('snack-shopping-list');
    groceryList.innerHTML = '';

    if (totalPeople === 0) {
        groceryList.innerHTML = `<li>No hay requerimientos de compra activos (0 senderistas).</li>`;
        return;
    }

    const standardNutsCount = totalPeople - allergyHikers.length;

    groceryList.innerHTML = `
        <li><strong>Bananas / Cambures:</strong> Comprar ${bananas} unidades (más 2 de respaldo para guías).</li>
        <li><strong>Barras Energéticas Caseras (50g):</strong> Elaborar ${bars} unidades (Receta estándar: avena, miel, coco rallado).</li>
        <li><strong>Mix Estándar de Frutos Secos (50g c/u):</strong> Comprar ${standardNutsCount * 50}g en total (Almendras, nueces, pasas, maní) para embolsar en ${standardNutsCount} porciones individuales de 50g.</li>
    `;

    if (allergyHikers.length > 0) {
        groceryList.innerHTML += `
            <li style="color: var(--secondary);"><strong>Kit Especial Libre de Alérgenos:</strong> Adquirir snacks alternativos para ${allergyHikers.length} persona(s) (ej. Galletas de soda, frutas deshidratadas certificadas nut-free).</li>
        `;
    }
}

/* ==========================================================================
   TENT ALLOCATOR ALGORITHM
   ========================================================================== */

function runTentAllocation() {
    const bookings = appState.bookings;
    const stock2p = appState.tentStock['2p'];
    const stock3p = appState.tentStock['3p'];

    // Generate pool of available tents
    const tentsPool = [];
    let tentIndex = 1;

    for (let i = 0; i < stock2p; i++) {
        tentsPool.push({ id: tentIndex++, type: '2p', capacity: 2, occupants: [] });
    }
    for (let i = 0; i < stock3p; i++) {
        tentsPool.push({ id: tentIndex++, type: '3p', capacity: 3, occupants: [] });
    }

    // Step 1: Group bookings first (people who input the same group code)
    const groupsMap = {};
    bookings.forEach(b => {
        if (b.group && b.group !== '') {
            if (!groupsMap[b.group]) {
                groupsMap[b.group] = [];
            }
            groupsMap[b.group].push(b);
        }
    });

    const unallocatedHikers = [...bookings];

    // Allocate grouped hikers
    Object.keys(groupsMap).forEach(groupName => {
        const groupMembers = groupsMap[groupName];
        
        // Allocate members of this group together
        let membersToAllocate = [...groupMembers];
        
        // 1. Try to find a tent that fits the whole group or split them
        while (membersToAllocate.length > 0) {
            // Find best empty tent for current chunk
            let chunkSize = membersToAllocate.length;
            let targetTent = null;

            if (chunkSize >= 3) {
                // Look for an empty 3p tent
                targetTent = tentsPool.find(t => t.type === '3p' && t.occupants.length === 0);
                if (targetTent) chunkSize = 3;
            }
            
            if (!targetTent && chunkSize >= 2) {
                // Look for empty 2p tent
                targetTent = tentsPool.find(t => t.type === '2p' && t.occupants.length === 0);
                if (targetTent) chunkSize = 2;
            }

            if (!targetTent) {
                // Just find any empty tent
                targetTent = tentsPool.find(t => t.occupants.length === 0);
                if (targetTent) {
                    chunkSize = Math.min(chunkSize, targetTent.capacity);
                }
            }

            if (!targetTent) {
                // Find any tent with space left (group splitting fallback)
                targetTent = tentsPool.find(t => t.occupants.length < t.capacity);
                if (targetTent) {
                    chunkSize = Math.min(chunkSize, targetTent.capacity - targetTent.occupants.length);
                }
            }

            if (targetTent) {
                // Allocate chunk
                const chunk = membersToAllocate.splice(0, chunkSize);
                chunk.forEach(hiker => {
                    targetTent.occupants.push(hiker);
                    // Remove from unallocated pool
                    const idx = unallocatedHikers.findIndex(u => u.id === hiker.id);
                    if (idx !== -1) unallocatedHikers.splice(idx, 1);
                });
            } else {
                // No tents left!
                break;
            }
        }
    });

    // Step 2: Allocate solo hikers, grouped by gender to respect privacy
    const soloMales = unallocatedHikers.filter(h => h.gender === 'M');
    const soloFemales = unallocatedHikers.filter(h => h.gender === 'F');

    allocateSoloGender(soloMales, 'M', tentsPool);
    allocateSoloGender(soloFemales, 'F', tentsPool);

    // Save allocations in state
    appState.tentAllocations = tentsPool;
    
    // Update stats count
    const statsTentsInUse = tentsPool.filter(t => t.occupants.length > 0).length;
    const totalTentsElement = document.getElementById('stat-tents-in-use');
    if (totalTentsElement) totalTentsElement.textContent = statsTentsInUse;

    // Render in dashboard
    renderTentsLayout(tentsPool);
    
    // Rerender roster to display new assignments in table
    renderAdminRoster();
}

function allocateSoloGender(soloHikers, gender, tentsPool) {
    let hikersToAssign = [...soloHikers];

    while (hikersToAssign.length > 0) {
        // 1. Try to find a tent that already has occupants of the same gender and has space
        let targetTent = tentsPool.find(t => 
            t.occupants.length > 0 && 
            t.occupants.length < t.capacity && 
            t.occupants.every(occ => occ.gender === gender)
        );

        // 2. If no partially filled same-gender tent, find an empty tent
        if (!targetTent) {
            targetTent = tentsPool.find(t => t.occupants.length === 0);
        }

        if (targetTent) {
            const hiker = hikersToAssign.shift();
            targetTent.occupants.push(hiker);
        } else {
            // Out of tents completely!
            break;
        }
    }
}

function renderTentsLayout(tents) {
    const grid = document.getElementById('tents-allocation-grid');
    grid.innerHTML = '';

    tents.forEach(tent => {
        const card = document.createElement('div');
        
        // Define occupancy classes
        let occupancyClass = 'tent-empty';
        let badgeColorClass = 'badge-secondary';
        let badgeText = 'Vacía';

        if (tent.occupants.length > 0) {
            if (tent.occupants.length === tent.capacity) {
                occupancyClass = 'tent-full';
                badgeColorClass = 'badge-green';
                badgeText = 'Completa';
            } else {
                occupancyClass = 'tent-partial';
                badgeColorClass = 'badge-orange';
                badgeText = `${tent.occupants.length}/${tent.capacity}`;
            }
        }

        card.className = `tent-allocation-card glass-panel ${occupancyClass}`;
        
        let occupantsLi = '';
        if (tent.occupants.length > 0) {
            tent.occupants.forEach(occ => {
                const groupTag = occ.group ? `<span class="occupant-group-tag">${occ.group}</span>` : '';
                const genderIcon = occ.gender === 'M' ? '👨' : '👩';
                occupantsLi += `
                    <li class="tent-occupant">
                        <span>${genderIcon} ${occ.name}</span>
                        ${groupTag}
                    </li>
                `;
            });
        } else {
            occupantsLi = `<li class="tent-occupant" style="color: var(--text-muted); justify-content: center;">Sin excursionistas</li>`;
        }

        // Render card markup
        card.innerHTML = `
            <div class="tent-card-header">
                <span class="tent-card-title">🏕️ Carpa #${tent.id}</span>
                <span class="tent-card-badge badge ${badgeColorClass}">${badgeText}</span>
            </div>
            <ul class="tent-occupants-list">
                ${occupantsLi}
            </ul>
            <div class="tent-card-footer">
                Capacidad: ${tent.type === '2p' ? '2 Personas' : '3 Personas'}
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ==========================================================================
   DATA BACKUP & EXPORT/IMPORT UTILITIES
   ========================================================================== */

function exportToCSV() {
    if (appState.bookings.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Headers
    csvContent += "ID,Nombre,Email,WhatsApp,Grupo,Genero,Alojamiento,Alergias,Dieta,Condicion Medica,Costo USD,Fecha Registro\n";

    appState.bookings.forEach(b => {
        const row = [
            b.id,
            `"${b.name}"`,
            b.email,
            b.whatsapp,
            `"${b.group || ''}"`,
            b.gender,
            b.tentPreference,
            b.allergies,
            b.diet,
            `"${b.medical || ''}"`,
            b.totalUsd,
            b.date
        ].join(",");
        csvContent += row + "\n";
    });

    // Create download element
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Expedicion_Naiguata_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJSON() {
    if (appState.bookings.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState.bookings, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Expedicion_Naiguata_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importJSONDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (Array.isArray(importedData)) {
                // Basic validation on imports
                const isValid = importedData.every(b => b.id && b.name && b.whatsapp && b.gender);
                
                if (isValid) {
                    appState.bookings = importedData;
                    localStorage.setItem('naiguata_bookings', JSON.stringify(appState.bookings));
                    
                    renderAdminStats();
                    renderAdminRoster();
                    renderAdminSnacks();
                    runTentAllocation();
                    
                    alert(`Base de datos restaurada con éxito. Se importaron ${importedData.length} registros.`);
                } else {
                    alert("El archivo JSON no tiene el formato de reserva válido.");
                }
            } else {
                alert("El archivo importado no contiene un Roster válido.");
            }
        } catch (err) {
            console.error("Error parsing JSON backup:", err);
            alert("Error al leer el archivo. Asegúrese de que sea un JSON válido.");
        }
    };
    reader.readAsText(file);
    // Reset file input value
    event.target.value = '';
}
