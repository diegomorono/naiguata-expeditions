/* ==========================================================================
   DOMINIO DE EQUIPAMIENTO - PLANIFICADOR INTELIGENTE DE MOCHILA
   ========================================================================== */

export function initGearChecklist() {
    const checkboxes = document.querySelectorAll('.gear-checkbox');
    
    checkboxes.forEach(box => {
        box.addEventListener('change', () => {
            // Animación suave de tachado al contenedor visual
            const itemElement = box.closest('.gear-item');
            if (box.checked) {
                itemElement?.classList.add('checked-item');
            } else {
                itemElement?.classList.remove('checked-item');
            }
            updateChecklistProgress();
        });
    });

    // Ejecución inicial para calcular estado base
    updateChecklistProgress();
}

function updateChecklistProgress() {
    const totalItems = document.querySelectorAll('.gear-checkbox').length;
    const checkedItems = document.querySelectorAll('.gear-checkbox:checked').length;
    
    const pct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    
    const bar = document.getElementById('checklist-progress-bar');
    const label = document.getElementById('checklist-progress-text');

    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}% de tu equipo obligatorio listo`;

    // Cambio de colores dinámicos de la barra según nivel de preparación térmica y de seguridad
    if (bar) {
        if (pct < 40) {
            bar.style.backgroundColor = '#ef4444'; // Alerta / Insuficiente
        } else if (pct < 85) {
            bar.style.backgroundColor = '#f59e0b'; // Advertencia / En Progreso
        } else {
            bar.style.backgroundColor = '#10b981'; // Listo para ascenso seguro
        }
    }
}