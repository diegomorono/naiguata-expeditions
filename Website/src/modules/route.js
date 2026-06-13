/* ==========================================================================
   DOMINIO DE RUTA - PERFIL DE ELEVACIÓN Y PASOS DEL AVILA
   ========================================================================== */
import { appState } from '../config/state.js';

export const routeSteps = [
    { name: "PGP La Julia", alt: 1140, dist: "0.0 km", desc: "Punto de encuentro y control de Inparques. Registro obligatorio e inicio del ascenso por senderos de bosque nublado.", icon: "🏕️" },
    { name: "Mirador El Edén", alt: 1530, dist: "1.8 km", desc: "Primera gran parada de descanso. Espectacular vista panorámica hacia el Valle de Caracas. Hidratación mandatoria.", icon: "🌅" },
    { name: "Dos Banderas", alt: 1920, dist: "3.2 km", desc: "Punto de quiebre de la vegetación densa. Transición hacia el ecosistema de sub-páramo. Exposición directa al sol.", icon: "🚩" },
    { name: "Fila Maestra", alt: 2200, dist: "5.5 km", desc: "Cresta montañosa divisoria. A un lado Caracas, al otro el Mar Caribe. Caminata sobre roca suelta y ráfagas de viento fuertes.", icon: "⛰️" },
    { name: "Anfiteatro", alt: 2640, dist: "7.8 km", desc: "Zona plana protegida del viento. Campamento base principal para armar las carpas. Preparación para el asalto final a la cumbre.", icon: "⛺" },
    { name: "Pico Naiguatá", alt: 2765, dist: "8.5 km", desc: "La Cumbre Máxima de la Cordillera de la Costa. El icónico hito de la Cruz. Descenso de temperatura por debajo de 10°C.", icon: "✝️" }
];

// Variable global de módulo para almacenar la capa estática en memoria
let staticCacheCanvas = null;

// Escuchamos el evento de datos listos para inicializar la UI
window.addEventListener('app:data-ready', () => {
    initElevationStepper();
    renderStaticGraphic();  // Genera la capa estática una sola vez al montar
    renderDynamicGraphic(); // Dibuja la capa dinámica inicial
});

// ¡AÑADE ESTO! Re-calcula y re-dibuja ambas capas si la pantalla cambia de tamaño o se gira el móvil
window.addEventListener('resize', () => {
    renderStaticGraphic();
    renderDynamicGraphic();
});

export function initElevationStepper() {
    // Delegación de eventos: Escuchamos en el padre, no en cada tarjeta
    const container = document.getElementById('route-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.step-card');
        if (card) {
            const idx = parseInt(card.getAttribute('data-step-index') || '0', 10);
            showRouteDetails(idx);
        }
    });
}

function showRouteDetails(index) {
    if (index < 0 || index >= routeSteps.length) return;

    appState.activeStepIndex = index;
    const step = routeSteps[index];

    // Actualización de clases
    document.querySelectorAll('.step-card').forEach((card, idx) => {
        card.classList.toggle('active', idx === index);
    });

    // Inyección de textos
    const nodeIcon = document.getElementById('route-detail-icon');
    const nodeName = document.getElementById('route-detail-name');
    const nodeAlt = document.getElementById('route-detail-alt');
    const nodeDist = document.getElementById('route-detail-dist');
    const nodeDesc = document.getElementById('route-detail-desc');

    if (nodeIcon) nodeIcon.textContent = step.icon;
    if (nodeName) nodeName.textContent = step.name;
    if (nodeAlt) nodeAlt.textContent = `${step.alt} msnm`;
    if (nodeDist) nodeDist.textContent = step.dist;
    if (nodeDesc) nodeDesc.textContent = step.desc;

    // Ejecuta únicamente el renderizado de la capa dinámica (Punto activo)
    renderDynamicGraphic();
}

/**
 * CAPA ESTÁTICA: Renderiza el gradiente y el path de elevación en un canvas oculto en memoria.
 */
export function renderStaticGraphic() {
    const canvas = document.getElementById('elevation-canvas');
    if (!canvas) return;

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W === 0 || H === 0) return;

    // Sincronizamos la resolución del elemento real
    canvas.width = W;
    canvas.height = H;

    // Inicializamos el canvas en memoria
    staticCacheCanvas = document.createElement('canvas');
    staticCacheCanvas.width = W;
    staticCacheCanvas.height = H;

    const sCtx = staticCacheCanvas.getContext('2d');
    if (!sCtx) return;

    // Lógica del renderizado estático del perfil de montaña
    const gridGrad = sCtx.createLinearGradient(0, 0, 0, H);
    gridGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gridGrad.addColorStop(1, 'rgba(8, 11, 15, 0.9)');

    sCtx.fillStyle = gridGrad;
    sCtx.strokeStyle = '#10b981';
    sCtx.lineWidth = 3;

    sCtx.beginPath();
    sCtx.moveTo(0, H);
    const stepX = W / (routeSteps.length - 1);
    const maxAlt = 3000;

    routeSteps.forEach((s, idx) => {
        const x = idx * stepX;
        const y = H - (s.alt / maxAlt) * (H - 40);
        sCtx.lineTo(x, y);
    });

    sCtx.lineTo(W, H);
    sCtx.closePath();
    sCtx.fill();
    sCtx.stroke();
}

/**
 * CAPA DINÁMICA: Limpia el lienzo principal, estampa el fondo guardado en caché y dibuja el hito activo.
 */
export function renderDynamicGraphic() {
    const canvas = document.getElementById('elevation-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) return;

    // Limpieza total del canvas visible
    ctx.clearRect(0, 0, W, H);

    // Estampado directo de la capa estática pre-renderizada desde memoria (Costo de CPU mínimo)
    if (staticCacheCanvas) {
        ctx.drawImage(staticCacheCanvas, 0, 0);
    }

    // Dibujo exclusivo de la capa dinámica (Punto naranja)
    const stepX = W / (routeSteps.length - 1);
    const maxAlt = 3000;
    const activeIdx = appState.activeStepIndex || 0;
    const actX = activeIdx * stepX;
    const actY = H - (routeSteps[activeIdx].alt / maxAlt) * (H - 40);

    ctx.fillStyle = '#f4a261';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f4a261';
    ctx.beginPath();
    ctx.arc(actX, actY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reseteo inmediato de la sombra para optimizar rendering subsiguiente
}