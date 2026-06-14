/* ==========================================================================
   DOMINIO DE RUTA - PERFIL DE ELEVACIÓN Y PASOS DEL AVILA
   ========================================================================== */

export const routeSteps = [
    { name: "PGP La Julia", alt: 1140, dist: "0.0 km", desc: "Punto de encuentro y control de Inparques. Registro obligatorio e inicio del ascenso por senderos de bosque nublado.", icon: "🏕️" },
    { name: "Mirador El Edén", alt: 1530, dist: "1.8 km", desc: "Primera gran parada de descanso. Espectacular vista panorámica hacia el Valle de Caracas. Hidratación mandatoria.", icon: "🌅" },
    { name: "Dos Banderas", alt: 1920, dist: "3.2 km", desc: "Punto de quiebre de la vegetación densa. Transición hacia el ecosistema de sub-páramo. Exposición directa al sol.", icon: "🚩" },
    { name: "Fila Maestra", alt: 2200, dist: "5.5 km", desc: "Cresta montañosa divisoria. A un lado Caracas, al otro el Mar Caribe. Caminata sobre roca suelta y ráfagas de viento fuertes.", icon: "⛰️" },
    { name: "Anfiteatro", alt: 2640, dist: "7.8 km", desc: "Zona plana protegida del viento. Campamento base principal para armar las carpas. Preparación para el asalto final a la cumbre.", icon: "⛺" },
    { name: "Pico Naiguatá", alt: 2765, dist: "8.5 km", desc: "La Cumbre Máxima de la Cordillera de la Costa. El icónico hito de la Cruz. Descenso de temperatura por debajo de 10°C.", icon: "✝️" }
];

export function initElevationStepper() {
    const navButtons = document.querySelectorAll('.step-nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const step = parseInt(e.target.getAttribute('data-step') || '0', 10);
            showRouteDetails(step);
        });
    });

    // Inicializar con el paso 0
    showRouteDetails(0);
}

export function renderRouteGraphic() {
    // Función de soporte solicitada por main.js (no-op aquí porque usamos SVG estático de CSS/HTML)
    console.log("[Route] SVG UI renderizado.");
}

function showRouteDetails(index) {
    if (index < 0 || index >= routeSteps.length) return;

    const navButtons = document.querySelectorAll('.step-nav-btn');
    const dots = document.querySelectorAll('.map-dot');
    
    // Actualizar estados visuales
    navButtons.forEach((btn, idx) => {
        if (idx === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    dots.forEach((dot, idx) => {
        if (idx === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });

    const step = routeSteps[index];
    const detailsContainer = document.getElementById('active-step-details');
    
    if (detailsContainer && step) {
        detailsContainer.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 12px;">${step.icon}</div>
            <h3 style="font-size: 1.4rem; font-weight: 700; color: #fff; margin-bottom: 8px;">${step.name}</h3>
            <p style="color: #10b981; font-weight: 500; font-size: 0.95rem; margin-bottom: 12px;">
                <strong>Altitud:</strong> ${step.alt} msnm <span style="color: #4b5563;">|</span> <strong>Recorrido:</strong> ${step.dist}
            </p>
            <p style="color: #9ca3af; font-size: 0.95rem; line-height: 1.5;">${step.desc}</p>
        `;
    }
}