import { adminStore } from '../config/state.js';

/**
 * RENDERIZADO GLOBAL DE LOGÍSTICA
 * Se encarga de actualizar las pestañas de Catering y Carpas.
 */
export function renderLogistics() {
    const registrations = adminStore.get().registrations || [];
    const confirmedHikers = registrations.filter(r => r.status.includes('Confirmado'));
    
    renderCatering(confirmedHikers);
    renderTents(confirmedHikers);
}

/**
 * PESTAÑA: CATERING Y SNACKS
 * Calcula cantidades de insumos basadas en el aforo confirmado.
 */
function renderCatering(hikers) {
    const n = hikers.length;
    
    // IDs de elementos en el HTML (pestaña tab-catering)
    const elBananas = document.getElementById('catering-bananas-qty');
    const elBars = document.getElementById('catering-bars-qty');
    const elMix = document.getElementById('catering-mix-qty');
    const elList = document.getElementById('catering-shopping-list');
    const elAllergies = document.getElementById('catering-allergies-alerts');

    if (!elBananas) return;

    // 1. Cálculos de UI principal
    elBananas.textContent = n;
    elBars.textContent = n * 2; // 2 barras por persona
    elMix.textContent = `${n * 50} g`;

    // 2. Lista de Compras Detallada (Kilogramos/Unidades)
    elList.innerHTML = `
        <li><strong>Avena:</strong> ${(n * 40 * 2 / 1000).toFixed(2)} kg (Para ${n * 2} barras)</li>
        <li><strong>Nueces/Almendras:</strong> ${(n * 30 * 2 / 1000).toFixed(2)} kg total</li>
        <li><strong>Papelón:</strong> ${(n * 25 * 2 / 1000).toFixed(2)} kg</li>
        <li><strong>Mix Frutos Secos:</strong> ${(n * 50 / 1000).toFixed(2)} kg (Empaque individual)</li>
        <li><strong>Bananas:</strong> ${n} unidades frescas</li>
        <li><strong>Bolsas Higiénicas:</strong> ${n} unidades</li>
    `;

    // 3. Alertas de Alergias
    const allergies = hikers.filter(h => h.allergies && h.allergies !== 'Ninguna');
    if (allergies.length > 0) {
        elAllergies.innerHTML = `
            <div class="snack-alert" style="background: var(--error-bg); border-left-color: var(--error);">
                <strong>⚠️ ALERTAS ALIMENTARIAS (${allergies.length}):</strong>
                <ul style="margin-top: 5px;">
                    ${allergies.map(h => `<li>${h.name}: ${h.allergies}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        elAllergies.innerHTML = `<div class="snack-alert" style="background: var(--success-bg); border-left-color: var(--success);">✅ No hay restricciones alimentarias reportadas.</div>`;
    }
}

/**
 * PESTAÑA: CARPAS / PERNOCTA
 * Ejecuta el algoritmo de asignación inteligente.
 */
function renderTents(hikers) {
    const container = document.getElementById('tents-allocation-container');
    if (!container) return;

    // Configuración de Flota (Fija según requerimientos)
    const ownTents = [
        { id: 'PROPIA-4P-1', cap: 4, type: 'Propia' },
        { id: 'PROPIA-3P-1', cap: 3, type: 'Propia' },
        { id: 'PROPIA-2P-1', cap: 2, type: 'Propia' }
    ];
    const extTents = [
        { id: 'EXT-2P-1', cap: 2, type: 'Externa' },
        { id: 'EXT-2P-2', cap: 2, type: 'Externa' }
    ];

    // Algoritmo de Distribución
    // 1. Normalizar y agrupar por código de grupo
    const groups = {};
    hikers.forEach(h => {
        const code = (h.group_code || 'INDIVIDUAL').toUpperCase().replace(/\s+/g, '');
        if (!groups[code]) groups[code] = [];
        groups[code].push(h);
    });

    // 2. Separar grupos de individuales
    const multiPersonGroups = Object.values(groups).filter(g => g.length > 1);
    const individuals = Object.values(groups).filter(g => g.length === 1).map(g => g[0]);

    const allocation = [];
    const allTents = [...ownTents, ...extTents].map(t => ({ ...t, occupants: [] }));

    // 3. Asignar Grupos (Priorizando carpas que mejor se ajusten)
    multiPersonGroups.sort((a, b) => b.length - a.length); // Grupos más grandes primero

    multiPersonGroups.forEach(group => {
        // Buscamos carpa disponible con capacidad suficiente
        const tent = allTents.find(t => (t.cap - t.occupants.length) >= group.length);
        if (tent) {
            tent.occupants.push(...group);
        } else {
            // Si no cabe el grupo entero, lo dividimos (aunque idealmente se mantendrían juntos)
            individuals.push(...group);
        }
    });

    // 4. Asignar Individuales por Género
    const males = individuals.filter(h => h.gender === 'M');
    const females = individuals.filter(h => h.gender === 'F');

    [males, females].forEach(genderGroup => {
        genderGroup.forEach(hiker => {
            // Buscar carpa con gente del mismo género o vacía
            const tent = allTents.find(t => {
                const hasSameGender = t.occupants.length > 0 && t.occupants[0].gender === hiker.gender;
                const isEmpty = t.occupants.length === 0;
                return (hasSameGender || isEmpty) && t.occupants.length < t.cap;
            });
            if (tent) tent.occupants.push(hiker);
        });
    });

    // 5. Renderizar UI
    container.innerHTML = allTents.map(t => {
        const pct = (t.occupants.length / t.cap) * 100;
        const statusClass = t.occupants.length === 0 ? 'tent-empty' : (t.occupants.length === t.cap ? 'tent-full' : 'tent-partial');
        
        return `
            <div class="tent-allocation-card ${statusClass}" style="border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.02);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: 700; font-size: 0.9rem;">${t.id} (${t.cap}P)</span>
                    <span class="badge ${t.type === 'Propia' ? 'badge-green' : 'badge-orange'}" style="margin:0; font-size: 0.6rem;">${t.type}</span>
                </div>
                <div class="occupants-list" style="display: flex; flex-direction: column; gap: 5px; min-height: 40px;">
                    ${t.occupants.length > 0 ? t.occupants.map(o => `
                        <div style="font-size: 0.8rem; display: flex; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 4px 8px; border-radius: 4px;">
                            <span>${o.name}</span>
                            <span style="opacity: 0.5;">${o.gender}</span>
                        </div>
                    `).join('') : '<div style="opacity: 0.3; font-size: 0.8rem; text-align: center;">Disponible</div>'}
                </div>
                <div style="margin-top: 10px; font-size: 0.7rem; text-align: right; opacity: 0.6;">
                    Ocupación: ${t.occupants.length} / ${t.cap}
                </div>
            </div>
        `;
    }).join('');

    // Actualizar métrica en cabecera
    const tentsInUse = allTents.filter(t => t.occupants.length > 0).length;
    const hikersConfirmedCount = hikers.length;
    
    const elTentsCount = document.getElementById('stat-tents-in-use');
    if (elTentsCount) elTentsCount.textContent = tentsInUse;
}
