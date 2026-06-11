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

export function initElevationStepper() {
    const cards = document.querySelectorAll('.step-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.getAttribute('data-step-index') || '0', 10);
            showRouteDetails(idx);
        });
    });
}

function showRouteDetails(index) {
    if (index < 0 || index >= routeSteps.length) return;
    
    appState.activeStepIndex = index;
    const step = routeSteps[index];

    // Actualización visual de las tarjetas del DOM
    document.querySelectorAll('.step-card').forEach((card, idx) => {
        if (idx === index) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Inyección de textos descriptivos dinámicos
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

    // Repintar el lienzo gráfico si aplica
    renderRouteGraphic();
}

export function renderRouteGraphic() {
    const canvas = document.getElementById('elevation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W;
    canvas.height = H;

    ctx.clearRect(0, 0, W, H);

    // Gradiente ambiental para la montaña
    const gridGrad = ctx.createLinearGradient(0, 0, 0, H);
    gridGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gridGrad.addColorStop(1, 'rgba(8, 11, 15, 0.9)');

    ctx.fillStyle = gridGrad;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, H);

    const stepX = W / (routeSteps.length - 1);
    const maxAlt = 3000; 

    routeSteps.forEach((s, idx) => {
        const x = idx * stepX;
        const y = H - (s.alt / maxAlt) * (H - 40);
        ctx.lineTo(x, y);
    });

    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dibujar indicador del nodo activo en el gráfico
    const activeIdx = appState.activeStepIndex;
    const actX = activeIdx * stepX;
    const actY = H - (routeSteps[activeIdx].alt / maxAlt) * (H - 40);

    ctx.fillStyle = '#f4a261';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f4a261';
    ctx.beginPath();
    ctx.arc(actX, actY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Reset de sombras
    ctx.shadowBlur = 0;
}