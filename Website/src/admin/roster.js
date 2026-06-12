import { adminState } from '../config/state.js';

export function renderRoster() {
    const container = document.getElementById('roster-container');
    if (!container) return;

    // Limpiamos el contenedor de forma segura antes de renderizar
    container.innerHTML = '';

    // Iteramos y creamos los nodos de forma segura usando textContent
    adminState.registrations.forEach(r => {
        const row = document.createElement('div');
        // CORRECCIÓN: Ahora evalúa la columna correcta 'medical' de tu base de datos
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

        // Inyectamos la fila segura en el contenedor principal
        container.appendChild(row);
    });
}