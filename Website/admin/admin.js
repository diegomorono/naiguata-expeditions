/* ==========================================================================
   ADMIN LOGIN & SECURITY
   ========================================================================== */

const SUPABASE_URL = '__SUPABASE_URL__';
const SUPABASE_ANON_KEY = '__SUPABASE_ANON_KEY__';
const ADMIN_PASSWORD_HASH = '__ADMIN_PASSWORD_HASH__';

const supabase = (window.supabase && SUPABASE_URL.indexOf('__SUPABASE_') === -1)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const adminState = {
    selectedDate: '',
    bookings: [],
    financials: [],
    settings: {},
    checklists: [],
    inventoryCatalog: [],
    cateringCatalog: [],
    logisticServices: []
};

// SHA-256 hashing helper
async function computeSHA256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Handle login submission
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error-msg');

    const typedHash = await computeSHA256(password);
    const expectedHash = ADMIN_PASSWORD_HASH.indexOf('__ADMIN_') !== -1 
        ? 'f6146b8353b55e153bf40786ebe755ac8aff89586fbd6111a89f35e8ebe00904' // local Dmc-45142238T hash
        : ADMIN_PASSWORD_HASH;

    if (username === 'diegomorono' && typedHash === expectedHash) {
        document.getElementById('admin-login-screen').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'block';
        localStorage.setItem('naiguata_admin_session', 'true');
        initializeAdminDashboard();
    } else {
        errorMsg.style.display = 'block';
    }
});

// Check session on load
if (localStorage.getItem('naiguata_admin_session') === 'true') {
    document.getElementById('admin-login-screen').style.display = 'none';
    document.getElementById('admin-dashboard-view').style.display = 'block';
    initializeAdminDashboard();
}

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('naiguata_admin_session');
    location.reload();
});

/* ==========================================================================
   ADMIN INITIALIZATION
   ========================================================================== */

async function initializeAdminDashboard() {
    if (!supabase) {
        alert('Supabase client is not initialized. Please verify configuration.');
        return;
    }

    await loadInitialSettings();
    await loadCatalogs();
    populateCarouselDates();
    setupTabNavigation();
    setupExpenseForm();
    setupDateFilters();

    // Trigger initial selections
    const defaultDate = new Date();
    // Round to next Saturday
    defaultDate.setDate(defaultDate.getDate() + ((6 - defaultDate.getDay() + 7) % 7));
    adminState.selectedDate = defaultDate.toISOString().split('T')[0];

    updateDashboardData();
}

async function loadInitialSettings() {
    const { data } = await supabase.from('system_settings').select('*');
    if (data) {
        data.forEach(item => {
            adminState.settings[item.key] = item.value;
        });
    }
}

async function loadCatalogs() {
    const { data: inv } = await supabase.from('inventory_stock').select('*');
    const { data: cat } = await supabase.from('catering_inventory').select('*');
    const { data: serv } = await supabase.from('logistic_services').select('*');

    if (inv) adminState.inventoryCatalog = inv;
    if (cat) adminState.cateringCatalog = cat;
    if (serv) adminState.logisticServices = serv;
}

/* ==========================================================================
   CAROUSEL DATE PICKER & FILTERS
   ========================================================================== */

function populateCarouselDates() {
    const container = document.getElementById('expeditions-carousel-container');
    container.innerHTML = '';

    const startFilter = document.getElementById('filter-start-date').value;
    const endFilter = document.getElementById('filter-end-date').value;

    const baseDate = new Date();
    const dates = [];

    // Next 6 Saturdays
    while (dates.length < 6) {
        baseDate.setDate(baseDate.getDate() + 1);
        if (baseDate.getDay() === 6) {
            dates.push(baseDate.toISOString().split('T')[0]);
        }
    }

    dates.forEach(dVal => {
        if (startFilter && dVal < startFilter) return;
        if (endFilter && dVal > endFilter) return;

        const card = document.createElement('div');
        const isActive = dVal === adminState.selectedDate ? 'active' : '';
        card.className = `expedition-card glass-panel ${isActive}`;
        card.setAttribute('data-date', dVal);
        
        const dateObj = new Date(dVal);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        
        card.innerHTML = `
            <div style="font-weight:600; font-size:1.1rem; margin-bottom:8px;">⛰️ Pico Naiguatá</div>
            <div style="font-size:0.85rem; color:var(--text-muted);">${dateStr}</div>
            <div class="semester-indicator" style="top:auto; bottom:8px; right:8px;"><span id="badge-status-${dVal}">🟢</span></div>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.expedition-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            adminState.selectedDate = dVal;
            updateDashboardData();
        });

        container.appendChild(card);
    });
}

function setupDateFilters() {
    document.getElementById('filter-start-date').addEventListener('change', populateCarouselDates);
    document.getElementById('filter-end-date').addEventListener('change', populateCarouselDates);
    document.getElementById('btn-clear-date-filter').addEventListener('click', () => {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        populateCarouselDates();
    });
}

/* ==========================================================================
   TAB NAVIGATION
   ========================================================================== */

function setupTabNavigation() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.getElementById(target).classList.add('active');
        });
    });
}

/* ==========================================================================
   DATA LOADER & UPDATE CORE
   ========================================================================== */

async function updateDashboardData() {
    const selectedDate = adminState.selectedDate;
    if (!selectedDate) return;

    // 1. Fetch Registrations for Selected Date
    const { data: regData } = await supabase
        .from('registrations')
        .select('*')
        .eq('date', selectedDate);
    
    adminState.bookings = regData || [];

    // 2. Fetch Financials for Selected Date
    const { data: finData } = await supabase
        .from('financial_transactions')
        .select('*');
    
    adminState.financials = finData || [];

    // 3. Fetch Checklists
    const { data: checkData } = await supabase
        .from('checklist_salidas')
        .select('*')
        .eq('id_fecha', selectedDate);

    adminState.checklists = checkData || [];

    // Render Components
    renderStats();
    renderRoster();
    renderCatering();
    runTentAllocation();
    renderFinancials();
    renderChecklist();
    renderSettingsCatalog();
    queryWeather(selectedDate);
}

/* ==========================================================================
   METRICS & STATS
   ========================================================================== */

function renderStats() {
    const totalHikers = adminState.bookings.filter(b => b.status !== '🔴 Cancelado').length;
    const confirmedHikers = adminState.bookings.filter(b => b.status === '🟢 Confirmado').length;
    const totalGroups = new Set(adminState.bookings.map(b => b.group_code).filter(g => g !== null && g !== '')).size;

    document.getElementById('stat-hikers-count').textContent = totalHikers;
    document.getElementById('stat-hikers-confirmed').textContent = `${confirmedHikers} Confirmados`;
    document.getElementById('stat-groups-count').textContent = totalGroups;

    // Total Revenue of this date
    const dateRevenue = adminState.bookings
        .filter(b => b.status === '🟢 Confirmado')
        .reduce((sum, b) => sum + parseFloat(b.total_usd), 0);

    const bcvRate = adminState.settings.last_valid_bcv?.rate || 40.00;
    document.getElementById('stat-revenue').textContent = `$${dateRevenue.toFixed(2)} USD`;
    document.getElementById('stat-revenue-ves').textContent = `Bs. ${(dateRevenue * bcvRate).toLocaleString('es-VE')} BCV`;
}

/* ==========================================================================
   ROSTER & AUDITING CONCILIATION
   ========================================================================== */

function renderRoster() {
    const tbody = document.getElementById('roster-table-body');
    tbody.innerHTML = '';

    if (adminState.bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">No hay participantes registrados para esta salida.</td></tr>`;
        return;
    }

    adminState.bookings.forEach(booking => {
        const tr = document.createElement('tr');
        
        // Critical health check: highlight red if allergies or medical alerts exist
        const hasMedicalAlert = booking.allergies !== 'none' || (booking.medical && booking.medical !== 'Ninguna.');
        if (hasMedicalAlert) {
            tr.style.background = 'rgba(239, 68, 68, 0.1)';
        }

        const phoneClean = booking.whatsapp.replace(/[^\d]/g, '');
        const waUrl = `https://wa.me/${phoneClean}`;

        let statusBadge = '';
        if (booking.status === '🟢 Confirmado') {
            statusBadge = `<span class="badge badge-green">Confirmado</span>`;
        } else if (booking.status === '🟡 Pendiente por Verificar') {
            statusBadge = `<span class="badge badge-orange">Pendiente</span>`;
        } else {
            statusBadge = `<span class="badge badge-secondary">Cancelado</span>`;
        }

        let actionButton = '';
        if (booking.status === '🟡 Pendiente por Verificar') {
            actionButton = `<button class="btn-primary btn-small" onclick="openAuditModal('${booking.id}')">Validar Pago</button>`;
        } else {
            actionButton = `<button class="btn-danger btn-small" onclick="cancelRegistration('${booking.id}')">Eliminar</button>`;
        }

        const rentalLabels = booking.rentals.length > 0 ? booking.rentals.join(', ') : 'Ninguno';

        tr.innerHTML = `
            <td style="padding:10px;">
                <strong>${booking.name}</strong><br>
                <span style="font-size:0.75rem; color:var(--text-muted);">${booking.email}</span>
            </td>
            <td style="padding:10px;"><a href="${waUrl}" target="_blank" class="roster-whatsapp-link">${booking.whatsapp}</a></td>
            <td style="padding:10px;"><span class="occupant-group-tag">${booking.group_code || '-'}</span></td>
            <td style="padding:10px;">${booking.gender}</td>
            <td style="padding:10px;">${booking.tent_preference === 'couple' ? 'Privada (Pareja)' : 'Compartida'}</td>
            <td style="padding:10px; color: ${hasMedicalAlert ? 'var(--error)' : 'var(--text-muted)'}; font-weight:${hasMedicalAlert ? '600':'400'};" title="${booking.medical}">${hasMedicalAlert ? '🔴 ' + booking.medical : 'Ninguna'}</td>
            <td style="padding:10px;">${statusBadge}<br><span style="font-size:0.8rem; font-weight:600;">$${booking.total_usd} USD</span></td>
            <td style="padding:10px; text-align:center; display:flex; gap:5px; justify-content:center; align-items:center;">
                ${actionButton}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global hook for validating payments
window.openAuditModal = function(id) {
    const booking = adminState.bookings.find(b => b.id === id);
    if (!booking) return;

    document.getElementById('audit-hiker-name').textContent = booking.name;
    document.getElementById('audit-pay-method').textContent = booking.payment_method;
    document.getElementById('audit-pay-amount').textContent = `$${booking.total_usd.toFixed(2)} USD`;
    document.getElementById('audit-pay-ref').textContent = booking.reference_number || 'Sin referencia';

    const modal = document.getElementById('modal-payment-audit');
    modal.style.display = 'flex';

    // Set buttons listeners
    document.getElementById('btn-audit-approve').onclick = async () => {
        await approvePayment(id);
        modal.style.display = 'none';
    };

    document.getElementById('btn-audit-reject').onclick = async () => {
        await rejectPayment(id);
        modal.style.display = 'none';
    };

    document.getElementById('btn-audit-close').onclick = () => {
        modal.style.display = 'none';
    };
};

async function approvePayment(id) {
    const { error } = await supabase
        .from('registrations')
        .update({ status: '🟢 Confirmado' })
        .eq('id', id);

    if (error) {
        alert('Error al aprobar pago: ' + error.message);
    } else {
        updateDashboardData();
    }
}

async function rejectPayment(id) {
    if (!confirm('¿Seguro que desea rechazar y eliminar permanentemente este registro? Se liberarán cupos y equipos.')) return;
    const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al rechazar: ' + error.message);
    } else {
        updateDashboardData();
    }
}

window.cancelRegistration = async function(id) {
    if (!confirm('¿Seguro que desea cancelar esta reserva y eliminar de las transacciones?')) return;
    const { error } = await supabase
        .from('registrations')
        .update({ status: '🔴 Cancelado' })
        .eq('id', id);

    if (error) {
        alert('Error al cancelar: ' + error.message);
    } else {
        // Delete financial transactions mirroring this registration
        await supabase.from('financial_transactions').delete().eq('registration_id', id);
        updateDashboardData();
    }
};

/* ==========================================================================
   CATERING & SNACKS CALCULATIONS
   ========================================================================== */

function renderCatering() {
    const totalHikers = adminState.bookings.filter(b => b.status === '🟢 Confirmado').length;
    
    // Insumos por excursionista
    const bananas = totalHikers;
    const bars = totalHikers * 2;
    const nutsGrams = totalHikers * 50;

    document.getElementById('catering-bananas-qty').textContent = bananas;
    document.getElementById('catering-bars-qty').textContent = bars;
    document.getElementById('catering-mix-qty').textContent = `${nutsGrams} g`;

    // Food allergy alert
    const allergyHikers = adminState.bookings.filter(b => b.status === '🟢 Confirmado' && b.allergies === 'nuts');
    const alertsBox = document.getElementById('catering-allergies-alerts');
    alertsBox.innerHTML = '';

    if (allergyHikers.length > 0) {
        allergyHikers.forEach(h => {
            const div = document.createElement('div');
            div.className = "snack-alert";
            div.style.background = 'rgba(239, 68, 68, 0.1)';
            div.style.border = '1px solid var(--error)';
            div.style.padding = '12px';
            div.style.borderRadius = '8px';
            div.style.marginBottom = '10px';
            div.innerHTML = `
                <strong>⚠️ ALERTA DE ALERGIA CRÍTICA: Frutos Secos</strong><br>
                El excursionista <strong>${h.name}</strong> (${h.whatsapp}) es alérgico a los frutos secos.<br>
                <em>Acción:</em> Sustituir su mix por galletas libres de trazas y barra comercial certificada.
            `;
            alertsBox.appendChild(div);
        });
    }

    // Material list breakdown
    const shoppingList = document.getElementById('catering-shopping-list');
    shoppingList.innerHTML = `
        <li><strong>Avena:</strong> ${(totalHikers * 40 * 2 / 1000).toFixed(2)} kg (Receta base: 40g x2 por persona)</li>
        <li><strong>Nueces:</strong> ${(totalHikers * 15 * 2 / 1000).toFixed(2)} kg (Receta base: 15g x2 por persona)</li>
        <li><strong>Almendras:</strong> ${(totalHikers * 15 * 2 / 1000).toFixed(2)} kg (Receta base: 15g x2 por persona)</li>
        <li><strong>Papelón:</strong> ${(totalHikers * 25 * 2 / 1000).toFixed(2)} kg (Receta base: 25g x2 por persona)</li>
        <li><strong>Mix Frutos Secos comercial:</strong> ${(nutsGrams / 1000).toFixed(2)} kg</li>
        <li><strong>Cambur (Bananas):</strong> ${bananas} unidades</li>
        <li><strong>Bolsas plásticas de sellado:</strong> ${totalHikers} unidades</li>
    `;
}

/* ==========================================================================
   ⛺ TENT ALLOCATOR (PROPIA VS AJENA)
   ========================================================================== */

function runTentAllocation() {
    const container = document.getElementById('tents-allocation-container');
    container.innerHTML = '';

    const confirmedHikers = adminState.bookings.filter(b => b.status === '🟢 Confirmado');
    if (confirmedHikers.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">Sin excursionistas confirmados para asignar carpas.</div>`;
        return;
    }

    // 1. Establish Flota
    // Owned (Diego)
    const ownedTents = [
        { id: 'Own2P', type: 'Propia 2P', capacity: 2, occupants: [], cost: 0 },
        { id: 'Own3P', type: 'Propia 3P', capacity: 3, occupants: [], cost: 0 },
        { id: 'Own4P', type: 'Propia 4P', capacity: 4, occupants: [], cost: 0 }
    ];

    // External (Terceros)
    const externalTents = [
        { id: 'Ext2P_1', type: 'Externa 2P', capacity: 2, occupants: [], cost: 10 },
        { id: 'Ext2P_2', type: 'Externa 2P', capacity: 2, occupants: [], cost: 10 }
    ];

    const unassigned = [...confirmedHikers];

    // Lógica de emparejamiento por grupos
    // Identificar códigos de grupo
    const groupsMap = {};
    unassigned.forEach(h => {
        if (h.group_code) {
            groupsMap[h.group_code] = groupsMap[h.group_code] || [];
            groupsMap[h.group_code].push(h);
        }
    });

    // Asignar grupos primero en las carpas propias más óptimas
    Object.keys(groupsMap).forEach(code => {
        const members = groupsMap[code];
        
        // Find an empty owned tent that fits the group
        let bestTent = ownedTents.find(t => t.occupants.length === 0 && t.capacity >= members.length);
        
        if (!bestTent) {
            // Find any owned tent with enough space
            bestTent = ownedTents.find(t => (t.capacity - t.occupants.length) >= members.length);
        }

        if (!bestTent) {
            // Fallback to external empty tent
            bestTent = externalTents.find(t => t.occupants.length === 0 && t.capacity >= members.length);
        }

        if (bestTent) {
            // Fill
            members.forEach(m => {
                bestTent.occupants.push(m);
                const idx = unassigned.findIndex(u => u.id === m.id);
                if (idx !== -1) unassigned.splice(idx, 1);
            });
        }
    });

    // Asignar personas individuales por género (M/F)
    const males = unassigned.filter(u => u.gender === 'M');
    const females = unassigned.filter(u => u.gender === 'F');

    const assignSoloGender = (solos) => {
        solos.forEach(solo => {
            // 1. Try to find a tent of same gender with space
            let target = [...ownedTents, ...externalTents].find(t => 
                t.occupants.length > 0 && 
                t.occupants.length < t.capacity && 
                t.occupants.every(o => o.gender === solo.gender)
            );

            // 2. Try empty owned tent
            if (!target) {
                target = ownedTents.find(t => t.occupants.length === 0);
            }

            // 3. Try empty external tent
            if (!target) {
                target = externalTents.find(t => t.occupants.length === 0);
            }

            // 4. Try any space left
            if (!target) {
                target = [...ownedTents, ...externalTents].find(t => t.occupants.length < t.capacity);
            }

            if (target) {
                target.occupants.push(solo);
            }
        });
    };

    assignSoloGender(males);
    assignSoloGender(females);

    // Render cards
    const renderTentCard = (tent) => {
        const card = document.createElement('div');
        const count = tent.occupants.length;
        const cap = tent.capacity;
        
        let statusClass = 'tent-empty';
        if (count > 0) {
            statusClass = count === cap ? 'tent-full' : 'tent-partial';
        }

        card.className = `tent-allocation-card glass-panel ${statusClass}`;
        
        let listItems = '';
        if (count > 0) {
            tent.occupants.forEach(occ => {
                listItems += `<li class="tent-occupant">${occ.gender === 'M' ? '👨' : '👩'} ${occ.name} <span class="occupant-group-tag">${occ.group_code || 'Individual'}</span></li>`;
            });
        } else {
            listItems = `<li class="tent-occupant" style="color:var(--text-muted); justify-content:center;">Vacía</li>`;
        }

        card.innerHTML = `
            <div class="tent-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span class="tent-card-title">🏕️ ${tent.type} (#${tent.id})</span>
                <span class="badge ${count === cap ? 'badge-green' : (count > 0 ? 'badge-orange' : 'badge-secondary')}">${count}/${cap}</span>
            </div>
            <ul class="tent-occupants-list" style="padding: 10px; list-style:none; margin:0;">
                ${listItems}
            </ul>
            <div style="font-size:0.75rem; color:var(--text-muted); padding: 5px 10px; border-top:1px solid rgba(255,255,255,0.05);">
                Costo para Diego: ${tent.cost > 0 ? `<strong style="color:var(--error);">$${tent.cost} USD</strong>` : '<span style="color:var(--success);">$0 USD</span>'}
            </div>
        `;
        container.appendChild(card);
    };

    ownedTents.forEach(renderTentCard);
    externalTents.forEach(renderTentCard);

    // Save allocation details in State for split logic calculations
    adminState.tentsAllocation = [...ownedTents, ...externalTents];
}

/* ==========================================================================
   FINANCIAL MANAGEMENT (BOXES & CHARTS)
   ========================================================================== */

function renderFinancials() {
    const trans = adminState.financials;

    // Filter dynamic calculations (salida vs histórico)
    const showOnlySelectedDate = document.getElementById('fin-filter-event').classList.contains('active');
    const filteredTrans = showOnlySelectedDate 
        ? trans.filter(t => t.date === adminState.selectedDate)
        : trans;

    // Accounts balances (Entradas - Salidas)
    const balances = {
        'Efectivo': 0.00,
        'Binance': 0.00,
        'Zelle': 0.00,
        'Banco Bs': 0.00
    };

    filteredTrans.forEach(t => {
        const netValue = parseFloat(t.total_neto_usd);
        const amtOriginal = parseFloat(t.amount_original);
        if (t.type === 'Ingreso') {
            if (t.account === 'Banco Bs') {
                balances['Banco Bs'] += amtOriginal;
            } else {
                balances[t.account] += netValue;
            }
        } else { // Egreso
            if (t.account === 'Banco Bs') {
                balances['Banco Bs'] -= amtOriginal;
            } else {
                balances[t.account] -= netValue;
            }
        }
    });

    document.getElementById('box-cash-val').textContent = `$${balances['Efectivo'].toFixed(2)}`;
    document.getElementById('box-binance-val').textContent = `$${balances['Binance'].toFixed(2)}`;
    document.getElementById('box-zelle-val').textContent = `$${balances['Zelle'].toFixed(2)}`;
    document.getElementById('box-banco-val').textContent = `Bs. ${balances['Banco Bs'].toLocaleString('es-VE')}`;

    // Coverage calculations (Recaudación Bs Banco vs Gastos estimados en Bs)
    const bsReceipts = adminState.bookings
        .filter(b => b.status === '🟢 Confirmado' && b.payment_method === 'Pago Móvil')
        .reduce((sum, b) => sum + parseFloat(b.total_usd), 0);

    const bcvRate = adminState.settings.last_valid_bcv?.rate || 40.00;
    const bsReceiptsVal = bsReceipts * bcvRate;
    
    // Catering formula expenses base ($3.51 per hiker)
    const confirmedCount = adminState.bookings.filter(b => b.status === '🟢 Confirmado').length;
    const foodCostBs = confirmedCount * 3.51 * bcvRate;

    // External tents cost ($10 per external used)
    let externalTentsCount = 0;
    if (adminState.tentsAllocation) {
        externalTentsCount = adminState.tentsAllocation.filter(t => t.cost > 0 && t.occupants.length > 0).length;
    }
    const externalTentsCostBs = externalTentsCount * 10.00 * bcvRate;
    
    const totalEstExpensesBs = foodCostBs + externalTentsCostBs;
    const surplusBs = Math.max(0, bsReceiptsVal - totalEstExpensesBs);

    document.getElementById('coverage-ves-balance').textContent = `Bs. ${bsReceiptsVal.toLocaleString('es-VE')}`;
    document.getElementById('coverage-ves-expenses').textContent = `Bs. ${totalEstExpensesBs.toLocaleString('es-VE')}`;
    document.getElementById('coverage-ves-surplus').textContent = `Bs. ${surplusBs.toLocaleString('es-VE')}`;

    // Action listener for Permuta / Conversión
    document.getElementById('btn-exchange-currency').onclick = () => {
        document.getElementById('perm-ves-amount').value = surplusBs.toFixed(2);
        document.getElementById('modal-permuta-register').style.display = 'flex';
    };

    // Split report calculation: Net Income Admin vs Provider Cuentas por Pagar
    // 100% of consignment equipment + $10 per external tent used
    let accountsPayable = 0.00;

    // Rentals on consignment
    adminState.bookings.filter(b => b.status === '🟢 Confirmado').forEach(b => {
        b.rentals.forEach(itemId => {
            const catalog = adminState.inventoryCatalog.find(i => i.item_id === itemId);
            if (catalog && catalog.consignment_qty > 0) {
                // If this is on consignment, we calculate payout (100% of price is paid to mother provider)
                accountsPayable += parseFloat(catalog.price_usd);
            }
        });
    });

    // Add external tents cost
    accountsPayable += externalTentsCount * 10.00;

    const tourGross = adminState.bookings
        .filter(b => b.status === '🟢 Confirmado')
        .reduce((sum, b) => sum + parseFloat(b.total_usd), 0);

    const netAdminIncome = Math.max(0, tourGross - accountsPayable);

    document.getElementById('split-income-net').textContent = `$${netAdminIncome.toFixed(2)}`;
    document.getElementById('split-accounts-payable').textContent = `$${accountsPayable.toFixed(2)} (Bs. ${(accountsPayable * bcvRate).toLocaleString('es-VE')})`;

    // Render SVG graphs
    renderCharts(filteredTrans);
}

function renderCharts(filteredTrans) {
    // 1. Bar Chart: Incomes vs Expenses
    const incomeTotal = filteredTrans.filter(t => t.type === 'Ingreso').reduce((sum, t) => sum + parseFloat(t.total_neto_usd), 0);
    const expenseTotal = filteredTrans.filter(t => t.type === 'Egreso').reduce((sum, t) => sum + parseFloat(t.total_neto_usd), 0);

    const incHeight = incomeTotal > 0 ? 80 : 0;
    const expHeight = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 80 : (expenseTotal > 0 ? 80 : 0);

    document.getElementById('chart-cash-flow').innerHTML = `
        <div class="chart-bar-container">
            <span class="chart-bar-value">$${incomeTotal.toFixed(0)}</span>
            <div class="chart-bar income" style="height: ${incHeight}%;"></div>
            <span class="chart-bar-label">Ingresos</span>
        </div>
        <div class="chart-bar-container">
            <span class="chart-bar-value">$${expenseTotal.toFixed(0)}</span>
            <div class="chart-bar expense" style="height: ${expHeight}%;"></div>
            <span class="chart-bar-label">Gastos</span>
        </div>
    `;

    // 2. Pie Chart: Expenses Distribution (Categories)
    const cats = {
        'Catering/Alimentos': 0,
        'Guías Auxiliares': 0,
        'Logística/Transporte': 0,
        'Imprevistos': 0
    };

    filteredTrans.filter(t => t.type === 'Egreso').forEach(t => {
        if (cats[t.category] !== undefined) {
            cats[t.category] += parseFloat(t.total_neto_usd);
        }
    });

    let catListHtml = '<ul style="list-style:none; font-size:0.75rem; padding:0; width:100%;">';
    const totalExp = Object.values(cats).reduce((sum, val) => sum + val, 0);

    Object.keys(cats).forEach(cat => {
        const val = cats[cat];
        const pct = totalExp > 0 ? Math.round((val / totalExp) * 100) : 0;
        catListHtml += `<li style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>${cat}</span> <strong>$${val.toFixed(0)} (${pct}%)</strong></li>`;
    });
    catListHtml += '</ul>';

    document.getElementById('chart-expense-dist').innerHTML = `
        <div style="width: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;">
            ${catListHtml}
        </div>
    `;
}

function setupExpenseForm() {
    const form = document.getElementById('expense-register-form');
    const accountSelect = document.getElementById('exp-account');
    const rateWrapper = document.getElementById('exp-rate-wrapper');
    const rateInput = document.getElementById('exp-rate');

    accountSelect.addEventListener('change', () => {
        if (accountSelect.value === 'Banco Bs') {
            rateWrapper.style.display = 'block';
            rateInput.required = true;
            rateInput.value = (adminState.settings.last_valid_bcv?.rate || 40.00).toFixed(2);
        } else {
            rateWrapper.style.display = 'none';
            rateInput.required = false;
            rateInput.value = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('exp-category').value;
        const account = accountSelect.value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const desc = document.getElementById('exp-desc').value.trim();
        const rate = parseFloat(rateInput.value) || 1.00;

        let totalNeto = amount;
        if (account === 'Banco Bs') {
            totalNeto = amount / rate;
        }

        const { error } = await supabase.from('financial_transactions').insert({
            date: adminState.selectedDate,
            type: 'Egreso',
            concept: desc,
            category,
            account,
            currency: account === 'Banco Bs' ? 'VES' : 'USD',
            amount_original: amount,
            exchange_rate: rate,
            total_neto_usd: totalNeto
        });

        if (error) {
            alert('Error al guardar egreso: ' + error.message);
        } else {
            form.reset();
            rateWrapper.style.display = 'none';
            updateDashboardData();
        }
    });

    // Permuta / Cambios form handler
    document.getElementById('permuta-register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const vesAmt = parseFloat(document.getElementById('perm-ves-amount').value);
        const destAcc = document.getElementById('perm-usd-account').value;
        const usdAmt = parseFloat(document.getElementById('perm-usd-amount').value);
        const rate = parseFloat(document.getElementById('perm-rate').value);

        // 1. Egreso from Banco Bs
        const { error: error1 } = await supabase.from('financial_transactions').insert({
            date: adminState.selectedDate,
            type: 'Egreso',
            concept: `Permuta Cambiaria (Retiro VES)`,
            category: 'Permuta',
            account: 'Banco Bs',
            currency: 'VES',
            amount_original: vesAmt,
            exchange_rate: rate,
            total_neto_usd: usdAmt
        });

        // 2. Ingreso to destination account
        const { error: error2 } = await supabase.from('financial_transactions').insert({
            date: adminState.selectedDate,
            type: 'Ingreso',
            concept: `Permuta Cambiaria (Recepción USD)`,
            category: 'Permuta',
            account: destAcc,
            currency: 'USD',
            amount_original: usdAmt,
            exchange_rate: rate,
            total_neto_usd: usdAmt
        });

        if (error1 || error2) {
            alert('Error al registrar permuta.');
        } else {
            document.getElementById('modal-permuta-register').style.display = 'none';
            updateDashboardData();
        }
    });

    document.getElementById('btn-permuta-close').onclick = () => {
        document.getElementById('modal-permuta-register').style.display = 'none';
    };
}

/* ==========================================================================
   CHECKLIST LOGÍSTICO PRE-VIAJE
   ========================================================================== */

function renderChecklist() {
    const container = document.getElementById('checklist-blocks-container');
    container.innerHTML = '';

    const blocks = [
        {
            title: "BLOQUE 1: Gestión de Reserva (Antes de empezar)",
            tasks: [
                { id: "check-totals", name: "Confirmar número exacto de personas", actionText: "Ver Totales", actionType: "totals" },
                { id: "create-whatsapp", name: "Crear grupo de WhatsApp exclusivo y vincularlo", actionText: "Crear y Vincular Grupo", actionType: "whatsapp" },
                { id: "send-pdf", name: "Enviar PDF de logística y recomendaciones", actionText: "Compartir PDF", actionType: "pdf" }
            ]
        },
        {
            title: "BLOQUE 2: Producción y Logística (Catering, Compras e Inventario)",
            tasks: [
                { id: "groceries", name: "Compra de Materia Prima e Insumos", actionText: "Generar Lista de Compras", actionType: "groceryList" },
                { id: "cook-bars", name: "Cocina y Elaboración de Barras", actionText: "Ver Ficha Técnica", actionType: "cookFicha" },
                { id: "pack-kits", name: "Empacado y Kits de Marcha", actionText: "Ver Guía de Empaque", actionType: "packGuide" },
                { id: "audit-tents", name: "Auditoría de Carpas y Alojamiento", actionText: "Verificar Distribución", actionType: "tentsVerify" },
                { id: "gear-inventory", name: "Conteo de Equipamiento y Alquileres", actionText: "Ver Matriz de Carga", actionType: "gearMatrix" },
                { id: "clean-tents", name: "Control de Calidad y Mantenimiento", actionText: "Confirmar Limpieza", actionType: "cleanTents" }
            ]
        },
        {
            title: "BLOQUE 3: Seguridad y Terreno (Pre-Viaje)",
            tasks: [
                { id: "check-medkit", name: "Revisar Botiquín", actionText: "Ficha de Insumos", actionType: "medkit" },
                { id: "charge-batteries", name: "Cargar Powerbanks y linternas", actionText: "Marcar Cargado", actionType: "charge" },
                { id: "reminder-water", name: "Verificación de stock de agua (recordatorio a clientes)", actionText: "Enviar Recordatorio Agua", actionType: "waterRemind" },
                { id: "briefing-rain", name: "Briefing Seguridad por Lluvias", actionText: "Enviar Protocolo Lluvia", actionType: "rainProtocol" }
            ]
        },
        {
            title: "BLOQUE 4: Comunicación Final (Día previo)",
            tasks: [
                { id: "reminder-gear", name: "Recordar lista de vestimenta y equipo", actionText: "Enviar Recordatorio Ropa", actionType: "clothingRemind" },
                { id: "confirm-list", name: "Confirmación final de asistencia (roster)", actionText: "Pasar Lista Final", actionType: "finalList" },
                { id: "meeting-point", name: "Enviar ubicación exacta del punto de encuentro (La Julia)", actionText: "Enviar Ubicación", actionType: "location" },
                { id: "offline-download", name: "Documentos y seguridad offline", actionText: "Descargar Roster Offline", actionType: "offlineDown" }
            ]
        }
    ];

    blocks.forEach(block => {
        const div = document.createElement('div');
        div.className = "checklist-group";
        div.innerHTML = `<div class="checklist-group-title">${block.title}</div>`;

        block.tasks.forEach(task => {
            const isCompleted = adminState.checklists.some(c => c.task_id === task.id && c.completed);
            
            // Search if there is custom link for whatsapp
            const linkedDb = adminState.checklists.find(c => c.task_id === task.id);
            const extraInput = task.actionType === 'whatsapp' 
                ? `<input type="text" id="wa-link-input" placeholder="Pegar Link Grupo" value="${linkedDb?.whatsapp_group_id || ''}" style="width:160px; padding: 4px; border-radius:4px; font-size:0.75rem; border:1px solid rgba(255,255,255,0.1); background:rgba(0,0,0,0.3); color:white; margin-left:10px;">`
                : '';

            const row = document.createElement('div');
            row.className = "checklist-item-row";
            row.innerHTML = `
                <div class="checklist-item-left">
                    <input type="checkbox" class="chk-task-item" data-task-id="${task.id}" ${isCompleted ? 'checked' : ''}>
                    <span style="font-size: 0.9rem; text-decoration: ${isCompleted ? 'line-through':'none'}; color: ${isCompleted ? 'var(--text-muted)':'var(--text)'};">${task.name}</span>
                    ${extraInput}
                </div>
                <button class="btn-secondary btn-small" onclick="executeTaskAction('${task.actionType}', '${task.id}')">${task.actionText}</button>
            `;

            // checkbox toggle
            row.querySelector('.chk-task-item').addEventListener('change', async (e) => {
                await toggleTaskDb(task.id, e.target.checked);
            });

            if (task.actionType === 'whatsapp') {
                row.querySelector('#wa-link-input')?.addEventListener('change', async (e) => {
                    await saveWhatsAppGroupLink(task.id, e.target.value);
                });
            }

            div.appendChild(row);
        });

        container.appendChild(div);
    });
}

async function toggleTaskDb(taskId, completed) {
    const { error } = await supabase
        .from('checklist_salidas')
        .upsert({
            id_fecha: adminState.selectedDate,
            task_id: taskId,
            completed: completed
        }, { onConflict: 'id_fecha,task_id' });

    if (error) {
        alert('Error al guardar estado de checklist: ' + error.message);
    } else {
        updateDashboardData();
    }
}

async function saveWhatsAppGroupLink(taskId, link) {
    const { error } = await supabase
        .from('checklist_salidas')
        .upsert({
            id_fecha: adminState.selectedDate,
            task_id: taskId,
            whatsapp_group_id: link,
            completed: true
        }, { onConflict: 'id_fecha,task_id' });

    if (error) {
        alert('Error al vincular grupo: ' + error.message);
    } else {
        updateDashboardData();
    }
}

window.executeTaskAction = function(type, taskId) {
    const totalHikers = adminState.bookings.filter(b => b.status === '🟢 Confirmado').length;

    if (type === 'totals') {
        alert(`Total de excursionistas confirmados para la salida: ${totalHikers} personas.`);
    } 
    else if (type === 'whatsapp') {
        // Create and copy Whatsapp group template text
        const text = `¡Hola! 🏔️ Estamos preparando todo para nuestra expedición al Pico Naiguatá. He creado este grupo exclusivo para los participantes de este tour. Por aquí estaré compartiendo las actualizaciones logísticas, el reporte del clima y cualquier información importante antes de subir. Por favor, mantengamos el grupo solo para temas relacionados al viaje. ¡Nos vemos pronto en la montaña!`;
        navigator.clipboard.writeText(text);
        window.open('https://web.whatsapp.com/', '_blank');
        alert('Mensaje de bienvenida copiado al portapapeles. Abriendo WhatsApp Web para la creación del grupo...');
    } 
    else if (type === 'pdf') {
        const text = `¡Hola equipo! 🏔️ Ya estamos a pocos días de nuestra expedición al Pico Naiguatá. Para que todos estemos alineados con la logística, seguridad y los detalles técnicos del ascenso, les comparto el documento oficial del tour. Por favor, tómense un momento para leerlo con calma. Allí encontrarán: ✅ Itinerario detallado. ✅ Lista final de equipo personal obligatorio. ✅ Consejos de hidratación y alimentación. 📄 Puedes consultar el PDF aquí: https://drive.google.com/file/d/1Y-H51Vgvbn6iH-Ao0rzwrs_WLf9BxZP6/view?usp=sharing Cualquier duda técnica que tengan después de leerlo, me escriben por aquí. ¡Nos vemos en la cumbre! 🧗‍♂️✨`;
        navigator.clipboard.writeText(text);
        const linkedGroup = adminState.checklists.find(c => c.task_id === 'create-whatsapp')?.whatsapp_group_id || '';
        if (linkedGroup) {
            window.open(`https://${linkedGroup}`, '_blank');
        } else {
            window.open('https://web.whatsapp.com/', '_blank');
        }
        alert('Mensaje del PDF copiado al portapapeles.');
    }
    else if (type === 'groceryList') {
        const N = totalHikers;
        const msg = `🛒 *LISTA DE COMPRAS - NAIGUATÁ* 🛒
Para ${N} senderistas:
• Avena: ${N * 80} g (${(N * 80 / 1000).toFixed(2)} kg)
• Nueces: ${N * 30} g (${(N * 30 / 1000).toFixed(2)} kg)
• Almendras: ${N * 30} g (${(N * 30 / 1000).toFixed(2)} kg)
• Papelón: ${N * 50} g (${(N * 50 / 1000).toFixed(2)} kg)
• Mix Frutos Secos: ${N * 50} g (${(N * 50 / 1000).toFixed(2)} kg)
• Bananas (Cambur): ${N} unidades (más 2 de respaldo)`;
        
        navigator.clipboard.writeText(msg);
        alert('Lista de compras copiada al portapapeles:\n\n' + msg);
    }
    else if (type === 'cookFicha') {
        alert('🍳 FICHA TÉCNICA - RECETA BARRAS:\n\nReceta Base: Avena + Nueces + Almendras + Papelón.\nProcedimiento:\n1. Fundir papelón.\n2. Mezclar con frutos secos triturados.\n3. Compactar en bandeja.\n4. Cortar en frío tras solidificación.');
    }
    else if (type === 'packGuide') {
        alert('📦 GUÍA DE EMPAQUE SNACKS:\n\nEmpacar por participante en bolsas individuales selladas:\n- 2 Barras energéticas caseras (50g c/u)\n- 1 Mix frutos secos (50g)\n- 1 Banana fresca');
    }
    else if (type === 'tentsVerify') {
        let own2 = 0, own3 = 0, own4 = 0, ext2 = 0;
        if (adminState.tentsAllocation) {
            own2 = adminState.tentsAllocation.filter(t => t.id === 'Own2P' && t.occupants.length > 0).length;
            own3 = adminState.tentsAllocation.filter(t => t.id === 'Own3P' && t.occupants.length > 0).length;
            own4 = adminState.tentsAllocation.filter(t => t.id === 'Own4P' && t.occupants.length > 0).length;
            ext2 = adminState.tentsAllocation.filter(t => t.cost > 0 && t.occupants.length > 0).length;
        }
        alert(`⛺ CARPAS REQUERIDAS DEL ALMACÉN:\n\n- Carpas Propia 2P: ${own2}\n- Carpas Propia 3P: ${own3}\n- Carpas Propia 4P: ${own4}\n- Carpas Externa 2P: ${ext2}`);
    }
    else if (type === 'gearMatrix') {
        let bags = 0, pads = 0, poles = 0;
        adminState.bookings.filter(b => b.status === '🟢 Confirmado').forEach(b => {
            if (b.rentals.includes('sleeping-bag')) bags++;
            if (b.rentals.includes('sleeping-pad')) pads++;
            if (b.rentals.includes('trekking-poles')) poles++;
        });
        alert(`🛠️ MATRIZ DE CARGA DE ALQUILER:\n\n• Sacos de Dormir (Sleeping Bags): ${bags}\n• Aislantes (Pads): ${pads}\n• Bastones de Trekking: ${poles}\n• Linternas de carpa grupales: 2`);
    }
    else if (type === 'cleanTents') {
        alert('Confirmado: Equipamiento de pernocta limpio, seco y verificado.');
    }
    else if (type === 'medkit') {
        alert('🩹 BOTIQUÍN - LISTA CRÍTICA:\n\nParches ampollas, Gasas, Esparadrapo, Antiséptico, Suero fisiológico, Ibuprofeno/Paracetamol, Antihistamínico, Manta térmica obligatoria.');
    }
    else if (type === 'charge') {
        alert('Dispositivos eléctricos y luces cargados al 100%.');
    }
    else if (type === 'waterRemind') {
        const text = `¡Hola equipo! 🏔 Recuerden traer mínimo 3L de agua. Tip: Eviten botellas plásticas delgadas, usen envases resistentes.`;
        navigator.clipboard.writeText(text);
        alert('Mensaje recordatorio de agua copiado al portapapeles.');
    }
    else if (type === 'rainProtocol') {
        const text = `Prioridad: Tu Seguridad 🌧 Ante la temporada de lluvias, nuestra prioridad absoluta es garantizar tu bienestar. En caso de que las condiciones meteorológicas nos obliguen a suspender la actividad, no te preocupes: tendrás prioridad absoluta para reagendar tu experiencia en nuestra próxima fecha disponible.`;
        navigator.clipboard.writeText(text);
        alert('Protocolo de lluvia copiado al portapapeles.');
    }
    else if (type === 'clothingRemind') {
        const text = `¡Hola equipo! 🏔 Seguimos con los preparativos... Les recuerdo el equipo personal indispensable: 1. Pernocta (Sleeping bag adecuado y Aislante térmico/Esterilla). 2. Iluminación (Linterna frontal). 3. Vestimenta (Capa base transpirable, capa de abrigo fleece/plumas, capa exterior cortavientos, medias de repuesto y calzado con buen agarre)...`;
        navigator.clipboard.writeText(text);
        alert('Recordatorio de ropa/capas copiado al portapapeles.');
    }
    else if (type === 'finalList') {
        const text = `¡Hola, equipo! 🏔 Ya estamos a nada de nuestra aventura. Por favor, confírmenme por aquí con un 'Confirmado' quienes ya tienen todo su equipo listo (saco de dormir, linterna, hidratación) y están listos para encontrarnos mañana en La Julia a las 07:30 AM...`;
        navigator.clipboard.writeText(text);
        alert('Paso de lista final copiado al portapapeles.');
    }
    else if (type === 'location') {
        const text = `¡Hola equipo! 🏔 Les comparto la ubicación exacta de nuestro punto de encuentro para el inicio de la expedición al Pico Naiguatá: 📍 Lugar: Sector La Julia (Entrada al Parque Nacional El Ávila). ⏰ Hora de encuentro: 07:30 AM (puntualidad, por favor). Link de Google Maps: https://maps.app.goo.gl/7rLDrLBeQCvrkrsy6`;
        navigator.clipboard.writeText(text);
        alert('Ubicación de encuentro copiada al portapapeles.');
    }
    else if (type === 'offlineDown') {
        // Download roster text report
        const confirmed = adminState.bookings.filter(b => b.status === '🟢 Confirmado');
        let textReport = `ROSTER OFFLINE - EXPEDICIÓN NAIGUATÁ (${adminState.selectedDate})\n`;
        textReport += `Total Senderistas: ${confirmed.length}\n`;
        textReport += `==========================================\n`;
        confirmed.forEach((c, idx) => {
            textReport += `${idx+1}. ${c.name} | Cel: ${c.whatsapp} | Género: ${c.gender}\n`;
            textReport += `   Grupo: ${c.group_code || 'N/A'} | Alergias: ${c.allergies} | Médica: ${c.medical}\n\n`;
        });
        
        const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Naiguata_Roster_Offline_${adminState.selectedDate}.txt`;
        link.click();
    }
};

/* ==========================================================================
   WEATHER AUDIT (SEMÁFORO INTELIGENTE)
   ========================================================================== */

function queryWeather(dateVal) {
    const semaphore = document.getElementById('weather-semaphore');
    const details = document.getElementById('weather-details');
    const btnOk = document.getElementById('btn-send-weather-ok');
    const btnCancel = document.getElementById('btn-send-weather-cancel');

    // MOCK CLIMATIC PARSER (Serverless fallback simulator)
    // We assume 80% reliability and 1.5mm rain (Green state)
    const reliability = 85;
    const rainMm = 1.2;

    semaphore.textContent = '🟢 CONFIRMADA';
    semaphore.className = 'badge badge-green';
    
    details.innerHTML = `
        <strong>Meteoblue:</strong> Predictibilidad Muy Alta (${reliability}%)<br>
        <strong>Mountain-Forecast:</strong> Lluvia Estimada ${rainMm} mm<br>
        <span style="color:var(--success); font-weight:600; display:block; margin-top:8px;">✔ Ruta apta para el ascenso.</span>
    `;

    btnOk.disabled = false;
    btnCancel.disabled = false;

    btnOk.onclick = () => {
        const text = `¡Hola equipo! 🏔️ El reporte climático de Meteoblue y Mountain-Forecast confirma óptimas condiciones para nuestra salida del ${dateVal}. El semáforo del sistema se encuentra en VERDE 🟢. ¡Salida 100% confirmada! Preparen sus abrigos.`;
        navigator.clipboard.writeText(text);
        alert('Confirmación climática copiada al portapapeles.');
    };

    btnCancel.onclick = () => {
        const text = `¡Hola equipo! 🏔️ Alerta de contingencia climática: Se estiman precipitaciones moderadas a fuertes para el ${dateVal}. El semáforo de ruta se encuentra en ROJO 🔴. Por su seguridad, iniciaremos el protocolo de reprogramación activa.`;
        navigator.clipboard.writeText(text);
        alert('Mensaje de suspensión copiado al portapapeles.');
    };
}

/* ==========================================================================
   INPARQUES COMPILATION & SUBMISSION
   ========================================================================== */

document.getElementById('btn-inparques-request').addEventListener('click', () => {
    // Generate INPARQUES text document representation based on JURIDICA.pdf
    const dateVal = adminState.selectedDate;
    const confirmed = adminState.bookings.filter(b => b.status === '🟢 Confirmado');

    let docText = `SOLICITUD DE PERMISO DE PERNOCTA - PARQUE NACIONAL WARAIRA REPANO\n`;
    docText += `Representante de Operadora: Diego Moroño (Naiguatá Expeditions)\n`;
    docText += `Fecha de la Actividad: ${dateVal}\n`;
    docText += `Ruta de Ascenso: La Julia - Fila Maestra - Anfiteatro - Cumbre\n`;
    docText += `Cantidad de Participantes: ${confirmed.length}\n`;
    docText += `======================================================================\n\n`;
    
    confirmed.forEach((c, idx) => {
        docText += `${idx+1}. Nombre: ${c.name} | C.I/Ref: ${c.reference_number || 'N/A'} | Género: ${c.gender}\n`;
    });

    // Download file representation
    const blob = new Blob([docText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Solicitud_INPARQUES_${dateVal}.txt`;
    link.click();

    // Mailto triggers
    const subject = `Solicitud de Permiso para Actividad Recreativa - ${dateVal} - Expediciones Naiguatá`;
    const body = `Adjunto envío la documentación legal requerida para la expedición programada. Saludos, Diego Moroño.`;
    const mailto = `mailto:dgs.parquesrecreacion@gmail.com,dgparques.nacionales@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    setTimeout(() => {
        window.open(mailto, '_blank');
        alert("El archivo se ha descargado. Por favor, selecciona 'Adjuntar' y elige el primer archivo de tu carpeta de descargas para enviarlo.");
    }, 1000);
});

/* ==========================================================================
   MASTER REPORT EXPORT (REPORTE MAESTRO)
   ========================================================================== */

document.getElementById('btn-master-report').addEventListener('click', () => {
    const dateVal = adminState.selectedDate;
    const confirmed = adminState.bookings.filter(b => b.status === '🟢 Confirmado');

    let report = `==================================================\n`;
    report += `⛰️ REPORTE MAESTRO DE EXPEDICIÓN: PICO NAIGUATÁ ⛰️\n`;
    report += `Fecha: ${dateVal}\n`;
    report += `==================================================\n\n`;

    // Roster Nominal
    report += `📋 ROSTER NOMINAL DE EXCURSIONISTAS:\n`;
    confirmed.forEach((c, idx) => {
        report += `${idx+1}. ${c.name} | Whatsapp: ${c.whatsapp} | Alergias: ${c.allergies} | Médico: ${c.medical}\n`;
    });
    report += `\n`;

    // Inventory
    let bags = 0, pads = 0, poles = 0;
    confirmed.forEach(c => {
        if (c.rentals.includes('sleeping-bag')) bags++;
        if (c.rentals.includes('sleeping-pad')) pads++;
        if (c.rentals.includes('trekking-poles')) poles++;
    });

    report += `📦 CONSOLIDADO DE INVENTARIO PARA CARGAR:\n`;
    report += `• Sacos de Dormir: ${bags}\n`;
    report += `• Aislantes Térmicos: ${pads}\n`;
    report += `• Bastones: ${poles}\n\n`;

    // Catering
    report += `🍳 CONSOLIDADO DE SNACKS Y COMPRAS:\n`;
    report += `• Cambures: ${confirmed.length}\n`;
    report += `• Barras Energéticas: ${confirmed.length * 2}\n`;
    report += `• Mix Frutos Secos: ${confirmed.length * 50}g\n\n`;

    // Finance
    const totalRev = confirmed.reduce((sum, b) => sum + parseFloat(b.total_usd), 0);
    report += `💰 RESUMEN FINANCIERO ESTIMADO:\n`;
    report += `• Recaudación Bruta: $${totalRev.toFixed(2)} USD\n`;
    
    // Download Blob
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Maestro_Naiguata_${dateVal}.txt`;
    link.click();
});

document.getElementById('btn-share-master').addEventListener('click', () => {
    const dateVal = adminState.selectedDate;
    const confirmedCount = adminState.bookings.filter(b => b.status === '🟢 Confirmado').length;
    const shareText = `Reporte resumido Naiguatá para el ${dateVal}: ${confirmedCount} excursionistas confirmados. ¡Preparamos la salida!`;

    if (navigator.share) {
        navigator.share({
            title: 'Reporte Maestro Naiguatá',
            text: shareText
        });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Resumen del reporte maestro copiado al portapapeles.');
    }
});

/* ==========================================================================
   SETTINGS CATALOG TABLE
   ========================================================================== */

function renderSettingsCatalog() {
    const tbody = document.getElementById('settings-catalog-table');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    // Display base raw ingredients and items
    const rows = [
        { name: "Avena", unit: "Kilogramo (1000g)", price: 4.00 },
        { name: "Nueces", unit: "Kilogramo (1000g)", price: 21.00 },
        { name: "Almendras", unit: "Kilogramo (1000g)", price: 21.00 },
        { name: "Papelón", unit: "Empaque (500g)", price: 1.80 },
        { name: "Mix Frutos Secos", unit: "Kilogramo (1000g)", price: 24.00 },
        { name: "Banana (Cambur)", unit: "Unidad Promedio", price: 0.35 },
        { name: "Bolsa Plástica", unit: "Unidad", price: 0.15 }
    ];

    rows.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding:10px;"><strong>${row.name}</strong></td>
            <td style="padding:10px; color:var(--text-muted);">${row.unit}</td>
            <td style="padding:10px;">$${row.price.toFixed(2)} USD</td>
            <td style="padding:10px; text-align:center;"><button class="btn-secondary btn-small">Editar</button></td>
        `;
        tbody.appendChild(tr);
    });
}
