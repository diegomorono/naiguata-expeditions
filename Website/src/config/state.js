/* ==========================================================================
   ESTADO GLOBAL CENTRALIZADO Y REACTIVO DE LA APLICACIÓN
   ========================================================================== */

/**
 * Fábrica para crear un contenedor de estado reactivo (Store Pattern)
 * Proporcionada por la sugerencia de arquitectura de Claude.
 */
const createStore = (init) => {
    let s = { ...init };
    const listeners = [];
    return {
        get: () => ({ ...s }),
        set: (patch) => {
            s = { ...s, ...patch };
            listeners.forEach(fn => fn(s));
        },
        subscribe: (fn) => {
            listeners.push(fn);
            // Retornamos una función para desuscribirse de forma limpia
            return () => {
                const index = listeners.indexOf(fn);
                if (index > -1) listeners.splice(index, 1);
            };
        }
    };
};

/**
 * Estado inicial de la interfaz pública (Excursionistas)
 */
const initialAppState = {
    activeView: 'client-view',
    bcvRate: 600.00,
    bcvSource: 'default',
    activeStepIndex: 0,
    inventory: [
        { item_id: 'sleeping_bag', item_name: 'Saco de Dormir (Sleeping Bag) - 1 kg', price_usd: 10 },
        { item_id: 'sleeping_pad', item_name: 'Aislante Térmico (Sleeping Pad) - 0.4 kg', price_usd: 5 },
        { item_id: 'thermal_clothing', item_name: 'Ropa de Abrigo Térmica (Suéter + Mono) - 0.8 kg', price_usd: 0 },
        { item_id: 'water_4l', item_name: '4 Litros de Agua (Mínimo) - 4 kg', price_usd: 0 },
        { item_id: 'headlamp', item_name: 'Linterna Frontal / Mano - 0.2 kg', price_usd: 5 },
        { item_id: 'hiking_boots', item_name: 'Calzado de Montaña (Botas/Zapatos de Trail) - 1.2 kg', price_usd: 0 },
        { item_id: 'personal_hygiene', item_name: 'Aseo Personal (Cepillo, Jabón biodegradable, Papel) - 0.3 kg', price_usd: 0 }
    ],
    logisticServices: [],
    cateringCatalog: []
};

/**
 * Estado inicial de la consola interna (Administración)
 */
const initialAdminState = {
    selectedDate: null,
    registrations: [],
    financials: [],
    catalogs: {
        inventory: [],
        services: [],
        catering: []
    }
};

// Exportamos las tiendas reactivas (Stores) en lugar de los objetos mutables planos
export const appStore = createStore(initialAppState);
export const adminStore = createStore(initialAdminState);