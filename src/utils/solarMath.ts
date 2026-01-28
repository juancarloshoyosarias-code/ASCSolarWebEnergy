export const PLANT_CONSTANTS = {
    HPS_OBJ: 4.0, // Horas Pico Solar Objetivo (kWh/m2/día)
    PR_OBJ: 0.9,  // Performance Ratio Objetivo (90%)
};

/**
 * Calcula la meta de energía esperada (Target)
 * Fórmula: kWp * HPS_OBJ * PR_OBJ * Días
 */
export function calculateTarget(kwp: number, days: number): number {
    return kwp * PLANT_CONSTANTS.HPS_OBJ * PLANT_CONSTANTS.PR_OBJ * days;
}

/**
 * Calcula el HPS Real (Horas Pico Solar equivalentes)
 * Fórmula: Generación / (kWp * PR_OBJ * Días)
 * Nota: Usa el PR Objetivo para estimar el recurso solar recibido si no hay piranómetro.
 */
export function calculateHPS(generation: number, kwp: number, days: number): number {
    if (kwp === 0 || days === 0) return 0;
    return generation / (kwp * PLANT_CONSTANTS.PR_OBJ * days);
}

/**
 * Calcula el PR Real (Performance Ratio)
 * Fórmula: (Generación / (kWp * HPS_OBJ * Días)) * 100
 * Nota: Asume HPS estándar de 4.0 si no hay dato real de irradiación.
 */
export function calculatePR(generation: number, kwp: number, days: number): number {
    if (kwp === 0 || days === 0) return 0;
    const theoreticalMax = kwp * PLANT_CONSTANTS.HPS_OBJ * days;
    return (generation / theoreticalMax) * 100;
}

/**
 * Calcula el cumplimiento (%)
 * Fórmula: (Generación / Meta) * 100
 */
export function calculateCompliance(generation: number, target: number): number {
    if (target === 0) return 0;
    return (generation / target) * 100;
}

/**
 * Formatea números a estilo CO (miles y decimales)
 */
export function formatValue(val: number, decimals: number = 1): string {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(val);
}
