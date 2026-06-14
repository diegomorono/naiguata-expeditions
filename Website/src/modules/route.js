/* ==========================================================================
   DOMINIO DE RUTA - LA TRAVESÍA INTERACTIVA
   ========================================================================== */

export const routeSteps = [
    { name: "PGP La Julia", alt: 1140, dist: "0.0 km", desc: "Punto de encuentro y control de Inparques. Registro obligatorio e inicio del ascenso por senderos de bosque nublado.", icon: "🏕️", difficulty: "Fácil - Moderado" },
    { name: "Mirador El Edén", alt: 1530, dist: "1.8 km", desc: "Primera gran parada de descanso. Espectacular vista panorámica hacia el Valle de Caracas. Hidratación mandatoria.", icon: "🌅", difficulty: "Exigente" },
    { name: "Dos Banderas", alt: 1920, dist: "3.2 km", desc: "Punto de quiebre de la vegetación densa. Transición hacia el ecosistema de sub-páramo. Exposición directa al sol.", icon: "🚩", difficulty: "Muy Exigente" },
    { name: "Fila Maestra", alt: 2200, dist: "5.5 km", desc: "Cresta montañosa divisoria. A un lado Caracas, al otro el Mar Caribe. Caminata sobre roca suelta y ráfagas de viento fuertes.", icon: "⛰️", difficulty: "Extrema (Desnivel)" },
    { name: "Anfiteatro", alt: 2640, dist: "7.8 km", desc: "Zona plana protegida del viento. Campamento base principal para armar las carpas. Preparación para el asalto final a la cumbre.", icon: "⛺", difficulty: "Fácil - Moderado" },
    { name: "Pico Naiguatá", alt: 2765, dist: "8.5 km", desc: "La Cumbre Máxima de la Cordillera de la Costa. El icónico hito de la Cruz. Descenso de temperatura por debajo de 10°C.", icon: "✝️", difficulty: "Fácil" }
];

export function initElevationStepper() {
    const dots = document.querySelectorAll('.mountain-path-dot');
    
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            // El atributo data-step puede estar en el circle mismo o en el group padre
            const stepStr = e.target.getAttribute('data-step') || e.target.closest('g')?.getAttribute('data-step') || '0';
            const step = parseInt(stepStr, 10);
            showRouteDetails(step);
        });
    });

    // Inicializar con el paso 0
    showRouteDetails(0);
}

export function renderRouteGraphic() {
    console.log("[Route] Montaña SVG UI inicializada.");
}

function getDifficultyColor(diff) {
    if (diff.includes("Extrema")) return "#ef4444"; // Red
    if (diff.includes("Muy Exigente")) return "#f97316"; // Orange
    if (diff.includes("Exigente")) return "#eab308"; // Yellow
    return "#10b981"; // Green (Fácil / Moderado)
}

function showRouteDetails(index) {
    if (index < 0 || index >= routeSteps.length) return;

    const dots = document.querySelectorAll('.mountain-path-dot');
    
    // Actualizar clase activa en el SVG
    dots.forEach((dot) => {
        const step = parseInt(dot.getAttribute('data-step') || dot.closest('g')?.getAttribute('data-step') || '0', 10);
        if (step === index) {
            dot.classList.add('active');
            // Hacer el punto activo más grande o cambiar estilo inline si se requiere
        } else {
            dot.classList.remove('active');
        }
    });

    const step = routeSteps[index];
    const detailsContainer = document.getElementById('active-step-details');
    
    if (detailsContainer && step) {
        const diffColor = getDifficultyColor(step.difficulty);
        
        detailsContainer.innerHTML = `
            <div style="font-size: 2.5rem; margin-bottom: 12px; line-height: 1;">${step.icon}</div>
            <h3 style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-bottom: 10px;">${step.name}</h3>
            
            <div style="display: inline-block; padding: 4px 10px; border-radius: 4px; background: ${diffColor}22; border: 1px solid ${diffColor}; color: ${diffColor}; font-size: 0.85rem; font-weight: 600; margin-bottom: 15px;">
                Dificultad: ${step.difficulty}
            </div>

            <p style="color: #f3f4f6; font-weight: 500; font-size: 1rem; margin-bottom: 12px; display: flex; gap: 15px;">
                <span><strong style="color: #9ca3af;">Altitud:</strong> ${step.alt} msnm</span>
                <span><strong style="color: #9ca3af;">Recorrido:</strong> ${step.dist}</span>
            </p>
            <p style="color: #9ca3af; font-size: 1rem; line-height: 1.6;">${step.desc}</p>
        `;
    }
}