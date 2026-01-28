import { Plant, DashboardSummary, Invoice, GenerationData, FinancialData, AlertTypeConfig, Alert, AlertCategory } from '../types';
import { calculateTarget, calculateHPS, calculatePR, PLANT_CONSTANTS } from '../utils/solarMath';

// Helper para calcular métricas de diciembre (31 días)
function getMetrics(kwp: number, genMonth: number) {
  const days = 31;
  return {
    target: calculateTarget(kwp, days),
    hsp: calculateHPS(genMonth, kwp, days),
    pr: calculatePR(genMonth, kwp, days)
  };
}

// Usuario por defecto
export const mockUser = {
  id: '1',
  name: 'Juan Carlos Hoyos',
  email: 'jc@ascenergy.co',
  company: 'ASC Energy'
};

// ============================================
// DATOS REALES DE 6 PLANTAS (de dim.fs_plants)
// Fecha referencia: 25 Enero 2026
// ============================================
export const mockPlants: Plant[] = [
  {
    id: '1',
    name: 'Cabañita',
    location: 'Valle del Cauca',
    capacity: 116,
    installationDate: '2024-03-01', // Marzo 2024 - Más reciente
    operationDays: 665, // ~22 meses
    status: 'active',
    owner: 'ASC Energy',
    // Generación HOY (Resumen del Día)
    generationToday: 544.9,
    targetToday: 417.6,
    // Generación MES (Acumulado Mes MTD - Dic 2025)
    generationMonth: 14501.3,
    targetMonth: 12945.6,
    // Generación AÑO (Acumulado YTD) - Asumimos igual a Dic por ser cierre o dato disponible
    generationYear: 10260, // Dejar pendiente o actualizar si hay dato YTD
    targetYear: 10022,
    // Autoconsumo/Exportación/Importación (Datos Hoy)
    selfConsumptionToday: 410.7,
    selfConsumptionPercent: 86,
    importedToday: 65.6,
    importedPercent: 14,
    consumptionToday: 476.3,
    exportedToday: 134.2,
    exportedPercent: 25,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 308.4,
    exportedMonth: 12207.4,
    importedMonth: 83.1,
    // Performance
    efficiency: 112, // 112.0% Cumplimiento
    hsp: 4.48,
    disponibilidad: 100,
    // Financiero
    // Financiero: Cabañita (Inv $402M | Ben $211.2M | Ahorro $95.3M | Saldo $95.5M)
    investment: 402000000,
    deduccionRenta: 201000000, // 50% Inv
    depreciacionAcelerada: 10200000, // Resto para llegar a 211.2M
    revenueTotal: 115000000,
    savingsTotal: 95300000,
    saldoInversion: 95500000, // Pendiente
    paybackYears: 3.2,
    paybackYearsNoBenefits: 5.5,
    roi: 24.0, // 100 - 76% recuperado
    saldoAcumuladoCelsia: 5379874,
    // Equipos
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-60KTL-M0', quantity: 2 }],
      panels: [{ model: 'Jinko Solar Tiger Neo 585W', quantity: 200 }],
      comms: ['SmartLogger 3000A']
    }
  },
  {
    id: '2',
    name: 'Casa Trejo',
    location: 'Valle del Cauca',
    capacity: 9.77, // 9.77 kWp real según reporte
    installationDate: '2023-11-01', // Noviembre 2023
    operationDays: 817, // ~27 meses
    status: 'active',
    owner: 'ASC Energy',
    generationToday: 43.3,
    targetToday: 35.2,
    generationMonth: 1073.1,
    targetMonth: 1089.8,
    generationYear: 781,
    targetYear: 844,
    selfConsumptionToday: 11.5,
    selfConsumptionPercent: 49,
    importedToday: 12.0,
    importedPercent: 51,
    consumptionToday: 23.5,
    exportedToday: 31.7,
    exportedPercent: 73,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 371.9,
    exportedMonth: 701.2,
    importedMonth: 359.6,
    // Performance
    efficiency: 98.5, // 98.5%
    hsp: 3.94,
    disponibilidad: 100,
    // Financiero: Casa Trejo (Inv $35M | Ben $18.4M | Ahorro $6.5M | Saldo $10.1M)
    investment: 35000000,
    deduccionRenta: 17500000, // 50% Inv
    depreciacionAcelerada: 900000, // Resto para llegar a 18.4M
    revenueTotal: 12500000,
    savingsTotal: 6500000,
    saldoInversion: 10100000,
    paybackYears: 4.8,
    paybackYearsNoBenefits: 7.2,
    roi: 29.0, // 100 - 71% recuperado
    saldoAcumuladoCelsia: 2197770,
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-10KTL-M1', quantity: 1 }],
      panels: [{ model: 'Trina Solar Vertex S 500W', quantity: 20 }],
      comms: ['WLAN-FE Dongle']
    }
  },
  {
    id: '3',
    name: 'Maracaibo',
    location: 'Valle del Cauca',
    capacity: 116,
    installationDate: '2023-12-01', // Diciembre 2023
    operationDays: 787, // ~26 meses
    status: 'active',
    owner: 'ASC Energy',
    generationToday: 500.1,
    targetToday: 417.6,
    generationMonth: 13875.7,
    targetMonth: 12945.6,
    generationYear: 9661,
    targetYear: 10022,
    selfConsumptionToday: 245.1,
    selfConsumptionPercent: 87,
    importedToday: 36.1,
    importedPercent: 13,
    consumptionToday: 281.1,
    exportedToday: 255.0,
    exportedPercent: 51,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 1756.0,
    exportedMonth: 12119.7,
    importedMonth: 601.4,
    // Performance
    efficiency: 107.2, // 107.2%
    hsp: 4.29,
    disponibilidad: 100,
    // Financiero: Maracaibo (Inv $402M | Ben $211.2M | Ahorro $124.6M | Saldo $66.2M)
    investment: 402000000,
    deduccionRenta: 201000000, // 50% Inv
    depreciacionAcelerada: 10200000, // Resto
    revenueTotal: 145000000,
    savingsTotal: 124600000,
    saldoInversion: 66200000,
    paybackYears: 3.0,
    paybackYearsNoBenefits: 5.1,
    roi: 16.0, // 100 - 84%
    saldoAcumuladoCelsia: 8307417,
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-100KTL', quantity: 1 }],
      panels: [{ model: 'Jinko 580W', quantity: 200 }],
      comms: ['SmartLogger 3000A']
    }
  },
  {
    id: '4',
    name: 'Porvenir',
    location: 'Valle del Cauca',
    capacity: 143,
    installationDate: '2023-06-01', // Junio 2023
    operationDays: 969, // ~32 meses
    status: 'active',
    owner: 'ASC Energy',
    generationToday: 611.6,
    targetToday: 514.8,
    generationMonth: 15561.8,
    targetMonth: 15958.8,
    generationYear: 11349,
    targetYear: 12355,
    selfConsumptionToday: 466.3,
    selfConsumptionPercent: 84,
    importedToday: 91.9,
    importedPercent: 17,
    consumptionToday: 558.2,
    exportedToday: 145.3,
    exportedPercent: 24,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 2802.1,
    exportedMonth: 12759.7,
    importedMonth: 1245.3,
    // Performance
    efficiency: 97.5, // 97.5%
    hsp: 3.90,
    disponibilidad: 100,
    // Financiero: Porvenir (Inv $490M | Ben $265.4M | Ahorro $157.4M | Saldo $67.2M)
    investment: 490000000,
    deduccionRenta: 245000000, // 50% Inv
    depreciacionAcelerada: 20400000, // Resto
    revenueTotal: 185000000,
    savingsTotal: 157400000,
    saldoInversion: 67200000,
    paybackYears: 2.8,
    paybackYearsNoBenefits: 4.9,
    roi: 14.0, // 100 - 86%
    saldoAcumuladoCelsia: 10305000,
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-100KTL', quantity: 2 }],
      panels: [{ model: 'Canadian Solar 600W', quantity: 238 }],
      comms: ['SmartLogger 3000A']
    }
  },
  {
    id: '5',
    name: 'Pozo 1',
    location: 'Valle del Cauca',
    capacity: 119.56, // 119.56 kWp según reporte
    installationDate: '2023-01-01', // Enero 2023 - Más antigua
    operationDays: 1121, // ~37 meses
    status: 'active',
    owner: 'ASC Energy',
    generationToday: 626.5,
    targetToday: 430.4,
    generationMonth: 15826.4,
    targetMonth: 13342.9,
    generationYear: 11471,
    targetYear: 10330,
    selfConsumptionToday: 521.9,
    selfConsumptionPercent: 78,
    importedToday: 147.1,
    importedPercent: 22,
    consumptionToday: 668.9,
    exportedToday: 104.7,
    exportedPercent: 17,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 3118.8,
    exportedMonth: 12707.6,
    importedMonth: 2540.5,
    // Performance
    efficiency: 118.6, // 118.6%
    hsp: 4.74,
    disponibilidad: 100,
    // Financiero: Pozo 1 (Inv $470M | Ben $246.6M | Ahorro $182.3M | Saldo $41.1M)
    investment: 470000000,
    deduccionRenta: 235000000, // 50% Inv
    depreciacionAcelerada: 11600000, // Resto
    revenueTotal: 210000000,
    savingsTotal: 182300000,
    saldoInversion: 41100000,
    paybackYears: 2.6,
    paybackYearsNoBenefits: 4.5,
    roi: 9.0, // 100 - 91%
    saldoAcumuladoCelsia: 6100000,
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-60KTL', quantity: 2 }],
      panels: [{ model: 'Jinko 585W', quantity: 205 }],
      comms: ['SmartLogger 3000A']
    }
  },
  {
    id: '6',
    name: 'Pozo 2',
    location: 'Valle del Cauca',
    capacity: 116,
    installationDate: '2023-08-01', // Agosto 2023
    operationDays: 908, // ~30 meses
    status: 'active', // STATUS CORREGIDO A ACTIVO (Verde)
    owner: 'ASC Energy',
    generationToday: 602.8,
    targetToday: 417.6,
    generationMonth: 14559.6,
    targetMonth: 12945.6,
    generationYear: 10453,
    targetYear: 10022,
    selfConsumptionToday: 123.2,
    selfConsumptionPercent: 68,
    importedToday: 57.2,
    importedPercent: 32,
    consumptionToday: 180.4,
    exportedToday: 479.6,
    exportedPercent: 80,
    // Datos Mes (Reporte Diciembre)
    selfConsumptionMonth: 2285.3,
    exportedMonth: 12274.3,
    importedMonth: 1252.4,
    // Performance
    efficiency: 112.5, // 112.5%
    hsp: 4.50,
    disponibilidad: 100,
    // Financiero: Pozo 2 (Inv $415M | Ben $217.9M | Ahorro $159.3M | Saldo $37.8M)
    investment: 415000000,
    deduccionRenta: 207500000, // 50% Inv
    depreciacionAcelerada: 10400000, // Resto
    revenueTotal: 180500000,
    savingsTotal: 159300000,
    saldoInversion: 37800000,
    paybackYears: 2.5,
    paybackYearsNoBenefits: 4.2,
    roi: 9.0, // 100 - 91%
    saldoAcumuladoCelsia: 3500000,
    equipment: {
      inverters: [{ model: 'Huawei SUN2000-100KTL', quantity: 1 }],
      panels: [{ model: 'Jinko 580W', quantity: 200 }],
      comms: ['Dongle WLAN-FE']
    }
  }
];

// ============================================
// DATOS DE GENERACIÓN HISTÓRICA (Multianual)
// ============================================
export const historicalGeneration = [
  { month: 1, monthName: 'Ene', year2023: 11500, year2024: 58000, year2025: 71000, year2026: 0 },
  { month: 2, monthName: 'Feb', year2023: 10800, year2024: 61000, year2025: 68500, year2026: 0 },
  { month: 3, monthName: 'Mar', year2023: 12200, year2024: 63000, year2025: 72100, year2026: 0 },
  { month: 4, monthName: 'Abr', year2023: 11900, year2024: 60500, year2025: 69800, year2026: 0 },
  { month: 5, monthName: 'May', year2023: 12500, year2024: 64200, year2025: 73100, year2026: 0 },
  { month: 6, monthName: 'Jun', year2023: 22000, year2024: 62800, year2025: 70500, year2026: 0 },
  { month: 7, monthName: 'Jul', year2023: 23500, year2024: 65000, year2025: 74200, year2026: 0 },
  { month: 8, monthName: 'Ago', year2023: 34000, year2024: 66600, year2025: 75100, year2026: 0 },
  { month: 9, monthName: 'Sep', year2023: 32500, year2024: 64900, year2025: 72800, year2026: 0 },
  { month: 10, monthName: 'Oct', year2023: 35000, year2024: 67200, year2025: 74400, year2026: 0 },
  { month: 11, monthName: 'Nov', year2023: 36500, year2024: 65800, year2025: 73200, year2026: 0 },
  { month: 12, monthName: 'Dic', year2023: 45000, year2024: 68500, year2025: 75398, year2026: 0 },
];

// Datos de generación diaria (últimos 30 días para gráficas detalladas)
export const mockGenerationData: GenerationData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseGen = 2500 + Math.random() * 500;
  return {
    date: date.toISOString().split('T')[0],
    generation: Math.round(baseGen),
    target: 2700,
    selfConsumption: Math.round(baseGen * 0.65),
    exported: Math.round(baseGen * 0.35),
    imported: Math.round(200 + Math.random() * 150)
  };
});

// ============================================
// DATOS FINANCIEROS MENSUALES
// ============================================
export const mockFinancialData = [
  { month: 'Mar 24', selfConsumptionValue: 12500000, exportedValue: 8200000, accumulated: 20700000 },
  { month: 'Abr 24', selfConsumptionValue: 14200000, exportedValue: 9100000, accumulated: 44000000 },
  { month: 'May 24', selfConsumptionValue: 15100000, exportedValue: 9800000, accumulated: 68900000 },
  { month: 'Jun 24', selfConsumptionValue: 14800000, exportedValue: 10200000, accumulated: 93900000 },
  { month: 'Jul 24', selfConsumptionValue: 16200000, exportedValue: 11500000, accumulated: 121600000 },
  { month: 'Ago 24', selfConsumptionValue: 17500000, exportedValue: 12800000, accumulated: 151900000 },
  { month: 'Sep 24', selfConsumptionValue: 16800000, exportedValue: 11900000, accumulated: 180600000 },
  { month: 'Oct 24', selfConsumptionValue: 18200000, exportedValue: 13500000, accumulated: 212300000 },
  { month: 'Nov 24', selfConsumptionValue: 17900000, exportedValue: 12800000, accumulated: 243000000 },
  { month: 'Dic 24', selfConsumptionValue: 19500000, exportedValue: 14200000, accumulated: 276700000 },
  { month: 'Ene 25', selfConsumptionValue: 18800000, exportedValue: 13900000, accumulated: 309400000 },
];

// DATOS CONSOLIDADOS PARA DASHBOARD
// ============================================
export const dashboardSummary: DashboardSummary = {
  totalPlants: mockPlants.length,
  activePlants: mockPlants.filter(p => p.status === 'active').length,
  totalCapacity: mockPlants.reduce((sum, p) => sum + p.capacity, 0),
  totalInvestment: mockPlants.reduce((sum, p) => sum + p.investment, 0),
  totalDeduccionRenta: mockPlants.reduce((sum, p) => sum + p.deduccionRenta, 0),
  totalDepreciacion: mockPlants.reduce((sum, p) => sum + p.depreciacionAcelerada, 0),
  totalSavings: mockPlants.reduce((sum, p) => sum + p.savingsTotal, 0), // $2.0B acumulado
  totalSaldoPendiente: mockPlants.reduce((sum, p) => sum + Math.abs(p.saldoInversion), 0),
  totalGenerationMonth: 75397.8, // Valor real del reporte Dic 2025
  monthlyRevenue: 31250000, // Ingreso mensual estimado ($31.2M)
  totalRevenueHistorical: 659400000, // Corte Real Nov 2025 ($659.4M)
  totalGenerationHistorical: 1350000, // ~1.35 GWh Estimado Histórico
  avgPayback: mockPlants.reduce((sum, p) => sum + p.paybackYears, 0) / mockPlants.length,
  avgPaybackNoBenefits: mockPlants.reduce((sum, p) => sum + p.paybackYearsNoBenefits, 0) / mockPlants.length,
  avgROI: mockPlants.reduce((sum, p) => sum + p.roi, 0) / mockPlants.length,
};

// ============================================
// DATOS DE FACTURAS (Corte Real: Noviembre 2025)
// ============================================
export const mockFacturas = [
  // Noviembre 2025 - Cabañita
  {
    id: 1,
    plantId: '1',
    plant: 'Cabañita',
    codigo: '1056060000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    // Consumos
    consumoMes: 26500,
    consumoImportadoKwh: 5100,
    consumoImportadoPrecio: 892.45,
    consumoImportadoTotal: 4551495,
    // Créditos (Autogenerador)
    creditoEnergiaKwh: 9800,
    creditoEnergiaPrecio: 485.20,
    creditoEnergiaTotal: -4754960,
    // Valoración Horaria
    valoracionHorariaKwh: 2340,
    valoracionHorariaPrecio: 125.80,
    valoracionHorariaTotal: 294372,
    // Excedentes
    totalExcedentesKwh: 4700,
    // Tarifas Unitarias
    tarifaAplicada: 892.45,
    generacion: 485.20,
    comercializacion: 98.50,
    transmision: 62.30,
    restricciones: 45.80,
    distribucion: 158.65,
    perdidas: 42.00,
    // Totales
    totalCelsia: 5520000,
    otrasEntidades: 285000,
    alumbrado: 185000,
    aseo: 75000,
    otros: 25000,
    saldoAnterior: -1250000,
    saldoAcumulado: 5379874,
    totalPagar: 4555000,
    // Campos calculados (comparación)
    sinSolar: 11800000,
    conSolar: 5520000,
    ahorro: 6280000
  },
  // Noviembre 2025 - Maracaibo
  {
    id: 2,
    plantId: '3',
    plant: 'Maracaibo',
    codigo: '1165450000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    consumoMes: 30100,
    consumoImportadoKwh: 8200,
    consumoImportadoPrecio: 957.32,
    consumoImportadoTotal: 7850024,
    creditoEnergiaKwh: 8500,
    creditoEnergiaPrecio: 510.25,
    creditoEnergiaTotal: -4337125,
    valoracionHorariaKwh: 1850,
    valoracionHorariaPrecio: 132.50,
    valoracionHorariaTotal: 245125,
    totalExcedentesKwh: 3200,
    tarifaAplicada: 957.32,
    generacion: 510.25,
    comercializacion: 102.80,
    transmision: 65.50,
    restricciones: 48.20,
    distribucion: 185.57,
    perdidas: 45.00,
    totalCelsia: 7850000,
    otrasEntidades: 320000,
    alumbrado: 210000,
    aseo: 85000,
    otros: 25000,
    saldoAnterior: -890000,
    saldoAcumulado: 8307417,
    totalPagar: 7280000,
    sinSolar: 13500000,
    conSolar: 7850000,
    ahorro: 5650000
  },
  // Noviembre 2025 - Porvenir
  {
    id: 3,
    plantId: '4',
    plant: 'Porvenir',
    codigo: '4806050000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    consumoMes: 21500,
    consumoImportadoKwh: 2900,
    consumoImportadoPrecio: 982.76,
    consumoImportadoTotal: 2850004,
    creditoEnergiaKwh: 13200,
    creditoEnergiaPrecio: 498.50,
    creditoEnergiaTotal: -6580200,
    valoracionHorariaKwh: 3100,
    valoracionHorariaPrecio: 128.40,
    valoracionHorariaTotal: 398040,
    totalExcedentesKwh: 10300,
    tarifaAplicada: 982.76,
    generacion: 498.50,
    comercializacion: 95.20,
    transmision: 58.90,
    restricciones: 42.80,
    distribucion: 245.36,
    perdidas: 42.00,
    totalCelsia: 2850000,
    otrasEntidades: 195000,
    alumbrado: 125000,
    aseo: 55000,
    otros: 15000,
    saldoAnterior: -2150000,
    saldoAcumulado: 10305000,
    totalPagar: 895000,
    sinSolar: 9800000,
    conSolar: 2850000,
    ahorro: 6950000
  },
  // Noviembre 2025 - Pozo 1
  {
    id: 4,
    plantId: '5',
    plant: 'Pozo 1',
    codigo: '6497410000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    consumoMes: 33800,
    consumoImportadoKwh: 11900,
    consumoImportadoPrecio: 766.39,
    consumoImportadoTotal: 9120041,
    creditoEnergiaKwh: 7200,
    creditoEnergiaPrecio: 502.80,
    creditoEnergiaTotal: -3620160,
    valoracionHorariaKwh: 2850,
    valoracionHorariaPrecio: 118.90,
    valoracionHorariaTotal: 338865,
    totalExcedentesKwh: 4350,
    tarifaAplicada: 766.39,
    generacion: 502.80,
    comercializacion: 88.50,
    transmision: 52.40,
    restricciones: 38.90,
    distribucion: 42.79,
    perdidas: 41.00,
    totalCelsia: 9120000,
    otrasEntidades: 410000,
    alumbrado: 265000,
    aseo: 110000,
    otros: 35000,
    saldoAnterior: -1580000,
    saldoAcumulado: 6100000,
    totalPagar: 7950000,
    sinSolar: 14900000,
    conSolar: 9120000,
    ahorro: 5780000
  },
  // Noviembre 2025 - Pozo 2
  {
    id: 5,
    plantId: '6',
    plant: 'Pozo 2',
    codigo: '5497410000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    consumoMes: 32500,
    consumoImportadoKwh: 12800,
    consumoImportadoPrecio: 756.25,
    consumoImportadoTotal: 9680000,
    creditoEnergiaKwh: 6500,
    creditoEnergiaPrecio: 495.40,
    creditoEnergiaTotal: -3220100,
    valoracionHorariaKwh: 2100,
    valoracionHorariaPrecio: 122.50,
    valoracionHorariaTotal: 257250,
    totalExcedentesKwh: 4400,
    tarifaAplicada: 756.25,
    generacion: 495.40,
    comercializacion: 85.90,
    transmision: 50.20,
    restricciones: 36.80,
    distribucion: 45.95,
    perdidas: 42.00,
    totalCelsia: 9680000,
    otrasEntidades: 385000,
    alumbrado: 245000,
    aseo: 105000,
    otros: 35000,
    saldoAnterior: -720000,
    saldoAcumulado: 3500000,
    totalPagar: 9345000,
    sinSolar: 14800000,
    conSolar: 9680000,
    ahorro: 5120000
  },
  // Noviembre 2025 - Casa Trejo
  {
    id: 6,
    plantId: '2',
    plant: 'Casa Trejo',
    codigo: '2036110000',
    periodo: 'Nov 2025',
    fechaInicial: '01/11/2025',
    fechaFinal: '30/11/2025',
    consumoMes: 17200,
    consumoImportadoKwh: 6500,
    consumoImportadoPrecio: 792.31,
    consumoImportadoTotal: 5150015,
    creditoEnergiaKwh: 2100,
    creditoEnergiaPrecio: 485.50,
    creditoEnergiaTotal: -1019550,
    valoracionHorariaKwh: 580,
    valoracionHorariaPrecio: 115.20,
    valoracionHorariaTotal: 66816,
    totalExcedentesKwh: 1520,
    tarifaAplicada: 792.31,
    generacion: 485.50,
    comercializacion: 78.40,
    transmision: 48.90,
    restricciones: 32.50,
    distribucion: 105.01,
    perdidas: 42.00,
    totalCelsia: 5150000,
    otrasEntidades: 165000,
    alumbrado: 105000,
    aseo: 45000,
    otros: 15000,
    saldoAnterior: -380000,
    saldoAcumulado: 2197770,
    totalPagar: 4935000,
    sinSolar: 7900000,
    conSolar: 5150000,
    ahorro: 2750000
  },
  // Octubre 2025 - Cabañita (Histórico)
  {
    id: 7,
    plantId: '1',
    plant: 'Cabañita',
    codigo: '1056060000',
    periodo: 'Oct 2025',
    fechaInicial: '01/10/2025',
    fechaFinal: '31/10/2025',
    consumoMes: 25800,
    consumoImportadoKwh: 4900,
    consumoImportadoPrecio: 1102.04,
    consumoImportadoTotal: 5400000,
    creditoEnergiaKwh: 9500,
    creditoEnergiaPrecio: 480.00,
    creditoEnergiaTotal: -4560000,
    valoracionHorariaKwh: 2200,
    valoracionHorariaPrecio: 125.00,
    valoracionHorariaTotal: 275000,
    totalExcedentesKwh: 4600,
    tarifaAplicada: 1102.04,
    generacion: 480.00,
    comercializacion: 95.00,
    transmision: 60.00,
    restricciones: 44.00,
    distribucion: 155.04,
    perdidas: 42.00,
    totalCelsia: 5400000,
    otrasEntidades: 275000,
    alumbrado: 180000,
    aseo: 70000,
    otros: 25000,
    saldoAnterior: -1150000,
    saldoAcumulado: 4129874,
    totalPagar: 4525000,
    sinSolar: 11500000,
    conSolar: 5400000,
    ahorro: 6100000
  },
  // Octubre 2025 - Pozo 1 (Histórico)
  {
    id: 8,
    plantId: '5',
    plant: 'Pozo 1',
    codigo: '6497410000',
    periodo: 'Oct 2025',
    fechaInicial: '01/10/2025',
    fechaFinal: '31/10/2025',
    consumoMes: 34200,
    consumoImportadoKwh: 12100,
    consumoImportadoPrecio: 760.33,
    consumoImportadoTotal: 9200000,
    creditoEnergiaKwh: 7500,
    creditoEnergiaPrecio: 498.00,
    creditoEnergiaTotal: -3735000,
    valoracionHorariaKwh: 2900,
    valoracionHorariaPrecio: 120.00,
    valoracionHorariaTotal: 348000,
    totalExcedentesKwh: 4600,
    tarifaAplicada: 760.33,
    generacion: 498.00,
    comercializacion: 86.00,
    transmision: 51.00,
    restricciones: 38.00,
    distribucion: 45.33,
    perdidas: 42.00,
    totalCelsia: 9200000,
    otrasEntidades: 400000,
    alumbrado: 260000,
    aseo: 105000,
    otros: 35000,
    saldoAnterior: -1420000,
    saldoAcumulado: 4520000,
    totalPagar: 8180000,
    sinSolar: 15100000,
    conSolar: 9200000,
    ahorro: 5900000
  }
];

// ============================================
// CONFIGURACIÓN DE TIPOS DE ALERTAS
// ============================================
export const alertTypesConfig: AlertTypeConfig[] = [
  {
    id: 'generation',
    category: 'generation',
    name: 'Alertas de Generación',
    description: 'Monitoreo de la generación de energía vs objetivos',
    icon: 'Zap',
    color: '#F59E0B',
    enabled: true,
    rules: [
      {
        id: 'gen-daily-low',
        name: 'Generación diaria baja',
        description: 'Alerta cuando la generación diaria está por debajo del objetivo',
        enabled: true,
        metric: 'generation_daily_percent',
        operator: 'less_than',
        threshold: 80,
        unit: '%',
        severity: 'warning',
        notifyEmail: true,
        notifyPush: true
      },
      {
        id: 'gen-daily-critical',
        name: 'Generación diaria crítica',
        description: 'Alerta cuando la generación diaria está muy por debajo del objetivo',
        enabled: true,
        metric: 'generation_daily_percent',
        operator: 'less_than',
        threshold: 50,
        unit: '%',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      },
      {
        id: 'gen-zero',
        name: 'Sin generación',
        description: 'Alerta cuando no hay generación durante el día',
        enabled: true,
        metric: 'generation_daily',
        operator: 'equals',
        threshold: 0,
        unit: 'kWh',
        timeWindow: 4,
        timeUnit: 'hours',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      }
    ]
  },
  {
    id: 'cop',
    category: 'cop',
    name: 'Alertas COP (Cumplimiento)',
    description: 'Seguimiento del cumplimiento de objetivos financieros',
    icon: 'Target',
    color: '#10B981',
    enabled: true,
    rules: [
      {
        id: 'cop-below-target',
        name: 'COP por debajo del objetivo',
        description: 'El ahorro mensual está por debajo del presupuestado',
        enabled: true,
        metric: 'monthly_savings_percent',
        operator: 'less_than',
        threshold: 90,
        unit: '%',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'cop-on-track',
        name: 'COP cumpliendo objetivo',
        description: 'Notificación cuando se está cumpliendo o superando el objetivo',
        enabled: true,
        metric: 'monthly_savings_percent',
        operator: 'greater_than',
        threshold: 100,
        unit: '%',
        severity: 'info',
        notifyEmail: true
      },
      {
        id: 'cop-critical',
        name: 'COP muy por debajo',
        description: 'El ahorro está muy por debajo de lo esperado',
        enabled: true,
        metric: 'monthly_savings_percent',
        operator: 'less_than',
        threshold: 70,
        unit: '%',
        severity: 'critical',
        notifyEmail: true,
        notifySMS: true
      }
    ]
  },
  {
    id: 'maintenance',
    category: 'maintenance',
    name: 'Alertas de Mantenimiento',
    description: 'Recordatorios de mantenimiento preventivo y correctivo',
    icon: 'Wrench',
    color: '#6366F1',
    enabled: true,
    rules: [
      {
        id: 'maint-preventive-due',
        name: 'Mantenimiento preventivo pendiente',
        description: 'Recordatorio de mantenimiento programado próximo',
        enabled: true,
        metric: 'days_since_maintenance',
        operator: 'greater_than',
        threshold: 90,
        unit: 'días',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'maint-overdue',
        name: 'Mantenimiento vencido',
        description: 'El mantenimiento preventivo está vencido',
        enabled: true,
        metric: 'days_since_maintenance',
        operator: 'greater_than',
        threshold: 120,
        unit: 'días',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true
      },
      {
        id: 'maint-cleaning-due',
        name: 'Limpieza de paneles pendiente',
        description: 'Los paneles requieren limpieza',
        enabled: true,
        metric: 'days_since_cleaning',
        operator: 'greater_than',
        threshold: 30,
        unit: 'días',
        severity: 'info',
        notifyEmail: true
      }
    ]
  },
  {
    id: 'system_failure',
    category: 'system_failure',
    name: 'Alertas de Fallas del Sistema',
    description: 'Detección de fallas y errores en el sistema',
    icon: 'AlertTriangle',
    color: '#EF4444',
    enabled: true,
    rules: [
      {
        id: 'sys-offline',
        name: 'Sistema offline',
        description: 'El sistema de monitoreo no responde',
        enabled: true,
        metric: 'system_status',
        operator: 'equals',
        threshold: 0,
        unit: 'estado',
        timeWindow: 30,
        timeUnit: 'hours',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      },
      {
        id: 'sys-comm-error',
        name: 'Error de comunicación',
        description: 'Pérdida de comunicación con el DataLogger',
        enabled: true,
        metric: 'communication_errors',
        operator: 'greater_than',
        threshold: 5,
        unit: 'errores/hora',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'sys-data-gap',
        name: 'Brecha de datos',
        description: 'No se reciben datos del sistema',
        enabled: true,
        metric: 'hours_without_data',
        operator: 'greater_than',
        threshold: 2,
        unit: 'horas',
        severity: 'warning',
        notifyEmail: true,
        notifyPush: true
      }
    ]
  },
  {
    id: 'billing',
    category: 'billing',
    name: 'Alertas de Facturación Excedentes',
    description: 'Seguimiento de facturación de excedentes con Celsia',
    icon: 'Receipt',
    color: '#8B5CF6',
    enabled: true,
    rules: [
      {
        id: 'bill-pending-2m',
        name: 'Factura pendiente 2+ meses',
        description: 'Han pasado más de 2 meses sin factura de excedentes',
        enabled: true,
        metric: 'months_without_billing',
        operator: 'greater_than',
        threshold: 2,
        unit: 'meses',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'bill-pending-4m',
        name: 'Factura pendiente 4+ meses',
        description: 'Han pasado más de 4 meses sin factura de excedentes',
        enabled: true,
        metric: 'months_without_billing',
        operator: 'greater_than',
        threshold: 4,
        unit: 'meses',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true
      },
      {
        id: 'bill-max-6m',
        name: 'Límite máximo de facturación',
        description: 'Se acerca al límite de 6 meses para facturación',
        enabled: true,
        metric: 'months_without_billing',
        operator: 'greater_than',
        threshold: 5,
        unit: 'meses',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      },
      {
        id: 'bill-high-balance',
        name: 'Saldo acumulado alto',
        description: 'El saldo pendiente con Celsia supera el umbral',
        enabled: true,
        metric: 'celsia_balance',
        operator: 'greater_than',
        threshold: 10000000,
        unit: 'COP',
        severity: 'info',
        notifyEmail: true
      }
    ]
  },
  {
    id: 'performance',
    category: 'performance',
    name: 'Alertas de Rendimiento (PR)',
    description: 'Monitoreo del Performance Ratio del sistema',
    icon: 'Activity',
    color: '#06B6D4',
    enabled: true,
    rules: [
      {
        id: 'pr-low',
        name: 'PR bajo',
        description: 'El Performance Ratio está por debajo del esperado',
        enabled: true,
        metric: 'performance_ratio',
        operator: 'less_than',
        threshold: 80,
        unit: '%',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'pr-critical',
        name: 'PR crítico',
        description: 'El Performance Ratio está muy por debajo del esperado',
        enabled: true,
        metric: 'performance_ratio',
        operator: 'less_than',
        threshold: 70,
        unit: '%',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true
      }
    ]
  },
  {
    id: 'degradation',
    category: 'degradation',
    name: 'Alertas de Degradación',
    description: 'Detección de degradación anormal en paneles',
    icon: 'TrendingDown',
    color: '#F97316',
    enabled: true,
    rules: [
      {
        id: 'deg-high',
        name: 'Degradación alta',
        description: 'La degradación anual supera lo esperado',
        enabled: true,
        metric: 'annual_degradation',
        operator: 'greater_than',
        threshold: 1,
        unit: '%/año',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'deg-critical',
        name: 'Degradación crítica',
        description: 'Degradación muy por encima de lo normal',
        enabled: true,
        metric: 'annual_degradation',
        operator: 'greater_than',
        threshold: 2,
        unit: '%/año',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true
      }
    ]
  },
  {
    id: 'inverter',
    category: 'inverter',
    name: 'Alertas de Inversores',
    description: 'Monitoreo del estado y rendimiento de inversores',
    icon: 'Cpu',
    color: '#EC4899',
    enabled: true,
    rules: [
      {
        id: 'inv-offline',
        name: 'Inversor offline',
        description: 'Un inversor no está en línea',
        enabled: true,
        metric: 'inverter_status',
        operator: 'equals',
        threshold: 0,
        unit: 'estado',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      },
      {
        id: 'inv-temp-high',
        name: 'Temperatura elevada',
        description: 'La temperatura del inversor está alta',
        enabled: true,
        metric: 'inverter_temperature',
        operator: 'greater_than',
        threshold: 60,
        unit: '°C',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'inv-temp-critical',
        name: 'Temperatura crítica',
        description: 'La temperatura del inversor es peligrosamente alta',
        enabled: true,
        metric: 'inverter_temperature',
        operator: 'greater_than',
        threshold: 75,
        unit: '°C',
        severity: 'critical',
        notifyEmail: true,
        notifyPush: true,
        notifySMS: true
      },
      {
        id: 'inv-efficiency-low',
        name: 'Eficiencia baja',
        description: 'El inversor opera con eficiencia reducida',
        enabled: true,
        metric: 'inverter_efficiency',
        operator: 'less_than',
        threshold: 95,
        unit: '%',
        severity: 'warning',
        notifyEmail: true
      }
    ]
  },
  {
    id: 'expiration',
    category: 'expiration',
    name: 'Alertas de Vencimientos',
    description: 'Recordatorios de vencimientos de contratos, garantías y seguros',
    icon: 'Calendar',
    color: '#84CC16',
    enabled: true,
    rules: [
      {
        id: 'exp-warranty-30d',
        name: 'Garantía próxima a vencer',
        description: 'Una garantía vence en menos de 30 días',
        enabled: true,
        metric: 'days_to_warranty_expiry',
        operator: 'less_than',
        threshold: 30,
        unit: 'días',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'exp-insurance-60d',
        name: 'Seguro próximo a vencer',
        description: 'Una póliza de seguro vence en menos de 60 días',
        enabled: true,
        metric: 'days_to_insurance_expiry',
        operator: 'less_than',
        threshold: 60,
        unit: 'días',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'exp-contract-90d',
        name: 'Contrato próximo a vencer',
        description: 'Un contrato vence en menos de 90 días',
        enabled: true,
        metric: 'days_to_contract_expiry',
        operator: 'less_than',
        threshold: 90,
        unit: 'días',
        severity: 'info',
        notifyEmail: true
      }
    ]
  },
  {
    id: 'savings',
    category: 'savings',
    name: 'Alertas de Ahorro',
    description: 'Monitoreo del ahorro mensual vs expectativas',
    icon: 'PiggyBank',
    color: '#22C55E',
    enabled: true,
    rules: [
      {
        id: 'sav-below-expected',
        name: 'Ahorro por debajo del esperado',
        description: 'El ahorro mensual está por debajo de lo proyectado',
        enabled: true,
        metric: 'monthly_savings_cop',
        operator: 'less_than',
        threshold: 5000000,
        unit: 'COP',
        severity: 'warning',
        notifyEmail: true
      },
      {
        id: 'sav-exceeds-target',
        name: 'Ahorro supera objetivo',
        description: 'El ahorro mensual supera las expectativas',
        enabled: true,
        metric: 'monthly_savings_percent',
        operator: 'greater_than',
        threshold: 110,
        unit: '%',
        severity: 'info',
        notifyEmail: true
      }
    ]
  }
];

// ============================================
// ALERTAS ACTIVAS (INSTANCIAS)
// ============================================
export const mockAlerts: Alert[] = [
  // Alertas de Generación
  {
    id: 'alert-001',
    plantId: '2',
    plantName: 'Casa Trejo',
    category: 'generation',
    ruleId: 'gen-daily-low',
    ruleName: 'Generación diaria baja',
    severity: 'warning',
    status: 'active',
    message: 'Generación diaria al 78% del objetivo',
    details: 'La planta generó 851 kWh hoy, por debajo del objetivo de 1,089 kWh',
    value: 78,
    threshold: 80,
    unit: '%',
    createdAt: '2026-01-26T08:30:00-05:00'
  },
  // Alertas de Inversores
  {
    id: 'alert-002',
    plantId: '6',
    plantName: 'Pozo 2',
    category: 'inverter',
    ruleId: 'inv-temp-high',
    ruleName: 'Temperatura elevada',
    severity: 'warning',
    status: 'active',
    message: 'Inversor 1 con temperatura elevada',
    details: 'Temperatura actual: 62°C. Umbral de advertencia: 60°C',
    value: 62,
    threshold: 60,
    unit: '°C',
    createdAt: '2026-01-26T14:15:00-05:00'
  },
  // Alertas de Facturación
  {
    id: 'alert-003',
    plantId: '4',
    plantName: 'Porvenir',
    category: 'billing',
    ruleId: 'bill-pending-2m',
    ruleName: 'Factura pendiente 2+ meses',
    severity: 'warning',
    status: 'active',
    message: 'Sin factura de excedentes hace 3 meses',
    details: 'Última facturación de excedentes: Octubre 2025. Saldo pendiente: $10,305,000 COP',
    value: 3,
    threshold: 2,
    unit: 'meses',
    createdAt: '2026-01-25T09:00:00-05:00'
  },
  {
    id: 'alert-004',
    plantId: '3',
    plantName: 'Maracaibo',
    category: 'billing',
    ruleId: 'bill-high-balance',
    ruleName: 'Saldo acumulado alto',
    severity: 'info',
    status: 'active',
    message: 'Saldo acumulado con Celsia supera $8M',
    details: 'Saldo actual: $8,307,417 COP pendiente de cobro por excedentes',
    value: 8307417,
    threshold: 10000000,
    unit: 'COP',
    createdAt: '2026-01-24T10:00:00-05:00'
  },
  // Alertas de Mantenimiento
  {
    id: 'alert-005',
    plantId: '1',
    plantName: 'Cabañita',
    category: 'maintenance',
    ruleId: 'maint-preventive-due',
    ruleName: 'Mantenimiento preventivo pendiente',
    severity: 'warning',
    status: 'acknowledged',
    message: 'Mantenimiento preventivo programado',
    details: 'Han pasado 95 días desde el último mantenimiento. Se recomienda inspección general.',
    value: 95,
    threshold: 90,
    unit: 'días',
    createdAt: '2026-01-20T08:00:00-05:00',
    acknowledgedAt: '2026-01-20T10:30:00-05:00',
    acknowledgedBy: 'Juan Carlos Hoyos'
  },
  // Alertas de Rendimiento
  {
    id: 'alert-006',
    plantId: '2',
    plantName: 'Casa Trejo',
    category: 'performance',
    ruleId: 'pr-low',
    ruleName: 'PR bajo',
    severity: 'warning',
    status: 'resolved',
    message: 'Performance Ratio por debajo del 80%',
    details: 'PR registrado: 78.5%. Se identificó suciedad en paneles como causa.',
    value: 78.5,
    threshold: 80,
    unit: '%',
    createdAt: '2026-01-18T11:00:00-05:00',
    resolvedAt: '2026-01-19T16:00:00-05:00',
    resolvedBy: 'Técnico ASC',
    notes: 'Se realizó limpieza de paneles. PR regresó a niveles normales.'
  },
  // Alertas de COP
  {
    id: 'alert-007',
    plantId: '5',
    plantName: 'Pozo 1',
    category: 'cop',
    ruleId: 'cop-on-track',
    ruleName: 'COP cumpliendo objetivo',
    severity: 'info',
    status: 'active',
    message: 'Ahorro mensual supera el objetivo',
    details: 'Ahorro del mes: 118% del presupuestado. Excellent rendimiento.',
    value: 118,
    threshold: 100,
    unit: '%',
    createdAt: '2026-01-25T18:00:00-05:00'
  },
  // Alertas de Vencimientos
  {
    id: 'alert-008',
    plantId: '4',
    plantName: 'Porvenir',
    category: 'expiration',
    ruleId: 'exp-insurance-60d',
    ruleName: 'Seguro próximo a vencer',
    severity: 'warning',
    status: 'active',
    message: 'Póliza de seguro vence en 45 días',
    details: 'La póliza Todo Riesgo de la planta vence el 15 de marzo de 2026',
    value: 45,
    threshold: 60,
    unit: 'días',
    createdAt: '2026-01-26T09:00:00-05:00'
  },
  // Alertas de Sistema
  {
    id: 'alert-009',
    plantId: '6',
    plantName: 'Pozo 2',
    category: 'system_failure',
    ruleId: 'sys-data-gap',
    ruleName: 'Brecha de datos',
    severity: 'warning',
    status: 'resolved',
    message: 'Sin datos durante 3 horas',
    details: 'Se perdió comunicación con el SmartLogger entre 2:00 AM y 5:00 AM',
    value: 3,
    threshold: 2,
    unit: 'horas',
    createdAt: '2026-01-23T05:30:00-05:00',
    resolvedAt: '2026-01-23T06:00:00-05:00',
    resolvedBy: 'Sistema',
    notes: 'Comunicación restaurada automáticamente'
  },
  // Alertas de Ahorro
  {
    id: 'alert-010',
    plantId: '1',
    plantName: 'Cabañita',
    category: 'savings',
    ruleId: 'sav-exceeds-target',
    ruleName: 'Ahorro supera objetivo',
    severity: 'info',
    status: 'active',
    message: 'Ahorro de enero supera proyección',
    details: 'Ahorro proyectado vs real: $6.2M vs $7.1M (115% del objetivo)',
    value: 115,
    threshold: 110,
    unit: '%',
    createdAt: '2026-01-26T08:00:00-05:00'
  }
];


// ============================================
// DATOS HSP (Horas Sol Pico)
// ============================================
export const mockHSPData = [
  { month: 'Ene 24', hsp: 4.8, promedio: 4.5 },
  { month: 'Feb 24', hsp: 5.1, promedio: 4.5 },
  { month: 'Mar 24', hsp: 4.9, promedio: 4.5 },
  { month: 'Abr 24', hsp: 4.2, promedio: 4.5 },
  { month: 'May 24', hsp: 3.8, promedio: 4.5 },
  { month: 'Jun 24', hsp: 4.1, promedio: 4.5 },
  { month: 'Jul 24', hsp: 4.6, promedio: 4.5 },
  { month: 'Ago 24', hsp: 5.2, promedio: 4.5 },
  { month: 'Sep 24', hsp: 5.0, promedio: 4.5 },
  { month: 'Oct 24', hsp: 4.3, promedio: 4.5 },
  { month: 'Nov 24', hsp: 3.9, promedio: 4.5 },
  { month: 'Dic 24', hsp: 4.4, promedio: 4.5 },
  { month: 'Ene 25', hsp: 5.3, promedio: 4.5 },
];

export const hspSummary = {
  averageYear: 4.6,
  averageMonth: 4.6,
  totalYear: 1680 // ~4.6 * 365
};

// ============================================
// DATOS PRECIOS DE ENERGÍA (Celsia - Componentes CU)
// ============================================
export const mockEnergyPrices = [
  { month: 'Ene 24', generacion: 380, transmision: 55, distribucion: 190, comercializacion: 85, perdidas: 65, restricciones: 45, total: 820 },
  { month: 'Feb 24', generacion: 395, transmision: 56, distribucion: 192, comercializacion: 88, perdidas: 66, restricciones: 48, total: 845 },
  { month: 'Mar 24', generacion: 410, transmision: 58, distribucion: 195, comercializacion: 90, perdidas: 68, restricciones: 50, total: 871 },
  { month: 'Abr 24', generacion: 405, transmision: 57, distribucion: 194, comercializacion: 89, perdidas: 67, restricciones: 49, total: 861 },
  { month: 'May 24', generacion: 390, transmision: 56, distribucion: 193, comercializacion: 87, perdidas: 66, restricciones: 47, total: 839 },
  { month: 'Jun 24', generacion: 395, transmision: 57, distribucion: 195, comercializacion: 88, perdidas: 67, restricciones: 48, total: 850 },
  { month: 'Jul 24', generacion: 400, transmision: 58, distribucion: 198, comercializacion: 90, perdidas: 68, restricciones: 50, total: 864 },
  { month: 'Ago 24', generacion: 420, transmision: 60, distribucion: 200, comercializacion: 92, perdidas: 70, restricciones: 55, total: 897 }, // Pico
  { month: 'Sep 24', generacion: 435, transmision: 61, distribucion: 202, comercializacion: 95, perdidas: 72, restricciones: 60, total: 925 },
  { month: 'Oct 24', generacion: 430, transmision: 60, distribucion: 201, comercializacion: 94, perdidas: 71, restricciones: 58, total: 914 },
  { month: 'Nov 24', generacion: 440, transmision: 62, distribucion: 205, comercializacion: 96, perdidas: 73, restricciones: 62, total: 938 },
  { month: 'Dic 24', generacion: 450, transmision: 63, distribucion: 208, comercializacion: 98, perdidas: 75, restricciones: 65, total: 959 },
  { month: 'Ene 25', generacion: 465, transmision: 65, distribucion: 210, comercializacion: 100, perdidas: 78, restricciones: 70, total: 988 },
];

// ============================================
// DATOS COSTOS OPERATIVOS (OPEX)
// ============================================
export const mockOperationalCosts = [
  { id: '1', concept: 'Servicio de Vigilancia y Monitoreo CCTV', category: 'Vigilancia', amount: 4500000, date: '2026-01-15', assignment: 'GLOBAL', recurrence: 'Mensual' },
  { id: '2', concept: 'Mantenimiento Correctivo Inversores', category: 'Mantenimiento', amount: 1200000, date: '2026-01-10', assignment: 'SPECIFIC', plantId: '1', recurrence: 'Extraordinario' },
  { id: '3', concept: 'Enlace Internet Satelital Ppal', category: 'Internet', amount: 350000, date: '2026-01-05', assignment: 'GLOBAL', recurrence: 'Mensual' },
  { id: '4', concept: 'Honorarios Administración Enero', category: 'Administración', amount: 2500000, date: '2026-01-01', assignment: 'GLOBAL', recurrence: 'Mensual' },
  { id: '5', concept: 'Póliza Todo Riesgo Anual', category: 'Seguros', amount: 12000000, date: '2026-01-01', assignment: 'GLOBAL', recurrence: 'Anual' },
];
