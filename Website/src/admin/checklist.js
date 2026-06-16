import { adminStore } from '../config/state.js';
import { getSupabaseClient } from '../config/supabase.js';

const CHECKLIST_STRUCTURE = [
    {
        id: 'block-reserva',
        title: 'BLOQUE 1: Gestión de Reserva',
        tasks: [
            { id: 'conf-hikers', text: 'Confirmar número exacto de personas', actionLabel: 'Ver Totales', action: 'show-totals' },
            { id: 'wa-group', text: 'Crear grupo de WhatsApp exclusivo', actionLabel: 'Vincular Grupo', action: 'link-wa' },
            { id: 'send-pdf', text: 'Enviar PDF de logística al grupo', actionLabel: 'Compartir PDF', action: 'share-pdf' }
        ]
    },
    {
        id: 'block-produccion',
        title: 'BLOQUE 2: Producción y Logística',
        tasks: [
            { id: 'buy-supplies', text: 'Compra de Materia Prima e Insumos', actionLabel: 'Lista Compras', action: 'gen-shopping' },
            { id: 'make-bars', text: 'Cocina y Elaboración de Barras', actionLabel: 'Ficha Técnica', action: 'show-recipe' },
            { id: 'pack-kits', text: 'Empacado y Kits de Marcha', actionLabel: 'Guía Empaque', action: 'show-packing' },
            { id: 'audit-tents', text: 'Auditoría de Carpas y Alojamiento', actionLabel: 'Verificar Distribución', action: 'check-tents' }
        ]
    },
    {
        id: 'block-seguridad',
        title: 'BLOQUE 3: Seguridad y Terreno',
        tasks: [
            { id: 'weather-check', text: 'Confirmación de Alerta Meteorológica', actionLabel: 'Validar Clima', action: 'check-weather' },
            { id: 'first-aid', text: 'Revisar Botiquín', actionLabel: 'Ficha Insumos', action: 'show-meds' },
            { id: 'charge-power', text: 'Cargar Powerbanks y linternas', actionLabel: 'Marcar Cargado', action: 'none' }
        ]
    }
];

export async function renderChecklist() {
    const container = document.getElementById('checklist-blocks-container');
    if (!container) return;

    const selectedDate = adminStore.get().selectedDate;
    const supabase = await getSupabaseClient();

    // 1. Cargar estado desde Supabase
    const { data: savedStatus } = await supabase
        .from('checklist_salidas')
        .select('*')
        .eq('id_fecha', selectedDate);

    const statusMap = {};
    savedStatus?.forEach(s => statusMap[s.task_id] = s.completed);

    // 2. Renderizar Estructura
    container.innerHTML = CHECKLIST_STRUCTURE.map(block => `
        <div class="checklist-block" style="margin-bottom: 25px;">
            <h4 style="color: var(--primary); font-family: 'Outfit', sans-serif; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px;">${block.title}</h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${block.tasks.map(task => `
                    <div class="checklist-row" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.02); padding: 10px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input type="checkbox" class="task-check" data-id="${task.id}" ${statusMap[task.id] ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;">
                            <span style="font-size: 0.9rem; ${statusMap[task.id] ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${task.text}</span>
                        </div>
                        ${task.action !== 'none' ? `<button class="btn-secondary btn-small task-action-btn" data-action="${task.action}">${task.actionLabel}</button>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    setupChecklistListeners();
}

function setupChecklistListeners() {
    // 1. Listener para Checkboxes (Persistencia)
    document.querySelectorAll('.task-check').forEach(chk => {
        chk.onchange = async (e) => {
            const taskId = e.target.getAttribute('data-id');
            const completed = e.target.checked;
            const selectedDate = adminStore.get().selectedDate;
            const supabase = await getSupabaseClient();

            // Upsert en Supabase
            const { error } = await supabase
                .from('checklist_salidas')
                .upsert({ 
                    id_fecha: selectedDate, 
                    task_id: taskId, 
                    completed: completed 
                }, { onConflict: 'id_fecha, task_id' });

            if (error) console.error("Error guardando checklist:", error);
            else renderChecklist(); // Re-renderizar para aplicar tachado
        };
    });

    // 2. Listener para Acciones Automatizadas
    document.querySelectorAll('.task-action-btn').forEach(btn => {
        btn.onclick = () => handleAutomatedAction(btn.getAttribute('data-action'));
    });
}

function handleAutomatedAction(action) {
    const registrations = adminStore.get().registrations || [];
    const confirmed = registrations.filter(r => r.status.includes('Confirmado'));
    const n = confirmed.length;

    switch (action) {
        case 'show-totals':
            alert(`RESUMEN DE SALIDA:\n\n- Senderistas Confirmados: ${n}\n- Carpas Requeridas: ${Math.ceil(n/2)} aprox.\n- Raciones de Catering: ${n}`);
            break;
            
        case 'link-wa':
            const waText = "¡Hola! 🏔️ Estamos preparando todo para nuestra expedición al Pico Naiguatá...";
            navigator.clipboard.writeText(waText);
            window.open("https://web.whatsapp.com/", "_blank");
            alert("✅ Texto de bienvenida copiado al portapapeles. Abre WhatsApp Web para crear el grupo.");
            break;

        case 'share-pdf':
            const pdfUrl = "https://drive.google.com/file/d/1Y-H51Vgvbn6iH-Ao0rzwrs_WLf9BxZP6/view?usp=sharing";
            window.open(`https://wa.me/?text=${encodeURIComponent("Aquí les comparto el PDF de logística: " + pdfUrl)}`, "_blank");
            break;

        case 'gen-shopping':
            const shoppingList = `LISTA DE COMPRAS (${n} personas):\n- Avena: ${n * 80}g\n- Nueces: ${n * 30}g\n- Papelón: ${n * 50}g\n- Mix Frutos: ${n * 50}g\n- Bananas: ${n} uds.`;
            navigator.clipboard.writeText(shoppingList);
            alert("🛒 Lista de compras generada y copiada al portapapeles.");
            break;

        case 'show-recipe':
            alert("RECETA BASE:\n1. Fundir papelón.\n2. Mezclar con avena y frutos secos.\n3. Compactar en bandeja.\n4. Cortar en barras una vez frío.");
            break;

        case 'check-weather':
            window.open("https://www.meteoblue.com/en/weather/week/pico-naiguat%C3%A1_venezuela_3631611", "_blank");
            window.open("https://www.mountain-forecast.com/peaks/Pico-Naiguata/forecasts/2765", "_blank");
            break;

        default:
            console.warn("Acción no implementada:", action);
    }
}
