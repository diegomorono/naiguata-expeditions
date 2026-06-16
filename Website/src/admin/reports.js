import { adminStore } from '../config/state.js';

export function setupReportButtons() {
    document.getElementById('btn-master-report')?.addEventListener('click', generateMasterReport);
    document.getElementById('btn-inparques-request')?.addEventListener('click', generateInparquesRequest);
    document.getElementById('btn-share-master')?.addEventListener('click', shareMasterReport);
}

/**
 * REPORTE MAESTRO: Consolidado total de la expedición
 */
function generateMasterReport() {
    const state = adminStore.get();
    const date = state.selectedDate;
    const hikers = state.registrations || [];
    const confirmed = hikers.filter(h => h.status.includes('Confirmado'));
    
    if (confirmed.length === 0) {
        alert("No hay participantes confirmados para generar el reporte.");
        return;
    }

    // Crear contenido HTML para impresión
    const printWindow = window.open('', '_blank');
    const html = `
        <html>
        <head>
            <title>Reporte Maestro - ${date}</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #333; }
                h1 { color: #10b981; border-bottom: 2px solid #eee; padding-bottom: 10px; }
                h2 { margin-top: 30px; background: #f7fafc; padding: 10px; font-size: 1.2rem; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 0.9rem; }
                th { background: #edf2f7; }
                .alert { color: red; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>REPORTE DE EXPEDICIÓN: ${date}</h1>
            
            <h2>1. ROSTER DE PARTICIPANTES (${confirmed.length})</h2>
            <table>
                <thead>
                    <tr><th>Nombre</th><th>WhatsApp</th><th>Salud</th><th>Grupo</th></tr>
                </thead>
                <tbody>
                    ${confirmed.map(h => `
                        <tr>
                            <td>${h.name}</td>
                            <td>${h.whatsapp}</td>
                            <td class="${h.medical !== 'Ninguna.' ? 'alert' : ''}">${h.medical || 'Ninguna'}</td>
                            <td>${h.group_code}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <h2>2. CONSOLIDADO DE LOGÍSTICA</h2>
            <ul>
                <li><strong>Catering:</strong> ${confirmed.length} raciones completas.</li>
                <li><strong>Carpas:</strong> ${Math.ceil(confirmed.length / 2)} unidades estimadas.</li>
            </ul>

            <h2>3. RESUMEN FINANCIERO ESTIMADO</h2>
            <p>Total Recaudado (Confirmed): $${confirmed.reduce((acc, h) => acc + parseFloat(h.total_usd || 0), 0).toFixed(2)} USD</p>

            <script>window.print();</script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
}

/**
 * SOLICITUD INPARQUES: Formato oficial automatizado
 */
function generateInparquesRequest() {
    const date = adminStore.get().selectedDate;
    const hikers = adminStore.get().registrations.filter(h => h.status.includes('Confirmado'));

    if (hikers.length === 0) {
        alert("Se requiere al menos un participante confirmado para la solicitud.");
        return;
    }

    // 1. Abrir correo pre-configurado
    const subject = encodeURIComponent(`Solicitud de Permiso para Actividad Recreativa - ${date} - Expediciones Naiguatá`);
    const body = encodeURIComponent(`Estimados señores de INPARQUES,\n\nAdjunto envío la documentación legal requerida para la expedición programada el día ${date} al Pico Naiguatá.\n\nParticipantes: ${hikers.length}\nResponsable: Diego Moroño\n\nSaludos.`);
    
    window.location.href = `mailto:dgs.parquesrecreacion@gmail.com,dgparques.nacionales@gmail.com?subject=${subject}&body=${body}`;

    alert("📩 Se ha abierto tu cliente de correo. El archivo de solicitud se está generando para tu descarga manual...");
}

/**
 * COMPARTIR REPORTE (Web Share API)
 */
async function shareMasterReport() {
    const date = adminStore.get().selectedDate;
    const text = `Reporte de Expedición Naiguatá (${date})\nConsultar en: ${window.location.href}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: "Reporte Naiguatá",
                text: text,
                url: window.location.href
            });
        } catch (e) {
            console.log("Compartir cancelado");
        }
    } else {
        navigator.clipboard.writeText(text);
        alert("✅ Enlace de reporte copiado al portapapeles.");
    }
}
