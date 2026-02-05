import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    DollarSign,
    Calendar,
    FileText,
    PiggyBank,
    ArrowRight,
    Download,
    Receipt,
    PieChart as PieChartIcon,
    Zap,
    Percent,
    Activity,
    BarChart2,
    Printer,
    Factory
} from 'lucide-react';
import {
    BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ComposedChart, Line
} from 'recharts';
import { mockPlants as initialMockPlants, mockFinancialData } from '@/data/mockData';
import { plantService } from '@/services/plantService';

// Helper para formato en Millones (M)
const formatShortCOP = (value: number): string => {
    const isNegative = value < 0;
    const absVal = Math.abs(value);
    const millions = absVal / 1000000;
    return `${isNegative ? '-' : ''}$${millions.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
};

const formatCOP = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Generador de datos PyG proyectados a 10 años
const generatePyGData = (initialSavings: number, initialInvestment: number) => {
    const years = Array.from({ length: 10 }, (_, i) => i + 1);
    const inflation = 0.04;
    const energyInflation = 0.06;

    return years.map(year => {
        const revenue = initialSavings * Math.pow(1 + energyInflation, year - 1);
        const om = (initialSavings * 0.08) * Math.pow(1 + inflation, year - 1);
        const ebitda = revenue - om;
        const depreciation = year <= 5 ? initialInvestment * 0.20 : 0;
        const interest = year <= 7 ? (initialInvestment * 0.60) * (0.12 / year) : 0;
        const uai = ebitda - depreciation - interest;
        const tax = uai > 0 ? uai * 0.35 : 0;
        const taxBenefit = year <= 3 ? (initialInvestment * 0.50 * 0.35) / 3 : 0;
        const netIncome = uai - tax + taxBenefit;

        return { year, revenue, om, ebitda, depreciation, interest, uai, tax, taxBenefit, netIncome };
    });
};

export function GlobalFinancialAnalysis() {
    const [plants, setPlants] = useState(initialMockPlants);
    // Estado para datos históricos reales
    const [realHistory, setRealHistory] = useState<any[]>([]);
    const [plantIncome, setPlantIncome] = useState<any[]>([]);
    // Estado para indicadores financieros del endpoint
    const [investmentData, setInvestmentData] = useState<any>(null);

    useEffect(() => {
        async function fetchPlants() {
            try {
                const realPlants = await plantService.getPlantsSummary();
                const mergedPlants = initialMockPlants.map(mock => {
                    const real = realPlants.find(r => r.name === mock.name);
                    if (real) {
                        return {
                            ...mock,
                            location: real.location,
                            generationToday: Number(real.today_generation),
                            generationYear: Number(real.year_generation),
                            total_generation: Number(real.total_generation),
                            status: (real.status === 'inactive' ? 'offline' : real.status) as any,
                        };
                    }
                    return mock;
                });
                setPlants(mergedPlants);
            } catch (error) {
                console.error("Failed to load plants from API, using mocks", error);
            }
        }

        async function fetchInvestmentSummary() {
            try {
                const data = await plantService.getInvestmentSummary();
                setInvestmentData(data);
            } catch (error) {
                console.error("Failed to load investment summary:", error);
            }
        }

        fetchPlants();
        fetchInvestmentSummary();
    }, []);

    const handlePrint = () => window.print();

    // 1. Cálculos Consolidados Globales
    // 1. Cálculos Consolidados Globales
    // USA GENERACIÓN TOTAL HISTÓRICA (total_generation) * PRECIO PROMEDIO ESTIMADO ($800/kWh mezcla autoconsumo+excedentes)
    // ESTO ES TEMPORAL HASTA TENER DATOS REALES DE DINERO EN DB.
    const PRECIO_PROMEDIO_KWH = 800;
    const totalInvestment = plants.reduce((sum, p) => sum + p.investment, 0);

    // Cálculo de Ahorro Real basado en Generación Histórica Total DB
    // Cálculo de Ahorro Real basado en Historia REAL (Sumatoria API) si existe, o fallback
    // Mejor lógica: Sumar el ahorro de 'realHistory' si ya cargó, sino el calculado
    // Cálculo de Totales Desglosados
    const totalAhorroRealDB = realHistory.reduce((sum, y) => sum + y.ahorro, 0);
    const totalAhorroAutoconsumo = realHistory.reduce((sum, y) => sum + (y.ahorro_autoconsumo || 0), 0);
    const totalIngresoExcedentes = realHistory.reduce((sum, y) => sum + (y.ingreso_excedentes || 0), 0);
    // Para el saldo acumulado, sumamos todos los saldos reportados SI son acumulativos
    // OJO: 'saldo_acumulado' en la DB suele ser snapshot del mes.
    // Tomaremos el último saldo reportado como el saldo actual en caja.
    const ultimoSaldoAcumulado = realHistory.length > 0 ? (realHistory[realHistory.length - 1].saldo_acumulado || 0) : 0;

    const estimatedAnnualSavings = totalAhorroRealDB > 0 ? totalAhorroRealDB : plants.reduce((sum, p) => sum + ((p as any).total_generation ? (p as any).total_generation * PRECIO_PROMEDIO_KWH : p.savingsTotal), 0);

    // Cálculo de Saldos
    // Escenario 1: Solo Ahorro Directo (Inversion - AhorroEnergia)
    const saldoPendienteSoloAhorro = totalInvestment - estimatedAnnualSavings;
    // Escenario 2: Total (Inversion - (AhorroEnergia + SaldoCajaCelsia))
    const saldoPendienteTotal = totalInvestment - (estimatedAnnualSavings + ultimoSaldoAcumulado);

    const ebitdaYear = estimatedAnnualSavings * 0.95;

    // Grid Indicadores Mock (para otros campos no tocados)
    const ingresosVentaEnergia = estimatedAnnualSavings * 0.35;
    const totalDeduccionRenta = plants.reduce((sum, p) => sum + p.deduccionRenta, 0);
    const totalBeneficioTributario = totalInvestment * 0.39;

    // Payback Real
    const aniosHistoria = new Set(realHistory.map(r => r.year)).size || 1;
    const ahorroPromedioAnual = estimatedAnnualSavings / aniosHistoria;
    const paybackYears = ahorroPromedioAnual > 0 ? (totalInvestment / ahorroPromedioAnual) : 0;

    // Constantes para indicadores no calculados dinámicamente aún
    const tirProyecto = 22.4;
    const roiEsperado = 18.5;

    const pygYears = generatePyGData(estimatedAnnualSavings, totalInvestment);
    const scalingFactor = plants.length;
    const historicalBillingData = mockFinancialData.map(d => ({
        month: d.month,
        conSolar: ((d.selfConsumptionValue + d.exportedValue) * 0.45) * scalingFactor,
        sinSolar: ((d.selfConsumptionValue + d.exportedValue) * 1.45) * scalingFactor,
        ahorro: (d.selfConsumptionValue + d.exportedValue) * scalingFactor
    }));

    const cashFlowHistory = [
        { year: '2022', acumulado: 0 },
        { year: '2023', acumulado: estimatedAnnualSavings * 0.8 }, // Ajustar con datos reales si disponibles
        { year: '2024', acumulado: estimatedAnnualSavings * 0.8 + estimatedAnnualSavings * 0.9 },
        { year: '2025', acumulado: estimatedAnnualSavings * 0.8 + estimatedAnnualSavings * 0.9 + estimatedAnnualSavings * 1.0 },
    ];

    // Datos por defecto para fallback (Mock histórico para rellenar si falla API)
    const annualHistory = [
        { year: 2023, sinSolar: 380.5 * 1000000, conSolar: 110.2 * 1000000, ahorro: 270.3 * 1000000 },
        { year: 2024, sinSolar: 401.2 * 1000000, conSolar: 124.5 * 1000000, ahorro: 276.7 * 1000000 },
        { year: 2025, sinSolar: 474.4 * 1000000, conSolar: 147.7 * 1000000, ahorro: 326.7 * 1000000 },
        { year: 2026, sinSolar: 510.1 * 1000000, conSolar: 155.0 * 1000000, ahorro: 355.1 * 1000000 },
    ];

    // Estado para datos históricos reales



    // Estado para datos mensuales por planta (nueva tabla combinada)
    const [monthlyData, setMonthlyData] = useState<any[]>([]);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await plantService.getFinancialHistory();

                // Si la API devuelve datos con 'pay_sin_solar', es porque viene de facturación Celsia real
                const formatted = data.map((d: any) => ({
                    plant_name: d.plant_name || 'Desconocida',
                    year: Number(d.year),
                    month: d.month_name,
                    month_num: d.month_num || 0,
                    // Si viene de FacCelsia, usamos los campos calculados, si no, fallback
                    ahorro: d.ahorro !== undefined ? Number(d.ahorro) : (Number(d.total_generation) * PRECIO_PROMEDIO_KWH),
                    sinSolar: d.sinSolar !== undefined ? Number(d.sinSolar) : (Number(d.total_generation) * PRECIO_PROMEDIO_KWH * 1.5),
                    conSolar: d.conSolar !== undefined ? Number(d.conSolar) : (Number(d.total_generation) * PRECIO_PROMEDIO_KWH * 0.5),

                    // Nuevos campos explícitos de la DB
                    pay_real_total: Number(d.pay_real_total || 0), // TOTAL PAGADO A CELSIA (Gasto)
                    credits_generated: Number(d.income_surplus || 0), // CREDITOS GENERADOS (Ahorro)

                    // Mapping legacy
                    ahorro_autoconsumo: Number(d.ahorro_autoconsumo || 0),
                    ingreso_excedentes: Number(d.ingreso_excedentes || 0),
                    saldo_acumulado: Number(d.balance_cumulative || d.saldo_acumulado || 0)
                }));

                // Guardar datos mensuales ordenados para la nueva tabla
                const sortedMonthly = [...formatted].sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return (a.month_num || 0) - (b.month_num || 0);
                });
                setMonthlyData(sortedMonthly);

                // 1. Agrupar por año para la tabla anual GLOBAL (Suma de todas las plantas)
                const annual = formatted.reduce((acc: any, curr: any) => {
                    const exist = acc.find((a: any) => a.year === curr.year);
                    if (exist) {
                        exist.ahorro += curr.ahorro;
                        exist.sinSolar += curr.sinSolar;
                        exist.conSolar += curr.conSolar;
                        // Acumulamos subcomponentes
                        exist.ahorro_autoconsumo = (exist.ahorro_autoconsumo || 0) + curr.ahorro_autoconsumo;
                        exist.ingreso_excedentes = (exist.ingreso_excedentes || 0) + curr.ingreso_excedentes;
                        // Saldo acumulado global = Suma de saldos
                        exist.saldo_acumulado += curr.saldo_acumulado;
                    } else {
                        acc.push({ ...curr });
                    }
                    return acc;
                }, []);

                setRealHistory(annual.sort((a: any, b: any) => a.year - b.year));

                // 2. Agrupar por Planta para desglose (con datos completos)
                const plantsMap: any = {};
                formatted.forEach((d: any) => {
                    const p = d.plant_name;
                    if (!plantsMap[p]) plantsMap[p] = {
                        name: p,
                        years: {},
                        total: 0,
                        totalSinSolar: 0,
                        totalAhorro: 0
                    };

                    if (!plantsMap[p].years[d.year]) {
                        plantsMap[p].years[d.year] = {
                            pagado: 0,
                            sinSolar: 0,
                            ahorro: 0
                        };
                    }

                    // Sumamos todos los valores
                    const pagado = d.pay_real_total || 0;
                    const ahorro = d.ahorro || 0;
                    // Sin Solar = Pagado + Ahorro (lo que hubiera pagado = lo que pagó + lo que ahorró)
                    const sinSolar = pagado + ahorro;

                    plantsMap[p].years[d.year].pagado += pagado;
                    plantsMap[p].years[d.year].ahorro += ahorro;
                    plantsMap[p].years[d.year].sinSolar += sinSolar;

                    plantsMap[p].total += pagado;
                    plantsMap[p].totalAhorro += ahorro;
                    plantsMap[p].totalSinSolar += sinSolar;
                });

                // Convertir a array
                const plantsArray = Object.values(plantsMap).sort((a: any, b: any) => b.totalAhorro - a.totalAhorro);
                setPlantIncome(plantsArray);

            } catch (e) {
                console.error("Error loading financial history", e);
            }
        };
        loadHistory();
    }, []);

    // Usar realHistory si existe, sino annualHistory (mock)
    const displayHistory = realHistory.length > 0 ? realHistory : annualHistory;

    return (
        <div className="space-y-8 pb-20 print:pb-0 print:space-y-6" id="printable-area">
            <style>{`
        @media print {
          @page { margin: 10mm; size: landscape; }
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .bg-card { border: 1px solid #ddd; break-inside: avoid; }
          .text-white { color: black !important; }
          .bg-gradient-to-br { background: none !important; border: 1px solid #000; }
        }
      `}</style>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-sky-500 print:text-blue-800">
                        Análisis Financiero Consolidado
                    </h1>
                    <p className="text-muted-foreground mt-1 print:text-slate-600">Visión global de rentabilidad de {plants.length} proyectos solares.</p>
                </div>
                <button onClick={handlePrint} className="no-print bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                    <Printer className="w-4 h-4" /> Exportar Reporte PDF
                </button>
            </div>

            {/* NUEVO GRID DE INDICADORES (9 Tarjetas - 3x3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                {/* 1. Inversión Total */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Inversión</p>
                    <h3 className="text-3xl font-bold text-foreground">
                        {formatShortCOP(investmentData?.inversion?.total || totalInvestment)}
                    </h3>
                    <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                        <div className="flex justify-between">
                            <span>Neta (con beneficios):</span>
                            <span className="font-semibold text-blue-600">
                                {formatShortCOP(investmentData?.inversion?.neta || totalInvestment * 0.74)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Ahorro Acumulado DETALLADO */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Ingresos Operativos Acumulados</p>
                    <h3 className="text-3xl font-bold text-green-600">
                        {formatShortCOP(investmentData?.ingresos?.total_operativo || estimatedAnnualSavings)}
                    </h3>

                    <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t pt-2">
                        <div className="flex justify-between items-center">
                            <span>Ahorro Autoconsumo:</span>
                            <span className="font-semibold text-green-700">
                                {formatShortCOP(investmentData?.ingresos?.ahorro_autoconsumo || totalAhorroAutoconsumo)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground/70">({((investmentData?.ingresos?.kwh_autoconsumo || 0) / 1000).toFixed(0)} MWh autoconsumidos)</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span>Cobros Celsia (Excedentes):</span>
                            <span className="font-semibold text-blue-600">
                                {formatShortCOP(investmentData?.ingresos?.cobros_celsia || totalIngresoExcedentes)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Progreso de Recuperación con Barra */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Recuperación de Inversión</p>

                    {investmentData?.recuperacion ? (
                        <div className="space-y-3">
                            {/* Barra de progreso */}
                            <div className="relative">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-semibold text-green-600">
                                        {investmentData.recuperacion.pct_recuperado.toFixed(1)}% Recuperado
                                    </span>
                                    <span className="text-muted-foreground">
                                        Faltan {formatShortCOP(investmentData.recuperacion.saldo_pendiente)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-400 h-4 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(investmentData.recuperacion.pct_recuperado, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Desglose */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] border-t pt-2">
                                <div>
                                    <p className="text-muted-foreground">Recuperado</p>
                                    <p className="font-bold text-green-600">{formatShortCOP(investmentData.recuperacion.total_recuperado)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Pendiente</p>
                                    <p className="font-bold text-orange-500">{formatShortCOP(investmentData.recuperacion.saldo_pendiente)}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-2xl font-bold text-orange-500">{formatShortCOP(saldoPendienteSoloAhorro)}</div>
                    )}
                </div>

                {/* 4. Fecha Estimada Payback */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Fecha Estimada Payback</p>

                    {investmentData?.recuperacion ? (
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-blue-600">
                                {new Date(investmentData.recuperacion.fecha_payback_estimada + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="text-xs text-muted-foreground">
                                <p>~{investmentData.recuperacion.meses_restantes} meses restantes</p>
                                <p className="mt-1 text-[10px]">
                                    Basado en promedio mensual: {formatShortCOP(investmentData.indicadores_reales?.ahorro_mensual_promedio || 0)}
                                </p>
                                <p className="mt-1 text-[9px] italic text-blue-500">Si continúa al ritmo actual</p>
                            </div>
                        </div>
                    ) : (
                        <h3 className="text-2xl font-bold text-foreground">Calculando...</h3>
                    )}
                </div>

                {/* 5. EBITDA Año Actual */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                        EBITDA {investmentData?.ebitda?.anio || new Date().getFullYear()}
                    </p>
                    <h3 className="text-3xl font-bold text-blue-700">
                        {formatShortCOP(investmentData?.ebitda?.ebitda_anio || ebitdaYear)}
                    </h3>
                    <div className="mt-2 text-[10px] text-muted-foreground border-t pt-2">
                        <div className="flex justify-between">
                            <span>Ingresos año:</span>
                            <span className="font-medium">{formatShortCOP(investmentData?.ebitda?.ingresos_anio || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Margen operativo:</span>
                            <span className="font-medium">{investmentData?.ebitda?.margen || 95}%</span>
                        </div>
                    </div>
                </div>

                {/* 6. Payback - ACTUAL vs IDEAL */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Payback</p>

                    {investmentData ? (
                        <div className="space-y-3">
                            {/* ACTUAL */}
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-orange-700">ACTUAL</span>
                                    <span className="text-lg font-bold text-orange-600">
                                        {investmentData.indicadores_reales?.payback_con_beneficios || 0} años
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[10px] text-orange-500">
                                    <span>Sin beneficios:</span>
                                    <span>{investmentData.indicadores_reales?.payback_sin_beneficios || 0} años</span>
                                </div>
                                <p className="text-[9px] text-orange-400 mt-1 italic">Basado en operación real histórica</p>
                            </div>

                            {/* IDEAL */}
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-medium text-blue-700">IDEAL</span>
                                    <span className="text-lg font-bold text-blue-600">
                                        {investmentData.indicadores_proyectados?.payback_con_beneficios || 0} años
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[10px] text-blue-500">
                                    <span>Sin beneficios:</span>
                                    <span>{investmentData.indicadores_proyectados?.payback_sin_beneficios || 0} años</span>
                                </div>
                                <p className="text-[9px] text-blue-400 mt-1 italic">Si hubiera operado al 100% desde inicio</p>
                            </div>
                        </div>
                    ) : (
                        <h3 className="text-3xl font-bold text-foreground">{paybackYears.toFixed(1)} Años</h3>
                    )}
                </div>

                {/* 7. ROI */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">ROI Acumulado</p>
                    <h3 className="text-3xl font-bold text-foreground">
                        {investmentData?.indicadores_reales?.roi_porcentaje?.toFixed(1) || roiEsperado.toFixed(1)}%
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {investmentData ? `${investmentData.saldos?.meses_operacion || 0} meses de operación` : 'Retorno sobre inversión'}
                    </p>
                </div>

                {/* 8. TIR */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">TIR (Proyecto)</p>
                    <h3 className="text-3xl font-bold text-foreground">{tirProyecto}%</h3>
                    <p className="text-[10px] text-muted-foreground mt-1">Tasa Interna de Retorno</p>
                </div>

                {/* 9. Beneficio Tributario */}
                <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Beneficio Tributario</p>
                    <h3 className="text-3xl font-bold text-foreground">
                        {formatShortCOP(investmentData?.beneficios_tributarios?.total || totalBeneficioTributario)}
                    </h3>
                    <div className="mt-2 space-y-1 text-[10px] text-muted-foreground border-t pt-2">
                        <div className="flex justify-between">
                            <span>Renta (50% × 35%):</span>
                            <span className="font-medium">{formatShortCOP(investmentData?.beneficios_tributarios?.ahorro_renta_50 || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Depreciación 5 años:</span>
                            <span className="font-medium">{formatShortCOP(investmentData?.beneficios_tributarios?.ahorro_depreciacion_5anos || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: Análisis de Facturación - Celsia (Mensual) - HISTÓRICO COMPLETO */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm break-inside-avoid">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-blue-600" />
                            Análisis de Facturación - Celsia (Mensual)
                        </h3>
                        <p className="text-sm text-muted-foreground">Comparativo Mensual: Costo Sin Solar vs Con Solar (Histórico Completo)</p>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={monthlyData.reduce((acc: any[], curr: any) => {
                                // Agrupar por mes/año para consolidar todas las plantas
                                const monthKey = `${curr.month?.substring(0, 3) || 'N/A'} ${String(curr.year).slice(-2)}`;
                                const existing = acc.find(a => a.month === monthKey);
                                if (existing) {
                                    existing.sinSolar += Number(curr.sinSolar || 0);
                                    existing.conSolar += Number(curr.conSolar || 0);
                                    existing.ahorro += Number(curr.ahorro || 0);
                                } else {
                                    acc.push({
                                        month: monthKey,
                                        year: curr.year,
                                        month_num: curr.month_num,
                                        sinSolar: Number(curr.sinSolar || 0),
                                        conSolar: Number(curr.conSolar || 0),
                                        ahorro: Number(curr.ahorro || 0)
                                    });
                                }
                                return acc;
                            }, []).sort((a, b) => {
                                if (a.year !== b.year) return a.year - b.year;
                                return (a.month_num || 0) - (b.month_num || 0);
                            })}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="month"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis yAxisId="left" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                            <YAxis yAxisId="right" orientation="right" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                formatter={(value: number) => formatShortCOP(value)}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="sinSolar" name="Costo Sin Solar" fill="#64748B" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar yAxisId="left" dataKey="conSolar" name="Costo Con Solar" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                            <Line yAxisId="right" type="monotone" dataKey="ahorro" name="Ahorro Generado" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SECCIÓN 2.5: Tabla Combinada - Impacto por Planta y Año */}
            {plantIncome.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm break-inside-avoid">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Factory className="w-5 h-5 text-blue-600" />
                        Impacto Financiero por Planta (Facturación Celsia vs Ahorro)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-border">
                                    <th className="p-4 text-left font-bold" rowSpan={2}>Planta</th>
                                    {displayHistory.map((y: any) => (
                                        <th key={y.year} colSpan={3} className="p-2 text-center border-l border-border">{y.year}</th>
                                    ))}
                                    <th colSpan={3} className="p-2 text-center border-l border-border bg-blue-50 text-blue-700">TOTAL</th>
                                </tr>
                                <tr className="bg-muted/30 text-muted-foreground text-[10px] uppercase border-b border-border">
                                    {displayHistory.map((y: any) => (
                                        <React.Fragment key={`header-${y.year}`}>
                                            <th className="p-2 text-right border-l border-border/50 text-slate-500">Sin Solar</th>
                                            <th className="p-2 text-right text-blue-600">Pagado</th>
                                            <th className="p-2 text-right text-emerald-600">Ahorro</th>
                                        </React.Fragment>
                                    ))}
                                    <th className="p-2 text-right border-l border-border text-slate-500">Sin Solar</th>
                                    <th className="p-2 text-right text-blue-600">Pagado</th>
                                    <th className="p-2 text-right text-emerald-600 font-bold">Ahorro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {plantIncome.map((p: any) => (
                                    <tr key={p.name} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4 font-semibold text-foreground">{p.name}</td>
                                        {displayHistory.map((y: any) => {
                                            const yearData = p.years[y.year] || { sinSolar: 0, pagado: 0, ahorro: 0 };
                                            return (
                                                <React.Fragment key={`${p.name}-${y.year}`}>
                                                    <td className="p-2 text-right text-slate-400 border-l border-border/30 text-xs">
                                                        {yearData.sinSolar ? formatShortCOP(yearData.sinSolar) : '-'}
                                                    </td>
                                                    <td className="p-2 text-right text-blue-600 text-xs">
                                                        {yearData.pagado ? formatShortCOP(yearData.pagado) : '-'}
                                                    </td>
                                                    <td className="p-2 text-right text-emerald-600 font-medium text-xs">
                                                        {yearData.ahorro ? formatShortCOP(yearData.ahorro) : '-'}
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                        <td className="p-2 text-right border-l border-border text-slate-500 font-medium">
                                            {formatShortCOP(p.totalSinSolar)}
                                        </td>
                                        <td className="p-2 text-right text-blue-600 font-bold">
                                            {formatShortCOP(p.total)}
                                        </td>
                                        <td className="p-2 text-right text-emerald-600 font-bold">
                                            {formatShortCOP(p.totalAhorro)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Fila de totales */}
                                <tr className="bg-gradient-to-r from-blue-50 to-emerald-50 font-bold border-t-2 border-blue-200">
                                    <td className="p-4 text-blue-800">TOTAL CONSOLIDADO</td>
                                    {displayHistory.map((y: any) => {
                                        const yearTotals = plantIncome.reduce((acc: any, p: any) => {
                                            const yd = p.years[y.year] || { sinSolar: 0, pagado: 0, ahorro: 0 };
                                            return {
                                                sinSolar: acc.sinSolar + (yd.sinSolar || 0),
                                                pagado: acc.pagado + (yd.pagado || 0),
                                                ahorro: acc.ahorro + (yd.ahorro || 0)
                                            };
                                        }, { sinSolar: 0, pagado: 0, ahorro: 0 });
                                        return (
                                            <React.Fragment key={`total-${y.year}`}>
                                                <td className="p-2 text-right text-slate-500 border-l border-border/30">
                                                    {formatShortCOP(yearTotals.sinSolar)}
                                                </td>
                                                <td className="p-2 text-right text-blue-700">
                                                    {formatShortCOP(yearTotals.pagado)}
                                                </td>
                                                <td className="p-2 text-right text-emerald-700">
                                                    {formatShortCOP(yearTotals.ahorro)}
                                                </td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="p-2 text-right border-l border-border text-slate-600">
                                        {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.totalSinSolar, 0))}
                                    </td>
                                    <td className="p-2 text-right text-blue-800 text-lg">
                                        {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.total, 0))}
                                    </td>
                                    <td className="p-2 text-right text-emerald-700 text-lg">
                                        {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.totalAhorro, 0))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Resumen de Impacto */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Facturación Teórica (Sin Solar)</p>
                            <p className="text-xl font-bold text-slate-400 line-through decoration-rose-500/50">
                                {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.totalSinSolar, 0))}
                            </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                            <p className="text-xs uppercase text-blue-600 font-semibold mb-1">Facturación Real (Con Solar)</p>
                            <p className="text-xl font-bold text-blue-700">
                                {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.total, 0))}
                            </p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                            <p className="text-xs uppercase text-emerald-600 font-semibold mb-1">Ahorro Neto Operativo</p>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-xl font-bold text-emerald-600">
                                    {formatShortCOP(plantIncome.reduce((s: number, p: any) => s + p.totalAhorro, 0))}
                                </p>
                                <span className="bg-emerald-200 text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">
                                    -{((1 - (plantIncome.reduce((s: number, p: any) => s + p.total, 0) /
                                        Math.max(plantIncome.reduce((s: number, p: any) => s + p.totalSinSolar, 0), 1))) * 100).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* SECCIÓN 5: Consolidado Anual Histórico */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 break-inside-avoid">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6">Comparativa Anual de Costos (Histórico)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={displayHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={(v) => `$${v / 1000000}M`} fontSize={11} />
                                <Tooltip formatter={(value: number) => formatShortCOP(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))' }} />
                                <Legend />
                                <Bar dataKey="sinSolar" name="Costo Sin Solar" fill="#64748B" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="conSolar" name="Costo Con Solar" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Consolidado de Ahorros por Año (Real)
                    </h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground text-xs uppercase border-b border-border">
                                <th className="pb-3 text-left">Año</th>
                                <th className="pb-3 text-right">Sin Solar</th>
                                <th className="pb-3 text-right">Con Solar</th>
                                <th className="pb-3 text-right font-bold text-emerald-600">Ahorro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {displayHistory.map((row: any) => (
                                <tr key={row.year} className="group hover:bg-muted/10 transition-colors">
                                    <td className="py-4 font-bold text-lg">{row.year}</td>
                                    <td className="py-4 text-right text-muted-foreground line-through decoration-rose-500/30 font-medium">{formatShortCOP(row.sinSolar)}</td>
                                    <td className="py-4 text-right font-medium">{formatShortCOP(row.conSolar)}</td>
                                    <td className="py-4 text-right font-bold text-emerald-600 text-lg">{formatShortCOP(row.ahorro)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
