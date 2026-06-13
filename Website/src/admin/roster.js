import { adminStore } from '../config/state.js';
import { DOM_IDS } from '../config/dom-ids.js';

export function renderRoster() {
    // Vinculado al ID correcto del contrato para corregir el desfase con el HTML
    const container = document.getElementById(DOM_IDS.roster.container);
    if (!container) return;

    // Limpiamos el contenedor de forma segura antes de renderizar
    container.innerHTML = '';

    // Extraemos las inscripciones de forma inmutable desde el Store administrativo
    const registrations = adminStore.get().registrations || [];

    // Iteramos y creamos los nodos de forma segura usando textContent
    registrations.forEach(r => {
        const row = document.createElement('div');
        // Evalúa la columna correcta 'medical' de la base de datos
        row.className = `hiker-row ${r.medical ? 'has-alert' : ''}`;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = r.name;

        const whatsappSpan = document.createElement('span');
        whatsappSpan.textContent = r.whatsapp;

        const statusSpan = document.createElement('span');
        statusSpan.textContent = r.status;

        // Armamos la estructura de la fila
        row.appendChild(nameSpan);
        row.appendChild(whatsappSpan);
        row.appendChild(statusSpan);

        // Inyectamos la fila segura en el contenedor principal corregido
        container.appendChild(row);
    });
}