export type UserRole = 'owner' | 'epc' | 'investor';

export type PlantStatus = 'active' | 'warning' | 'critical' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company?: string;
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  capacity: number; // kWp
  installationDate: string;
  operationDays: number; // Días operando
  status: PlantStatus;
  owner: string;
  // Generación
  generationToday: number; // kWh
  generationMonth: number; // kWh
  generationYear: number; // kWh
  // Objetivos
  targetToday: number; // kWh objetivo diario
  targetMonth: number; // kWh objetivo mensual
  targetYear: number; // kWh objetivo anual
  // Financiero
  investment: number; // COP inversión inicial
  deduccionRenta: number; // COP descuento 50% Ley 1715
  depreciacionAcelerada: number; // COP/año depreciación 5 años
  revenueTotal: number; // Ingresos (Venta de energía)
  savingsTotal: number; // COP ahorro acumulado
  saldoInversion: number; // COP pendiente por recuperar (negativo si falta, positivo si ya recuperó)
  paybackYears: number;
  paybackYearsNoBenefits: number;
  roi: number; // %
  // Performance
  efficiency: number; // % PR
  hsp: number; // Horas solares pico
  disponibilidad?: number; // % disponibilidad del sistema
  // Autoconsumo/Exportación detallado (Informe Diario)
  selfConsumptionToday?: number;
  selfConsumptionPercent?: number;
  importedToday?: number;
  importedPercent?: number;
  consumptionToday?: number;
  exportedToday?: number;
  exportedPercent?: number;

  selfConsumptionMonth: number; // kWh autoconsumo mes
  exportedMonth: number; // kWh exportado mes
  importedMonth: number; // kWh importado mes

  // Saldo Celsia
  saldoAcumuladoCelsia: number; // COP saldo pendiente con Celsia

  // Equipos
  equipment?: {
    inverters: { model: string; quantity: number }[];
    panels: { model: string; quantity: number }[];
    comms: string[];
  };
}

export interface GenerationData {
  date: string;
  generation: number; // kWh generados
  target?: number; // kWh objetivo
  consumption?: number; // kWh consumidos total
  selfConsumption: number; // kWh autoconsumo
  exported: number; // kWh exportado a red
  imported: number; // kWh importado de red
}

export interface FinancialData {
  month: string;
  generation: number; // kWh
  selfConsumption: number; // kWh
  exported: number; // kWh
  imported: number; // kWh
  selfConsumptionValue: number; // COP (valorizado a tarifa OR)
  exportedValue: number; // COP (valorizado a precio CREG)
  importedCost: number; // COP (costo de importación)
  savingsNet: number; // COP ahorro neto del mes
  accumulated: number; // COP acumulado
}

export interface Inverter {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber?: string;
  power: number; // kW nominal
  status: 'online' | 'offline';
  currentPower: number; // kW actual
  temperature: number; // °C
}

export interface Panel {
  id: string;
  brand: string;
  model: string;
  power: number; // W
  quantity: number;
  degradationRate: number; // % anual
  warranty: number; // años
}

export interface LogEvent {
  id: string;
  date: string;
  type: 'maintenance' | 'alert' | 'resolved' | 'note' | 'equipment' | 'report' | 'outage' | 'weather';
  description: string;
  user: string;
  attachments?: string[]; // URLs de archivos adjuntos
}

// ============================================
// SISTEMA DE ALERTAS AVANZADO
// ============================================

export type AlertCategory =
  | 'generation'      // Alertas de generación de energía
  | 'cop'             // Alertas COP (cumplimiento financiero)
  | 'maintenance'     // Alertas de mantenimiento
  | 'system_failure'  // Alertas de fallas del sistema
  | 'billing'         // Alertas de facturación de excedentes (Celsia)
  | 'performance'     // Alertas de rendimiento (PR)
  | 'degradation'     // Alertas de degradación
  | 'inverter'        // Alertas de inversores
  | 'expiration'      // Alertas de vencimientos
  | 'savings';        // Alertas de ahorro

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export type ComparisonOperator = 'less_than' | 'greater_than' | 'equals' | 'between' | 'not_equals';

export type TimeUnit = 'hours' | 'days' | 'weeks' | 'months';

// Regla individual de una alerta
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  // Condición de disparo
  metric: string;           // Ej: 'generation_daily', 'pr_ratio', 'inverter_status'
  operator: ComparisonOperator;
  threshold: number;
  thresholdMax?: number;    // Para operador 'between'
  unit?: string;            // Ej: 'kWh', '%', 'días', 'meses'
  // Configuración
  timeWindow?: number;      // Ventana de tiempo para evaluar
  timeUnit?: TimeUnit;
  frequency?: TimeUnit;     // Frecuencia de evaluación
  severity: AlertSeverity;
  // Notificaciones
  notifyEmail?: boolean;
  notifyPush?: boolean;
  notifySMS?: boolean;
}

// Configuración de tipo de alerta
export interface AlertTypeConfig {
  id: string;
  category: AlertCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  rules: AlertRule[];
}

// Alerta generada (instancia)
export interface Alert {
  id: string;
  plantId: string;
  plantName: string;
  category: AlertCategory;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  details?: string;
  value?: number;           // Valor actual que disparó la alerta
  threshold?: number;       // Umbral configurado
  unit?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  notes?: string;
}

// Resumen de alertas para dashboard
export interface AlertsSummary {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    critical: number;
    warning: number;
    info: number;
  };
  byCategory: Record<AlertCategory, number>;
}

export interface Invoice {
  id: string;
  plantId: string;
  plantName: string;
  month: string;
  year: number;
  fechaInicial: string;
  fechaFinal: string;
  // Consumo
  consumoTotal: number; // kWh
  importado: number; // kWh
  tarifaImportado: number; // COP/kWh
  // Excedentes
  excedentes: number; // kWh
  tarifaExcedentes: number; // COP/kWh
  saldoAcumulado: number; // COP
  // Totales
  totalCelsia: number; // COP
  otrasEntidades: number; // COP (alumbrado, aseo, etc.)
  saldoAnterior: number; // COP
  totalPagar: number; // COP
  // Comparativo
  sinSolar: number; // COP lo que pagaría sin paneles
  ahorroMes: number; // COP
}

export interface TaxPlanningYear {
  year: number;
  rentaLiquidaEstimada: number; // Ingreso del usuario: Renta líquida de su empresa
  tasaImpuestoRenta: number; // % (ej. 35%)
  // Deducción Especial (50% Inversión)
  cupoDeduccionDisponible: number; // Cuánto me queda del 50% de la inversión
  topeDeduccionAnual: number; // 50% de la Renta Líquida
  deduccionTomada: number; // Valor a aplicar este año
  // Depreciación Acelerada
  valorActivoPendiente: number; // Valor libros
  tasaDepreciacion: number; // % elegido (max 20%)
  depreciacionTomada: number; // Valor a depreciar este año
  // Resultados
  ahorroImpuestosTotal: number; // (Deducción + Depreciación) * TasaImpuesto
}

export interface PlantParameters {
  tarifaEnergiaCU: number; // COP/kWh (Para valorar autoconsumo)
  precioBolsa: number; // COP/kWh (Base excedentes)
  costoComercializacion: number; // COP/kWh (Resta a excedentes CREG 174)
  tasaInversionAnual: number; // IPC o tasa descuento %
}

// Datos consolidados para dashboard
export interface DashboardSummary {
  totalPlants: number;
  activePlants: number;
  totalCapacity: number; // kWp
  totalInvestment: number; // COP
  totalDeduccionRenta: number; // COP
  totalDepreciacion: number; // COP (por año)
  totalSavings: number; // COP ahorro acumulado
  totalSaldoPendiente: number; // COP por recuperar
  totalGenerationMonth: number; // kWh Generación Mes
  monthlyRevenue: number; // COP Ingreso Mensual Estimado
  totalRevenueHistorical: number; // COP Ingresos Totales Históricos
  totalGenerationHistorical: number; // kWh Generación Histórica Total
  avgPayback: number; // años
  avgPaybackNoBenefits: number; // años
  avgROI: number; // %
}
