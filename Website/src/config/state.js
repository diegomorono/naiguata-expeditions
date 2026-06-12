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
    inventory: [],
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