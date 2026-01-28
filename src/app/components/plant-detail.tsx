import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, TrendingUp, Zap, DollarSign, FileText,
  Settings, Calculator, Info, Paperclip, Plus, Filter, Calendar,
  CheckCircle, AlertTriangle, Wrench, ChevronRight, LayoutDashboard, Sun, Server, ClipboardList, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { mockPlants, historicalGeneration, mockEnergyPrices, mockOperationalCosts } from '@/data/mockData';
import { TaxPlanningYear } from '@/types';

type TabType = 'resumen' | 'financiero' | 'equipos' | 'bitacora' | 'hsp' | 'precios';

// Datos de planificación tributaria (simulados)
const initialTaxPlanning: TaxPlanningYear[] = [
  { year: 2024, rentaLiquidaEstimada: 1000000000, tasaImpuestoRenta: 35, cupoDeduccionDisponible: 0, topeDeduccionAnual: 500000000, deduccionTomada: 87000000, valorActivoPendiente: 278400000, tasaDepreciacion: 20, depreciacionTomada: 69600000, ahorroImpuestosTotal: 54810000 },
  { year: 2025, rentaLiquidaEstimada: 1200000000, tasaImpuestoRenta: 35, cupoDeduccionDisponible: 0, topeDeduccionAnual: 600000000, deduccionTomada: 87000000, valorActivoPendiente: 208800000, tasaDepreciacion: 20, depreciacionTomada: 69600000, ahorroImpuestosTotal: 54810000 },
  { year: 2026, rentaLiquidaEstimada: 1500000000, tasaImpuestoRenta: 35, cupoDeduccionDisponible: 0, topeDeduccionAnual: 750000000, deduccionTomada: 0, valorActivoPendiente: 139200000, tasaDepreciacion: 20, depreciacionTomada: 69600000, ahorroImpuestosTotal: 24360000 },
  { year: 2027, rentaLiquidaEstimada: 1600000000, tasaImpuestoRenta: 35, cupoDeduccionDisponible: 0, topeDeduccionAnual: 800000000, deduccionTomada: 0, valorActivoPendiente: 69600000, tasaDepreciacion: 20, depreciacionTomada: 69600000, ahorroImpuestosTotal: 24360000 },
  { year: 2028, rentaLiquidaEstimada: 1800000000, tasaImpuestoRenta: 35, cupoDeduccionDisponible: 0, topeDeduccionAnual: 900000000, deduccionTomada: 0, valorActivoPendiente: 0, tasaDepreciacion: 20, depreciacionTomada: 0, ahorroImpuestosTotal: 0 },
];

// Bitácora mock
const mockBitacora = [
  { id: 1, type: 'maintenance', date: '20 Ene 2026', time: '10:30 AM', title: 'Mantenimiento Preventivo Trimestral', desc: 'Limpieza de paneles y revisión de conexiones.', attachment: 'Informe_Mantenimiento_Q1_2026.pdf' },
  { id: 2, type: 'resolved', date: '15 Ene 2026', time: '3:45 PM', title: 'Alerta de Temperatura Resuelta', desc: 'Se mejoró la ventilación del inversor 2.', attachment: null },
  { id: 3, type: 'alert', date: '14 Ene 2026', time: '2:15 PM', title: 'Alerta: Temperatura Elevada Inversor 2', desc: 'Temperatura de 58°C detectada. Umbral: 55°C', attachment: null },
  { id: 4, type: 'note', date: '10 Ene 2026', time: '9:00 AM', title: 'Reporte Mensual Diciembre Generado', desc: 'Generación: 14,850 kWh (98.5% del objetivo)', attachment: 'Reporte_Dic_2025.pdf' },
];

export function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [filterType, setFilterType] = useState<'total' | 'dia' | 'mes' | 'anio'>('mes');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1); // Enero
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  // Estado para cargar planta desde API
  const [plant, setPlant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estado para historial de años
  const [plantHistory, setPlantHistory] = useState<any[]>([]);

  // Cargar datos de la planta desde el API
  useEffect(() => {
    async function loadPlant() {
      try {
        setLoading(true);
        // Obtener todas las plantas y buscar por ID
        const response = await fetch('/api/plants');
        const plants = await response.json();

        // Buscar la planta por ID (puede ser "NE=33876570" o similar)
        const foundPlant = plants.find((p: any) => p.id === id);

        if (foundPlant) {
          // Usar datos reales de la API
          const mockPlant = mockPlants[0]; // Solo para campos que aún no vienen del backend

          // Helper para asegurar que los valores sean números
          const toNum = (val: any) => parseFloat(val) || 0;

          // Calcular objetivo anual correcto: Capacidad × HPS × PR × 365
          const capacity = toNum(foundPlant.capacity);
          const hps = toNum(foundPlant.hps_obj) || 4.0;
          const pr = toNum(foundPlant.pr_obj) || 0.90;
          const targetYearCalc = capacity * hps * pr * 365;

          setPlant({
            id: foundPlant.id,
            name: foundPlant.name,
            capacity: capacity,
            location: foundPlant.location || 'Cali, Colombia',
            status: foundPlant.status,
            start_date: foundPlant.start_date,
            days_in_operation: toNum(foundPlant.days_in_operation),
            pct_autoconsumo: toNum(foundPlant.pct_autoconsumo),
            pct_exportacion: toNum(foundPlant.pct_exportacion),

            // === DATOS REALES DE GENERACIÓN ===
            generationToday: toNum(foundPlant.gen_today),
            targetToday: toNum(foundPlant.obj_today),
            generationMonth: toNum(foundPlant.gen_month),
            targetMonth: toNum(foundPlant.obj_month),
            generationYear: toNum(foundPlant.gen_year),
            targetYear: targetYearCalc, // Usar cálculo correcto
            generationTotal: toNum(foundPlant.gen_total),

            // === DATOS REALES DE FLUJO ENERGÉTICO ===
            autoconsumoToday: toNum(foundPlant.autoconsumo_today),
            autoconsumoMonth: toNum(foundPlant.autoconsumo_month),
            autoconsumoYear: toNum(foundPlant.autoconsumo_year),
            autoconsumoTotal: toNum(foundPlant.autoconsumo_total),

            exportToday: toNum(foundPlant.export_today),
            exportMonth: toNum(foundPlant.export_month),
            exportYear: toNum(foundPlant.export_year),
            exportTotal: toNum(foundPlant.export_total),

            importToday: toNum(foundPlant.import_today),
            importMonth: toNum(foundPlant.import_month),
            importYear: toNum(foundPlant.import_year),

            consumoToday: toNum(foundPlant.consumo_today),
            consumoMonth: toNum(foundPlant.consumo_month),
            consumoYear: toNum(foundPlant.consumo_year),

            // Parámetros de referencia
            hps_obj: hps,
            pr_obj: pr,
            current_power: toNum(foundPlant.current_power),

            // Campos que aún no vienen del backend (usar mock como fallback)
            efficiency: mockPlant?.efficiency || 85,
            hsp: hps || mockPlant?.hsp || 4.2,
            investment: mockPlant?.investment || 400000000,
            savingsTotal: mockPlant?.savingsTotal || 120000000,
            paybackYears: mockPlant?.paybackYears || 5,
          });

          // Cargar historial detallado desde /api/plants/:id
          try {
            const detailResponse = await fetch(`/api/plants/${id}`);
            const detailData = await detailResponse.json();
            if (detailData.history) {
              setPlantHistory(detailData.history);
            }
          } catch (histErr) {
            console.error('Error loading plant history:', histErr);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading plant:', error);
        setLoading(false);
      }
    }

    if (id) {
      loadPlant();
    }
  }, [id]);

  // Estado para configuración tributaria
  const [depreciationYears, setDepreciationYears] = useState<number>(5);
  const [rentaYears, setRentaYears] = useState<number>(5);
  const [isEditingTaxConfig, setIsEditingTaxConfig] = useState<boolean>(false);


  // Estados para Filtros HSP
  const [hspFilterType, setHspFilterType] = useState<'dia' | 'mes' | 'anio' | 'todo'>('mes');
  const [hspSelectedYears, setHspSelectedYears] = useState<number[]>([2024, 2025]);

  // Estados para Filtros Precios Energía (Tabla)
  const [pricesSelectedMonths, setPricesSelectedMonths] = useState<string[]>([]); // Vacío = Todos
  const [pricesSelectedYears, setPricesSelectedYears] = useState<string[]>(['24', '25']);

  // Recalcular planificación basada en años de depreciación y renta
  const calculateTaxPlanning = (depYears: number, renYears: number) => {
    return initialTaxPlanning.map(yearData => {
      let newData = { ...yearData };
      // Asumimos inicio en 2024 para el índice (0, 1, 2...)
      const yearIndex = yearData.year - 2024;
      const investment = plant ? plant.investment : 402000000;

      // 1. Depreciación
      if (yearIndex < depYears) {
        newData.tasaDepreciacion = 100 / depYears;
        newData.depreciacionTomada = investment / depYears;
      } else {
        newData.tasaDepreciacion = 0;
        newData.depreciacionTomada = 0;
      }

      // 2. Deducción de Renta (50% de la inversión total, diferida en renYears)
      if (yearIndex < renYears) {
        const totalDeduccion = investment * 0.5;
        newData.deduccionTomada = totalDeduccion / renYears;
      } else {
        newData.deduccionTomada = 0;
      }

      // 3. Recalculo de Ahorro
      // Ahorro = (Deducción Renta + Depreciación) * Tasa Impuesto (35%)
      newData.ahorroImpuestosTotal = (newData.deduccionTomada + newData.depreciacionTomada) * 0.35;

      return newData;
    });
  };

  const [taxPlanning, setTaxPlanning] = useState<TaxPlanningYear[]>(initialTaxPlanning);

  // Efecto para actualizar taxPlanning cuando cambian los años
  const handleSaveConfig = () => {
    setTaxPlanning(calculateTaxPlanning(depreciationYears, rentaYears));
    setIsEditingTaxConfig(false);
  };

  // Mostrar loading mientras se carga la planta
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando datos de la planta...</span>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Planta no encontrada</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  // Calcular días en funcionamiento desde fecha real de inicio
  const operationStartDate = plant.start_date ? new Date(plant.start_date) : new Date('2024-03-15');
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - operationStartDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsSinceStart = Math.floor(daysSinceStart / 30);

  // Formatear fecha de inicio
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Mes y año actual
  const currentMonthName = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  const selectedMonthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  // Toggle año expandido
  const toggleYear = (year: number) => {
    setExpandedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  // Nombres de meses
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Días por mes para cálculo de objetivos
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Generar comparativo anual desde historial real
  const annualComparison = (plantHistory.length > 0 && plant)
    ? plantHistory.map((yearData: any) => {
      // Objetivo mensual = Capacidad × HPS × PR × días del mes
      const monthlyTargetBase = (plant.capacity || 0) * (plant.hps_obj || 4.0) * (plant.pr_obj || 0.9);

      return {
        year: yearData.year,
        generation: Math.round(yearData.generation || 0),
        autoconsumo: Math.round(yearData.autoconsumo || 0),
        exportacion: Math.round(yearData.exportacion || 0),
        months: yearData.months ? yearData.months.map((m: any, idx: number) => {
          const target = Math.round(monthlyTargetBase * daysPerMonth[idx]);
          const gen = Math.round(m.generation || 0);
          const pct = target > 0 ? Math.round((gen / target) * 100) : 0;
          return {
            month: m.month,
            name: m.name || monthNames[idx],
            generation: gen,
            target: target,
            percentage: pct,
            autoconsumo: Math.round(m.autoconsumo || 0),
            exportacion: Math.round(m.exportacion || 0),
          };
        }) : []
      };
    })
    : [];

  // Años disponibles en el historial
  const plantHistoryYears = plantHistory.map((y: any) => y.year);

  // Datos para la gráfica de barras (formato: [{month: 1, year2024: X, year2025: Y, ...}, ...])
  const plantHistoryChartData = Array.from({ length: 12 }, (_, i) => {
    const monthData: any = { month: i + 1 };
    plantHistory.forEach((yearData: any) => {
      const monthInfo = yearData.months?.find((m: any) => m.month === i + 1);
      monthData[`year${yearData.year}`] = monthInfo ? Math.round(monthInfo.generation || 0) : 0;
    });
    return monthData;
  });

  // Cálculos (con valores fallback para cuando plant aún no tiene datos completos)
  const plantInvestment = plant?.investment || 400000000;
  const plantSavingsTotal = plant?.savingsTotal || 0;
  const plantPaybackYears = plant?.paybackYears || 5;
  const beneficioTributarioTotal = taxPlanning.reduce((sum, year) => sum + year.ahorroImpuestosTotal, 0);
  const totalRecuperado = plantSavingsTotal + beneficioTributarioTotal;
  const porcentajeRecuperado = plantInvestment > 0 ? (totalRecuperado / plantInvestment) * 100 : 0;
  const saldoRestante = plantInvestment - totalRecuperado;

  const formatCOP = (val: number | undefined | null) => `$${(val || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
  const formatCOPShort = (val: number | undefined | null) => {
    const safeVal = val || 0;
    return safeVal >= 1000000 ? `$${(safeVal / 1000000).toFixed(1)}M` : formatCOP(safeVal);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-primary text-white';
      case 'resolved': return 'bg-success text-white';
      case 'alert': return 'bg-warning text-white';
      default: return 'bg-muted-foreground text-white';
    }
  };

  // Datos para gráfico de flujo energético - desde historial real
  // Toma el año más reciente con datos y genera los 12 meses
  const latestYearData = plantHistory.length > 0
    ? plantHistory.reduce((latest, current) => current.year > latest.year ? current : latest, plantHistory[0])
    : null;

  const energyFlowData = latestYearData
    ? latestYearData.months.map((m: any) => ({
      month: m.month,
      exportacion: Math.round(m.exportacion || 0),
      importacion: Math.round(m.importacion || 0),
      autoconsumo: Math.round(m.autoconsumo || 0),
      consumo: Math.round((m.autoconsumo || 0) + (m.importacion || 0)) // consumo = autoconsumo + importación
    }))
    : Array.from({ length: 12 }, (_, i) => ({ month: i + 1, exportacion: 0, importacion: 0, autoconsumo: 0, consumo: 0 }));

  // ============================================
  // CÁLCULOS HSP Y PR REALES (desde plantHistory)
  // ============================================
  const shortMonthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  const capacity = plant?.capacity || 1;
  const hpsObj = plant?.hps_obj || 4.0;

  // Datos HSP para gráfica (formato: [{month: 'Ene 24', hsp: 4.5}, ...])
  // HSP Real = Generación / (Capacidad × días)
  const hspChartData: { month: string; hsp: number; year: number; monthNum: number }[] = [];

  plantHistory.forEach((yearData: any) => {
    yearData.months?.forEach((m: any) => {
      const gen = m.generation || 0;
      const days = daysInMonth[m.month - 1] || 30;
      // HSP = Generación / (Capacidad × días del mes)
      const hspReal = (gen > 0 && capacity > 0) ? gen / (capacity * days) : 0;
      hspChartData.push({
        month: `${shortMonthNames[m.month - 1]} ${String(yearData.year).slice(-2)}`,
        hsp: parseFloat(hspReal.toFixed(2)),
        year: yearData.year,
        monthNum: m.month
      });
    });
  });

  // Ordenar por año y mes
  hspChartData.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNum - b.monthNum;
  });

  // Años disponibles en HSP data
  const hspAvailableYears = [...new Set(hspChartData.map(d => d.year))].sort();

  // Calcular HSP promedio del año actual (o último año con datos)
  const currentYear = new Date().getFullYear();
  const yearForAvg = hspAvailableYears.includes(currentYear) ? currentYear : hspAvailableYears[hspAvailableYears.length - 1];
  // Solo contar meses con datos (HSP > 0)
  const hspCurrentYearData = hspChartData.filter(d => d.year === yearForAvg && d.hsp > 0);
  const hspPromedioAnio = hspCurrentYearData.length > 0
    ? hspCurrentYearData.reduce((sum, d) => sum + d.hsp, 0) / hspCurrentYearData.length
    : 0;

  // Generación YTD (año actual o último año)
  const latestYearHistory = plantHistory.find((y: any) => y.year === yearForAvg);
  const generacionYTD = latestYearHistory?.generation || 0;

  // PR Real = Generación / (Capacidad × HSP_obj × días)
  // Contamos días reales de los meses con datos
  const diasYTD = hspCurrentYearData.reduce((sum, d) => sum + (daysInMonth[d.monthNum - 1] || 30), 0);
  const expectedGeneration = capacity * hpsObj * diasYTD;
  const prReal = expectedGeneration > 0
    ? (generacionYTD / expectedGeneration) * 100
    : 0;

  // ============================================
  // DATOS FINANCIEROS REALES (desde plantHistory)
  // ============================================
  // Tarifas aproximadas (COP/kWh)
  const TARIFA_AUTOCONSUMO = 850; // Lo que dejas de pagar por kWh autoconsumido
  const TARIFA_EXPORTACION = 450; // Lo que te pagan por kWh exportado
  const TARIFA_RED = 900; // Tarifa que pagarías sin solar

  // Generar datos financieros por mes desde el historial
  const realFinancialData: { month: string; selfConsumptionValue: number; exportedValue: number; year: number; monthNum: number }[] = [];
  let accumulated = 0;

  plantHistory.forEach((yearData: any) => {
    yearData.months?.forEach((m: any) => {
      const autoconsumoKwh = m.autoconsumo || 0;
      const exportacionKwh = m.exportacion || 0;

      const selfConsumptionValue = Math.round(autoconsumoKwh * TARIFA_AUTOCONSUMO);
      const exportedValue = Math.round(exportacionKwh * TARIFA_EXPORTACION);
      accumulated += selfConsumptionValue + exportedValue;

      if (autoconsumoKwh > 0 || exportacionKwh > 0) {
        realFinancialData.push({
          month: `${shortMonthNames[m.month - 1]} ${String(yearData.year).slice(-2)}`,
          selfConsumptionValue,
          exportedValue,
          year: yearData.year,
          monthNum: m.month
        });
      }
    });
  });

  // Ordenar por fecha
  realFinancialData.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.monthNum - b.monthNum;
  });

  // Totales financieros
  const totalAhorroAutoconsumo = realFinancialData.reduce((sum, d) => sum + d.selfConsumptionValue, 0);
  const totalIngresoExportacion = realFinancialData.reduce((sum, d) => sum + d.exportedValue, 0);
  const totalAhorroNeto = totalAhorroAutoconsumo + totalIngresoExportacion;

  // Agrupar por año para la tabla consolidada
  const financialByYear: { [key: number]: { sinSolar: number; conSolar: number; ahorro: number } } = {};
  realFinancialData.forEach(d => {
    if (!financialByYear[d.year]) {
      financialByYear[d.year] = { sinSolar: 0, conSolar: 0, ahorro: 0 };
    }
    const ahorro = d.selfConsumptionValue + d.exportedValue;
    const conSolar = ahorro * 0.31; // Aproximación: lo que sí pagaste a la red
    const sinSolar = ahorro + conSolar; // Lo que habrías pagado sin solar
    financialByYear[d.year].ahorro += ahorro;
    financialByYear[d.year].conSolar += conSolar;
    financialByYear[d.year].sinSolar += sinSolar;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/plantas')} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{plant.name}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${plant.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${plant.status === 'active' ? 'bg-success' : 'bg-warning'}`}></span>
              {plant.status === 'active' ? 'Online' : 'Alerta'}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {plant.capacity} kWp • {plant.location} • {daysSinceStart} días en funcionamiento • Inicio: {formatDate(operationStartDate)}
          </p>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'resumen' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Resumen
        </button>
        <button
          onClick={() => setActiveTab('financiero')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'financiero' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Financiero
        </button>
        <button
          onClick={() => setActiveTab('hsp')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'hsp' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Sun className="w-4 h-4 mr-2" />
          HSP
        </button>
        <button
          onClick={() => setActiveTab('precios')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'precios' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Precios
        </button>
        <button
          onClick={() => setActiveTab('equipos')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'equipos' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Server className="w-4 h-4 mr-2" />
          Equipos
        </button>
        <button
          onClick={() => setActiveTab('bitacora')}
          className={`flex items-center justify-center flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'bitacora' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ClipboardList className="w-4 h-4 mr-2" />
          Bitácora
        </button>
      </div>

      {/* TAB: RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Filtros mejorados: Multi-selección (Toggles) */}
          {/* KPIs Generación y Performance (Estilo HSP Separado) */}
          <div className="space-y-8">
            {/* Fila Generación (3 Tarjetas) */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2 px-1">
                <Zap className="w-4 h-4 text-amber-500" /> Indicadores de Generación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hoy - Destacado */}
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white/90 uppercase text-xs mb-1">Generación Hoy</h3>
                    <p className="text-4xl font-bold">{plant.generationToday.toFixed(0)} <span className="text-lg font-normal opacity-80">kWh</span></p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                    <div>
                      <p className="text-xs text-white/80">Meta diaria</p>
                      <p className="font-medium text-white">{plant.targetToday.toFixed(0)} kWh</p>
                    </div>
                    {(() => {
                      const perc = (plant.generationToday / plant.targetToday) * 100;
                      return <div className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded-full shadow-sm">{perc.toFixed(1)}%</div>
                    })()}
                  </div>
                </div>

                {/* Mes */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-muted-foreground uppercase text-xs mb-1">Acumulado Mes ({selectedMonthName})</h3>
                    <p className="text-4xl font-bold text-foreground">{(plant.generationMonth / 1000).toFixed(1)} <span className="text-lg font-normal text-muted-foreground">MWh</span></p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Mensual</p>
                      <p className="font-medium text-foreground">{(plant.targetMonth / 1000).toFixed(1)} MWh</p>
                    </div>
                    {(() => {
                      const perc = (plant.generationMonth / plant.targetMonth) * 100;
                      return <div className={`text-xs font-bold px-2 py-1 rounded-full ${perc >= 100 ? 'bg-emerald-100 text-emerald-700' : perc >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{perc.toFixed(1)}%</div>
                    })()}
                  </div>
                </div>

                {/* Año */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-muted-foreground uppercase text-xs mb-1">Acumulado Año {selectedYear}</h3>
                    <p className="text-4xl font-bold text-foreground">{(plant.generationYear / 1000).toFixed(1)} <span className="text-lg font-normal text-muted-foreground">MWh</span></p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Meta Anual</p>
                      <p className="font-medium text-foreground">{(plant.targetYear / 1000).toFixed(1)} MWh</p>
                    </div>
                    {(() => {
                      const perc = (plant.generationYear / plant.targetYear) * 100;
                      return <div className={`text-xs font-bold px-2 py-1 rounded-full ${perc >= 100 ? 'bg-emerald-100 text-emerald-700' : perc >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>{perc.toFixed(1)}%</div>
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Fila Performance (2 Tarjetas) */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2 px-1">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Performance del Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PR */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">Performance Ratio (PR)</h3>
                  <p className="text-4xl font-bold text-emerald-600">{plant.efficiency}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Eficiencia Global Acumulada</p>
                </div>
                {/* HSP */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">HSP Promedio</h3>
                  <p className="text-4xl font-bold text-amber-500">{plant.hsp}</p>
                  <p className="text-sm text-muted-foreground mt-1">Horas Sol Pico Diarias</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla Comparativa Anual - Mejorada con Objetivos y Cumplimiento */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Comparativo Anual de Generación
              </h3>
              <p className="text-xs text-muted-foreground">Click en un año para desplegar detalle mensual</p>
            </div>

            <div className="space-y-3">
              {annualComparison.map((yearData) => {
                const isExpanded = expandedYears.includes(yearData.year);
                // Objetivo anual = Capacidad × HPS × PR × 365 días
                const yearTarget = plant.capacity * (plant.hps_obj || 4.0) * (plant.pr_obj || 0.9) * 365;
                const yearCompliance = yearTarget > 0 ? (yearData.generation / yearTarget) * 100 : 0;

                return (
                  <div key={yearData.year} className={`border rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-primary/50 shadow-md' : 'border-border hover:border-primary/30'}`}>
                    {/* Fila Resumen Anual */}
                    <button
                      onClick={() => toggleYear(yearData.year)}
                      className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 bg-card hover:bg-muted/30 transition-colors gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full bg-muted transition-transform duration-200 ${isExpanded ? 'rotate-90 text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xl flex items-center gap-2">
                            {yearData.year}
                            {yearData.year === new Date().getFullYear() && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full tracking-wider">
                                En Curso
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Métricas Anuales: Real vs Objetivo y Cumplimiento, más Balance Energético */}
                      <div className="flex flex-1 justify-end items-center gap-6 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Generación Real</p>
                          <p className="font-bold text-lg text-foreground">{(yearData.generation / 1000).toFixed(1)} MWh</p>
                          <div className="flex justify-end gap-2 text-[10px] text-muted-foreground mt-1">
                            <span className="text-emerald-600 font-medium">Auto: {yearData.generation > 0 ? Math.round((yearData.autoconsumo / yearData.generation) * 100) : 0}%</span>
                            <span className="text-amber-600 font-medium">Exp: {yearData.generation > 0 ? Math.round((yearData.exportacion / yearData.generation) * 100) : 0}%</span>
                          </div>
                        </div>

                        <div className="hidden md:block h-8 w-px bg-border"></div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                          <p className="font-medium text-lg text-muted-foreground">{(yearTarget / 1000).toFixed(1)} MWh</p>
                        </div>

                        <div className="hidden md:block h-8 w-px bg-border"></div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Cumplimiento</p>
                          <div className={`flex items-center justify-end gap-1 font-bold text-lg ${yearCompliance >= 100 ? 'text-emerald-600' : yearCompliance >= 90 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                            {yearCompliance.toFixed(1)}%
                            {yearCompliance >= 100 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Detalle Mensual Expandido */}
                    {isExpanded && yearData.months && (
                      <div className="bg-muted/30 p-5 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {yearData.months.map((month) => (
                            <div
                              key={month.month}
                              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <span className="font-semibold text-sm uppercase tracking-wide">{month.name}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${month.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : month.percentage >= 90 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                  {month.percentage}%
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Real:</span>
                                  <span className="font-bold font-mono">{(month.generation).toLocaleString()} kWh</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Meta:</span>
                                  <span className="font-mono">{(month.target).toLocaleString()} kWh</span>
                                </div>
                              </div>

                              {/* Flujo Energético Mensual */}
                              <div className="flex justify-between text-[10px] font-medium pt-2 border-t border-border/50">
                                <span className="text-emerald-600" title="Autoconsumo">Auto: {month.generation > 0 ? Math.round((month.autoconsumo / month.generation) * 100) : 0}%</span>
                                <span className="text-amber-600" title="Exportación">Exp: {month.generation > 0 ? Math.round((month.exportacion / month.generation) * 100) : 0}%</span>
                              </div>

                              {/* Barra de progreso mini */}
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${month.percentage >= 100 ? 'bg-emerald-500' : month.percentage >= 90 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(month.percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfica Histórica Generación con título específico de la planta */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-2">Generación Histórica - {plant.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Líneas de referencia: HSP 3.5 / 3.8 / 4.0 (PR Objetivo 90%)</p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={plantHistoryChartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(val: number) => val.toLocaleString() + ' kWh'} labelFormatter={(l) => `Mes ${l}`} />
                <Legend />
                {/* Líneas de referencia HSP con PR 0.90 - usando capacidad de esta planta */}
                <ReferenceLine
                  y={plant.capacity * 4.0 * 30 * 0.90}
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  label={{ value: `HSP 4.0: ${(plant.capacity * 4.0 * 30 * 0.90 / 1000).toFixed(0)}k`, position: 'right', fill: '#10B981', fontSize: 10 }}
                />
                <ReferenceLine
                  y={plant.capacity * 3.8 * 30 * 0.90}
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  label={{ value: `HSP 3.8: ${(plant.capacity * 3.8 * 30 * 0.90 / 1000).toFixed(0)}k`, position: 'right', fill: '#F59E0B', fontSize: 10 }}
                />
                <ReferenceLine
                  y={plant.capacity * 3.5 * 30 * 0.90}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  label={{ value: `HSP 3.5: ${(plant.capacity * 3.5 * 30 * 0.90 / 1000).toFixed(0)}k`, position: 'right', fill: '#EF4444', fontSize: 10 }}
                />
                {plantHistoryYears.includes(2022) && <Bar dataKey="year2022" name="2022" fill="#64748B" radius={[4, 4, 0, 0]} />}
                {plantHistoryYears.includes(2023) && <Bar dataKey="year2023" name="2023" fill="#94A3B8" radius={[4, 4, 0, 0]} />}
                {plantHistoryYears.includes(2024) && <Bar dataKey="year2024" name="2024" fill="#64748B" radius={[4, 4, 0, 0]} />}
                {plantHistoryYears.includes(2025) && <Bar dataKey="year2025" name="2025" fill="#3B82F6" radius={[4, 4, 0, 0]} />}
                {plantHistoryYears.includes(2026) && <Bar dataKey="year2026" name="2026" fill="#10B981" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
            {/* Leyenda HSP */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-[#10B981]" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <span>HSP 4.0 (Óptimo)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-[#F59E0B]" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <span>HSP 3.8 (Bueno)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-[#EF4444]" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></div>
                <span>HSP 3.5 (Mínimo)</span>
              </div>
            </div>
          </div>

          {/* Nueva Gráfica: Flujo Energético (Exportación, Importación, Autoconsumo) */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold text-foreground mb-2">Flujo Energético - {plant.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">Comparativa de exportación, importación y autoconsumo {latestYearData ? `(${latestYearData.year})` : ''}</p>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={energyFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickFormatter={(v) => `Mes ${v}`} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => val.toLocaleString() + ' kWh'} />
                <Legend />
                <Area type="monotone" dataKey="exportacion" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Exportación" />
                <Area type="monotone" dataKey="autoconsumo" stackId="2" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} name="Autoconsumo" />
                <Area type="monotone" dataKey="importacion" stackId="3" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Importación" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB: FINANCIERO */}
      {activeTab === 'financiero' && (
        <div className="space-y-8">
          {/* 1. KPIs Financieros Completos */}
          <div>
            <h3 className="font-bold text-foreground mb-4">Indicadores Financieros</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fila 1 */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Inversión Total</p>
                <p className="text-xl font-bold">{formatCOPShort(plantInvestment)}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Ahorro Acumulado (Energía)</p>
                <p className="text-xl font-bold text-success">{formatCOPShort(plantSavingsTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Autoconsumo + Excedentes</p>
              </div>

              {/* Tarjeta Azul Modificada: Saldo (Posición 3 - Premium Style) */}
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl border border-primary/20 p-4 flex flex-col justify-between shadow-lg">
                <div>
                  <p className="text-xs text-white/70 mb-1 font-semibold uppercase">Saldo Pendiente</p>
                  <p className="text-xl font-bold text-white mb-2">
                    {formatCOPShort((Math.abs(plantSavingsTotal - plantInvestment)) * -1)}
                  </p>

                  <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 mt-2">
                    <div
                      className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.min(porcentajeRecuperado, 100)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center mt-2 text-[10px] font-medium text-white/90">
                    <span>{(100 - porcentajeRecuperado).toFixed(1)}% Restante</span>
                    <span className="opacity-70">Recuperado: {porcentajeRecuperado.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Fila 2 */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Ingresos Venta Energía</p>
                <p className="text-xl font-bold text-success">{formatCOPShort(plantSavingsTotal * 0.35)}</p>
                <p className="text-[10px] text-muted-foreground">Exportación a la red</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">EBITDA (Año actual)</p>
                <p className="text-xl font-bold text-primary">{formatCOPShort(plantSavingsTotal * 0.95)}</p>
                <p className="text-[10px] text-muted-foreground">Margen est. 95%</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Payback Estimado</p>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-foreground">{plantPaybackYears} Años</span>
                  <span className="text-[10px] text-success font-medium">Con Beneficios</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{(plantPaybackYears * 1.45).toFixed(1)} Años (Sin Beneficios)</span>
                </div>
              </div>

              {/* Fila 3 */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">ROI Esperado</p>
                <p className="text-xl font-bold text-success">18.5%</p>
                <p className="text-[10px] text-muted-foreground">Retorno sobre inversión</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">TIR (Proyecto)</p>
                <p className="text-xl font-bold text-success">22.4%</p>
                <p className="text-[10px] text-muted-foreground">Tasa Interna Retorno</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground mb-1">Beneficio Tributario</p>
                <p className="text-xl font-bold text-success">{formatCOPShort(beneficioTributarioTotal)}</p>
                <p className="text-[10px] text-muted-foreground">Renta + Depreciación</p>
              </div>
            </div>
          </div>


          {/* 2. Gráfica de Retorno Acumulado (Payback) - 3 Escenarios */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-2">Retorno de Inversión Acumulado (Payback)</h3>
            <p className="text-xs text-muted-foreground mb-6">Proyección comparativa: Solo ahorros vs. Ahorros + Beneficios Tributarios.</p>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={[
                // Datos generados acumulativos simulando 4 años (48 meses)
                ...Array.from({ length: 48 }, (_, i) => {
                  const monthlyAvg = plantInvestment / (plantPaybackYears * 12);
                  const isPast = i < 12; // Primer año es "real"

                  // Escenario 1: Objetivo
                  const cumTarget = monthlyAvg * (i + 1);

                  // Escenario 2: Ahorro Real (Solo Energía)
                  // Variación aleatoria pequeña para simular realidad vs target
                  const cumRealOnlyEnergy = (monthlyAvg * (i + 1)) * (isPast ? 1.02 : 1);

                  // Escenario 3: Ahorro Real + Beneficios (Saltos anuales)
                  let cumRealWithBenefits = cumRealOnlyEnergy;
                  // Beneficio Renta (Año 1)
                  if (i >= 12) cumRealWithBenefits += (plantInvestment * 0.5 * 0.35);
                  // Depreciación (se aplica cada año según configuración)
                  // Usamos el estado depreciationYears para calcular cuánta depreciación entra cada año
                  const taxSavingsPerYear = (plantInvestment / depreciationYears) * 0.35;

                  const yearsPassed = Math.floor((i) / 12);
                  if (yearsPassed >= 1 && yearsPassed <= depreciationYears) {
                    cumRealWithBenefits += (taxSavingsPerYear * yearsPassed);
                    // Simplificación visual: sumamos todo el bloque al cumplir el año
                  }

                  return {
                    month: i + 1,
                    label: `Mes ${i + 1}`,
                    inversion: plantInvestment,
                    ahorroObjetivo: cumTarget,
                    ahorroEnergia: cumRealOnlyEnergy,
                    ahorroTotal: cumRealWithBenefits,
                  };
                })
              ]} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={5}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(val: number) => formatCOP(val)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                {/* Línea de Meta */}
                <ReferenceLine
                  y={plantInvestment}
                  label={{
                    position: 'insideTopLeft',
                    value: 'Meta de Inversión',
                    fill: '#EF4444',
                    fontSize: 12,
                    fontWeight: 'bold',
                    dy: -10
                  }}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  strokeWidth={2}
                />

                {/* Escenario 1: Objetivo (Gris Punteado) */}
                <Area
                  type="natural"
                  dataKey="ahorroObjetivo"
                  name="Objetivo (Solo Energía)"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  fill="url(#colorObjetivo)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                />

                {/* Escenario 2: Real Energía (Azul) */}
                <Area
                  type="natural"
                  dataKey="ahorroEnergia"
                  name="Real (Solo Energía)"
                  stroke="#3b82f6"
                  fill="url(#colorEnergia)"
                  fillOpacity={0.1}
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                />

                {/* Escenario 3: Real + Beneficios (Verde) */}
                <Area
                  type="natural" // type='natural' suaviza la curva
                  dataKey="ahorroTotal"
                  name="Real + Beneficios Tributarios"
                  stroke="#10b981"
                  fill="url(#colorTotal)"
                  fillOpacity={0.2}
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                />

                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEnergia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Análisis de Escenarios
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li><span className="font-semibold text-blue-600">Línea Azul:</span> Recuperación basada únicamente en el ahorro de energía en la factura.</li>
                <li><span className="font-semibold text-emerald-600">Línea Verde:</span> Incluye los beneficios de Ley 1715 (Deducción de Renta + Depreciación Acelearda), reduciendo drásticamente el tiempo de Payback.</li>
                <li>Los "saltos" verticales representan el momento en que se materializan los beneficios tributarios al final del periodo fiscal.</li>
              </ul>
            </div>
          </div>

          {/* 3. Configuración de Beneficios Tributarios (Ley 1715) */}
          <div className="bg-card rounded-2xl border border-border p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Beneficios Tributarios (Ley 1715)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Calculado automáticamente: Renta 50% de Inv. / Depreciación 20% anual</p>
              </div>
              <button
                onClick={() => {
                  if (isEditingTaxConfig) {
                    handleSaveConfig();
                  } else {
                    setIsEditingTaxConfig(true);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${isEditingTaxConfig ? 'bg-primary text-primary-foreground border-primary' : 'border-primary text-primary hover:bg-primary/5'
                  }`}
              >
                <Settings className="w-4 h-4" />
                {isEditingTaxConfig ? 'Guardar Cambios' : 'Configurar / Editar'}
              </button>
            </div>

            {/* Panel de Configuración (Expandible) */}
            {isEditingTaxConfig && (
              <div className="mb-6 p-4 bg-muted/40 border border-primary/20 rounded-xl animate-in slide-in-from-top-2 space-y-6">

                {/* 1. Configuración Deducción Renta */}
                <div>
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Deducción de Renta (50% Inversión)
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Periodo de aplicación (Ley 1715 permite hasta 15 años)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="15"
                          step="1"
                          value={rentaYears}
                          onChange={(e) => setRentaYears(Number(e.target.value))}
                          className="flex-1 accent-blue-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="font-bold text-lg w-12 text-center text-blue-600">{rentaYears}</span>
                        <span className="text-sm text-muted-foreground">Años</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Deducción anual estimada: <span className="font-semibold">{formatCOP((plant?.investment || 0) * 0.5 / rentaYears)}</span>
                      </p>
                    </div>
                    {/* Botón Desktop (Nuevo) */}
                    <div className="pl-4 border-l border-border hidden md:flex items-center justify-center min-h-[80px]">
                      <button
                        onClick={handleSaveConfig}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 h-fit"
                      >
                        Aplicar Cambios
                      </button>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border my-2"></div>

                {/* 2. Configuración Depreciación */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      Depreciación Acelerada
                    </h4>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Vida Útil Fiscal</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        value={depreciationYears}
                        onChange={(e) => setDepreciationYears(Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-bold text-lg w-12 text-center text-amber-600">{depreciationYears}</span>
                      <span className="text-sm text-muted-foreground">Años</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tasa anual aplicada: <span className="font-semibold">{(100 / depreciationYears).toFixed(1)}%</span>
                    </p>
                  </div>

                  {/* Botón Desktop */}
                  <div className="pl-4 border-l border-border hidden md:flex items-center justify-center min-h-[80px]">
                    <button
                      onClick={handleSaveConfig}
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 h-fit"
                    >
                      Aplicar Cambios
                    </button>
                  </div>
                </div>

                {/* Botón Móvil */}
                <div className="md:hidden pt-2">
                  <button
                    onClick={handleSaveConfig}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90"
                  >
                    Aplicar Cambios
                  </button>
                </div>
              </div>
            )}

            {/* Resumen de Beneficios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Sección Renta Líquida */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground">Deducción de Renta (50%)</h4>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Base (Inversión)</span>
                    <span className="font-medium">{formatCOP(plantInvestment)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Deducción Total (50%)</span>
                    <span className="font-bold text-foreground">{formatCOP(plantInvestment * 0.5)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800/30 mb-3">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Ahorro en Impuestos (35%)</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">{formatCOP(plantInvestment * 0.5 * 0.35)}</span>
                  </div>
                  {/* Barra de Progreso Temporal - Renta (Max 15 años) */}
                  <div className="pt-2 border-t border-blue-200/50">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Tiempo Transcurrido (1 Año)</span>
                      <span>Límite Legal (15 Años)</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(1 / 15) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Depreciación */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                  <h4 className="font-semibold text-sm uppercase text-muted-foreground">Depreciación Acelerada</h4>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Base Depreciable</span>
                    <span className="font-medium">{formatCOP(plantInvestment)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Tasa Anual</span>
                    <span className="font-bold text-foreground">{(100 / depreciationYears).toFixed(1)}% ({depreciationYears} años)</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 dark:border-amber-800/30 mb-3">
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Ahorro Total Depreciación (35%)</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{formatCOP(plantInvestment * 0.35)}</span>
                  </div>
                  {/* Barra de Progreso Temporal - Depreciación (Configurable) */}
                  <div className="pt-2 border-t border-amber-200/50">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Tiempo Transcurrido (1 Año)</span>
                      <span>Vida Útil ({depreciationYears} Años)</span>
                    </div>
                    <div className="h-1.5 w-full bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(1 / depreciationYears) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Proyección Detallada */}
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground text-xs uppercase text-left">
                    <th className="p-4">Año</th>
                    <th className="p-4">Renta Líquida Est.</th>
                    <th className="p-4">Deducción Renta</th>
                    <th className="p-4">Depreciación</th>
                    <th className="p-4 text-right">Ahorro Cash Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {taxPlanning.map((row) => (
                    <tr key={row.year} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold">{row.year}</td>
                      <td className="p-4 text-muted-foreground">{formatCOP(row.rentaLiquidaEstimada)}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-semibold mr-2">
                          Renta
                        </span>
                        {formatCOP(row.deduccionTomada)}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs font-semibold mr-2">
                          Depr.
                        </span>
                        {formatCOP(row.depreciacionTomada)}
                      </td>
                      <td className="p-4 text-right font-bold text-success">
                        +{formatCOP(row.ahorroImpuestosTotal)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold border-t-2 border-border">
                    <td className="p-4">TOTAL</td>
                    <td className="p-4">-</td>
                    <td className="p-4 text-blue-600">{formatCOP(plant.deduccionRenta)}</td>
                    <td className="p-4 text-amber-600">{formatCOP(plantInvestment)}</td>
                    <td className="p-4 text-right text-success text-base">{formatCOP(beneficioTributarioTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SECCIÓN MOVIDA: Escenarios de Facturación (Con vs Sin Solar) - MOVIDA AL FINAL */}
          <div className="space-y-6 mt-12 pt-8 border-t border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Impacto en Flujo de Caja (Histórico de Facturación)
            </h3>

            {/* 1. Resumen de Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Costo Acumulado (Sin Solar)</p>
                <p className="text-2xl font-bold text-muted-foreground line-through decoration-rose-500/50">
                  {formatCOP(totalAhorroNeto * 1.45)}
                </p>
                <p className="text-xs text-rose-500 mt-1 font-medium">Escenario Teórico (Sin Paneles)</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm bg-primary/5 border-primary/20">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Costo Real Pagado</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCOP(totalAhorroNeto * 0.31)}
                </p>
                <p className="text-xs text-primary mt-1 font-medium">Facturación Real con Sistema Solar</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ahorro Neto Operativo</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCOP(totalAhorroNeto)}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Dinero que dejó de salir</p>
              </div>
            </div>

            {/* 2. Gráfica y Tabla */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica Comparativa */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <h4 className="font-semibold text-sm mb-6">Comparativa Mensual de Costos</h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={realFinancialData.map(d => ({
                        month: d.month,
                        sinSolar: (d.selfConsumptionValue + d.exportedValue) * 1.45,
                        conSolar: (d.selfConsumptionValue + d.exportedValue) * 0.31
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis
                        fontSize={10}
                        tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => formatCOP(value)}
                      />
                      <Legend />
                      <Bar dataKey="sinSolar" name="Costo Sin Solar" fill="#64748B" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conSolar" name="Costo Con Solar" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla Detallada */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h4 className="font-semibold text-sm">Detalle de Ahorros Mes a Mes</h4>
                </div>
                <div className="overflow-y-auto max-h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr className="text-left text-xs uppercase text-muted-foreground">
                        <th className="p-3 font-medium">Mes</th>
                        <th className="p-3 font-medium text-right text-muted-foreground">Sin Solar</th>
                        <th className="p-3 font-medium text-right text-blue-600">Con Solar</th>
                        <th className="p-3 font-medium text-right text-emerald-600">Ahorro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {realFinancialData.map((row, i) => {
                        const ahorro = row.selfConsumptionValue + row.exportedValue;
                        const conSolar = ahorro * 0.31;
                        const sinSolar = ahorro + conSolar;
                        return (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-3 font-medium">{row.month}</td>
                            <td className="p-3 text-right text-muted-foreground decoration-rose-500/30 line-through text-xs sm:text-sm">
                              {formatCOPShort(sinSolar)}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {formatCOPShort(conSolar)}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-600">
                              +{formatCOPShort(ahorro)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN FINAL: Resumen Ejecutivo (Ahorro Anual y Tiempo) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            {/* Tarjeta Ahorro por Año */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                Consolidado de Ahorros por Año (Real)
              </h3>
              <div className="space-y-1">
                {/* Encabezados */}
                <div className="grid grid-cols-4 text-xs font-semibold text-muted-foreground uppercase px-3 py-2 border-b border-border/50">
                  <div>Año</div>
                  <div className="text-right">Sin Solar</div>
                  <div className="text-right">Con Solar</div>
                  <div className="text-right text-emerald-600">Ahorro</div>
                </div>

                {/* Filas de Datos */}
                {Object.entries(financialByYear)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([year, data]) => (
                    <div key={year} className="grid grid-cols-4 items-center px-3 py-3 hover:bg-muted/30 rounded-lg transition-colors border-b border-border/30 last:border-0">
                      <div className="font-bold text-foreground">{year}</div>
                      <div className="text-right text-xs text-muted-foreground line-through decoration-slate-500/50">
                        {formatCOPShort(data.sinSolar)}
                      </div>
                      <div className="text-right text-xs font-medium">
                        {formatCOPShort(data.conSolar)}
                      </div>
                      <div className="text-right text-sm font-bold text-emerald-600">
                        +{formatCOPShort(data.ahorro)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Tarjeta Tiempo Operando */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-32 h-32 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-6 relative z-10">Tiempo Total de Operación</h3>
              <div className="relative z-10">
                <span className="text-6xl font-black text-primary tracking-tighter">
                  {monthsSinceStart}
                </span>
                <span className="text-xl font-medium text-muted-foreground ml-2">Meses</span>
              </div>
              <div className="mt-4 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full relative z-10">
                Desde {formatDate(operationStartDate)}
              </div>
              <p className="mt-4 text-xs text-muted-foreground max-w-[80%] relative z-10">
                Operando de forma continua generando valor y sostenibilidad.
              </p>
            </div>

          </div>
        </div>
      )
      }

      {/* TAB: EQUIPOS */}
      {
        activeTab === 'equipos' && (
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Inventario de Equipos
              </h3>

              {/* Inversores */}
              <div className="mb-8">
                <h4 className="font-semibold text-muted-foreground text-sm uppercase mb-4">Inversores</h4>
                <div className="space-y-3">
                  {plant.equipment?.inverters.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{inv.model}</p>
                          <p className="text-xs text-muted-foreground">Inversor String Trifásico</p>
                        </div>
                      </div>
                      <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                        Cantidad: {inv.quantity}
                      </span>
                    </div>
                  )) || <p className="text-muted-foreground">No hay inversores registrados</p>}
                </div>
              </div>

              {/* Paneles */}
              <div className="mb-8">
                <h4 className="font-semibold text-muted-foreground text-sm uppercase mb-4">Paneles Solares</h4>
                <div className="space-y-3">
                  {plant.equipment?.panels.map((panel, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <div className="w-6 h-6 bg-amber-500 rounded" />
                        </div>
                        <div>
                          <p className="font-medium">{panel.model}</p>
                          <p className="text-xs text-muted-foreground">Módulo Fotovoltaico Monocristalino</p>
                        </div>
                      </div>
                      <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold">
                        Cantidad: {panel.quantity}
                      </span>
                    </div>
                  )) || <p className="text-muted-foreground">No hay paneles registrados</p>}
                </div>
              </div>

              {/* Comunicaciones */}
              <div>
                <h4 className="font-semibold text-muted-foreground text-sm uppercase mb-4">Dispositivos de Comunicación</h4>
                <div className="flex flex-wrap gap-3">
                  {plant.equipment?.comms.map((comm, i) => (
                    <span key={i} className="px-4 py-2 bg-muted rounded-lg text-sm font-medium">
                      {comm}
                    </span>
                  )) || <p className="text-muted-foreground">No registrado</p>}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* TAB: BITÁCORA */}
      {
        activeTab === 'bitacora' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline de eventos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Historial de Eventos</h3>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Agregar Evento
                </button>
              </div>

              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="space-y-6">
                  {mockBitacora.map((event, idx) => (
                    <div key={event.id} className="relative pl-10">
                      {/* Línea vertical */}
                      {idx < mockBitacora.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      {/* Icono */}
                      <div className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      {/* Contenido */}
                      <div className="bg-muted/30 rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">{event.date} • {event.time}</p>
                        <p className="font-semibold mb-1">{event.title}</p>
                        <p className="text-sm text-muted-foreground">{event.desc}</p>
                        {event.attachment && (
                          <button className="mt-3 flex items-center gap-2 text-xs text-primary hover:underline">
                            <Paperclip className="w-3.5 h-3.5" />
                            {event.attachment}
                          </button>
                        )}
                        <button className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <Plus className="w-3 h-3" />
                          Adjuntar documento
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de Documentos */}
            <div className="bg-card rounded-2xl border border-border p-6 h-fit">
              <h3 className="font-bold mb-4">Documentos de la Planta</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                  <FileText className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Manual_Huawei_Inverter.pdf</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm">Plano_Unifilar_V3.dwg</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                  <FileText className="w-5 h-5 text-success" />
                  <span className="text-sm">Contrato_Celsia.pdf</span>
                </div>
                <div className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span className="text-sm">Informe_Mantenimiento_Q1.pdf</span>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* TAB: HSP */}
      {activeTab === 'hsp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta 1: HSP Promedio del Año */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 rounded-2xl shadow-lg">
              <h3 className="font-bold text-white/80 uppercase text-xs mb-2">HSP Promedio {yearForAvg}</h3>
              <p className="text-4xl font-bold">{hspPromedioAnio.toFixed(2)}</p>
              <p className="text-sm text-white/70 mt-1">Horas Sol Pico / Día (real calculado)</p>
              <p className="text-xs text-white/50 mt-2">Objetivo: {hpsObj} HSP</p>
            </div>
            {/* Tarjeta 2: PR Real calculado */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-muted-foreground uppercase text-xs mb-2">Performance Ratio (PR) {yearForAvg}</h3>
              <p className={`text-4xl font-bold ${prReal >= 85 ? 'text-emerald-600' : prReal >= 75 ? 'text-amber-500' : 'text-red-500'}`}>
                {prReal.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Gen Real / Gen Esperada</p>
              <p className="text-xs text-muted-foreground mt-2">
                {(generacionYTD / 1000).toFixed(0)}k kWh / {(expectedGeneration / 1000).toFixed(0)}k kWh esperados
              </p>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Evolución de Irradiación (HSP) - {plant.name}
              </h3>

              <div className="flex flex-col gap-3 items-end">
                {/* Selector Granularidad */}
                <div className="flex bg-muted p-1 rounded-lg">
                  {['mes', 'anio', 'todo'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setHspFilterType(type as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-all ${hspFilterType === type ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {type === 'anio' ? 'Año' : type === 'mes' ? 'Mes' : 'Todo'}
                    </button>
                  ))}
                </div>

                {/* Selector Años dinámico desde datos reales */}
                <div className="flex gap-2 flex-wrap">
                  {hspAvailableYears.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        if (hspSelectedYears.includes(year)) {
                          setHspSelectedYears(hspSelectedYears.filter(y => y !== year));
                        } else {
                          setHspSelectedYears([...hspSelectedYears, year]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${hspSelectedYears.includes(year)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
                        }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    hspFilterType === 'anio'
                      // Vista por año: promedio anual
                      ? hspAvailableYears.filter(y => hspSelectedYears.includes(y)).map(year => {
                        const items = hspChartData.filter(d => d.year === year);
                        const avg = items.length > 0 ? items.reduce((sum, curr) => sum + curr.hsp, 0) / items.length : 0;
                        return { month: year.toString(), hsp: parseFloat(avg.toFixed(2)) };
                      })
                      // Vista mensual o todo: datos por mes filtrados por años seleccionados
                      : hspChartData.filter(d => hspSelectedYears.includes(d.year))
                  }
                  margin={{ top: 20, right: 60, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(val: number) => [`${val.toFixed(2)} HSP`, 'Irradiación']}
                  />
                  <Legend />
                  <Bar dataKey="hsp" name={hspFilterType === 'anio' ? "Promedio HSP Anual" : "HSP Real"} fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                  {/* Línea de referencia HSP objetivo de la planta */}
                  <ReferenceLine
                    y={hpsObj}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{ position: 'right', value: `Obj: ${hpsObj}`, fill: '#10B981', fontSize: 11 }}
                  />
                  {/* Línea promedio calculado */}
                  <ReferenceLine
                    y={hspPromedioAnio}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label={{ position: 'right', value: `Prom: ${hspPromedioAnio.toFixed(1)}`, fill: '#ef4444', fontSize: 11 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRECIOS ENERGÍA */}
      {activeTab === 'precios' && (
        <div className="space-y-6">
          {/* KPIs Precios Históricos */}
          {/* KPIs Precios Históricos */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(() => {
              const data = mockEnergyPrices;
              const len = data.length || 1;
              const total = data.reduce((s, x) => s + x.total, 0) / len;
              const cards = [
                { label: "Generación (G)", val: data.reduce((s, x) => s + x.generacion, 0) / len, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                { label: "Transmisión (T)", val: data.reduce((s, x) => s + x.transmision, 0) / len, color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
                { label: "Distribución (D)", val: data.reduce((s, x) => s + x.distribucion, 0) / len, color: "text-blue-500", bg: "bg-blue-50/50 border-blue-100" },
                { label: "Comercialización (C)", val: data.reduce((s, x) => s + x.comercializacion, 0) / len, color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
                { label: "Pérdidas (P)", val: data.reduce((s, x) => s + x.perdidas, 0) / len, color: "text-slate-500", bg: "bg-slate-50/50 border-slate-200" },
                { label: "Restricciones (R)", val: data.reduce((s, x) => s + x.restricciones, 0) / len, color: "text-gray-500", bg: "bg-gray-50 border-gray-200" },
              ];

              return cards.map((c, i) => (
                <div key={i} className={`border ${c.bg} p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-105`}>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/80 mb-1">{c.label}</p>
                  <p className={`text-xl font-bold ${c.color}`}>${c.val.toFixed(0)}</p>
                  <p className="text-[9px] text-muted-foreground mt-1 font-medium">{(c.val / total * 100).toFixed(1)}%</p>
                </div>
              ));
            })()}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-2xl">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Componentes del Costo Unitario (CU) - Celsia
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              El costo de la energía se compone de:
              <span className="font-semibold"> Generación (G)</span>,
              <span className="font-semibold"> Transmisión (T)</span>,
              <span className="font-semibold"> Distribución (D)</span>,
              <span className="font-semibold"> Comercialización (C)</span>,
              <span className="font-semibold"> Pérdidas (P)</span> y
              <span className="font-semibold"> Restricciones (R)</span>.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold mb-6">Evolución del Precio de Energía (COP/kWh)</h3>
            <p className="text-xs text-muted-foreground mb-4 italic">Esta gráfica muestra la serie histórica completa (Sin filtros de tabla).</p>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEnergyPrices} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <Tooltip
                    formatter={(value: number) => `$${value}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="generacion" stackId="1" stroke="#1d4ed8" fill="#1d4ed8" name="Generación" />
                  <Area type="monotone" dataKey="distribucion" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Distribución" />
                  <Area type="monotone" dataKey="comercializacion" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" name="Comercialización" />
                  <Area type="monotone" dataKey="transmision" stackId="1" stroke="#64748b" fill="#64748b" name="Transmisión" />
                  <Area type="monotone" dataKey="perdidas" stackId="1" stroke="#94a3b8" fill="#94a3b8" name="Pérdidas" />
                  <Area type="monotone" dataKey="restricciones" stackId="1" stroke="#cbd5e1" fill="#cbd5e1" name="Restricciones" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla Detallada Precios */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/30 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h4 className="font-semibold text-sm">Detalle Histórico por Componente</h4>

              {/* Filtros de Tabla */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Año:</span>
                  {['24', '25'].map(y => (
                    <button key={y}
                      onClick={() => setPricesSelectedYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])}
                      className={`px-2 py-1 text-[10px] rounded border transition-colors ${pricesSelectedYears.includes(y) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}>
                      20{y}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Mes:</span>
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(m => (
                    <button key={m}
                      onClick={() => setPricesSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                      className={`w-8 h-6 flex items-center justify-center text-[10px] rounded border transition-colors ${pricesSelectedMonths.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent border-border text-muted-foreground'}`}>
                      {m}
                    </button>
                  ))}
                  <button onClick={() => setPricesSelectedMonths([])} className={`text-[10px] ml-1 hover:underline ${pricesSelectedMonths.length === 0 ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                    Todos
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 text-left">Mes</th>
                    <th className="p-3 text-right">Generación</th>
                    <th className="p-3 text-right">Transmisión</th>
                    <th className="p-3 text-right">Distribución</th>
                    <th className="p-3 text-right">Comercialización</th>
                    <th className="p-3 text-right">Otros (P+R)</th>
                    <th className="p-3 text-right font-bold text-foreground">Total CU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(() => {
                    const filteredData = mockEnergyPrices.filter(row => {
                      const [monStr, yearStr] = row.month.split(' ');
                      const yearMatch = pricesSelectedYears.length === 0 || pricesSelectedYears.includes(yearStr);
                      const monthMatch = pricesSelectedMonths.length === 0 || pricesSelectedMonths.includes(monStr);
                      return yearMatch && monthMatch;
                    });

                    if (filteredData.length === 0) {
                      return <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay datos para los filtros seleccionados</td></tr>;
                    }

                    const avg = {
                      gen: filteredData.reduce((s, c) => s + c.generacion, 0) / filteredData.length,
                      tran: filteredData.reduce((s, c) => s + c.transmision, 0) / filteredData.length,
                      dist: filteredData.reduce((s, c) => s + c.distribucion, 0) / filteredData.length,
                      com: filteredData.reduce((s, c) => s + c.comercializacion, 0) / filteredData.length,
                      otr: filteredData.reduce((s, c) => s + (c.perdidas + c.restricciones), 0) / filteredData.length,
                      tot: filteredData.reduce((s, c) => s + c.total, 0) / filteredData.length,
                    };

                    return (
                      <>
                        {filteredData.map((row, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="p-3 font-medium">{row.month}</td>
                            <td className="p-3 text-right text-muted-foreground">${row.generacion}</td>
                            <td className="p-3 text-right text-muted-foreground">${row.transmision}</td>
                            <td className="p-3 text-right text-muted-foreground">${row.distribucion}</td>
                            <td className="p-3 text-right text-muted-foreground">${row.comercializacion}</td>
                            <td className="p-3 text-right text-muted-foreground">${row.perdidas + row.restricciones}</td>
                            <td className="p-3 text-right font-bold text-primary">${row.total}</td>
                          </tr>
                        ))}
                        {/* Fila Promedios */}
                        <tr className="bg-primary/5 font-bold border-t-2 border-primary/20 text-primary">
                          <td className="p-3">PROMEDIO SELECCIÓN</td>
                          <td className="p-3 text-right">${avg.gen.toFixed(0)}</td>
                          <td className="p-3 text-right">${avg.tran.toFixed(0)}</td>
                          <td className="p-3 text-right">${avg.dist.toFixed(0)}</td>
                          <td className="p-3 text-right">${avg.com.toFixed(0)}</td>
                          <td className="p-3 text-right">${avg.otr.toFixed(0)}</td>
                          <td className="p-3 text-right">${avg.tot.toFixed(0)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BITÁCORA */}
      {activeTab === 'bitacora' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Bitácora de Eventos y Mantenimientos
            </h3>

            <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4">
              {/* Eventos de Bitácora Estándar */}
              {mockBitacora.map((event) => (
                <div key={event.id} className="relative pl-8">
                  <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}>
                    {getEventIcon(event.type)}
                  </span>
                  <div className="bg-muted/10 p-4 rounded-xl border border-muted/50">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm">{event.title}</h4>
                      <span className="text-xs text-muted-foreground">{event.date} • {event.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{event.desc}</p>
                    {event.attachment && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs font-medium text-primary cursor-pointer hover:bg-primary/5">
                        <Paperclip className="w-3 h-3" /> {event.attachment}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Eventos de Costos Operativos (Dinámicos) */}
              {mockOperationalCosts
                .filter(c => c.plantId === id && c.assignment === 'SPECIFIC') // Solo de esta planta
                .map((cost) => (
                  <div key={`cost-${cost.id}`} className="relative pl-8">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full flex items-center justify-center bg-amber-500 text-white">
                      <DollarSign className="w-3 h-3" />
                    </span>
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">{cost.concept}</h4>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {new Date(cost.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs mt-2">
                        <span className="font-bold text-amber-700 dark:text-amber-300">{formatCOP(cost.amount)}</span>
                        <span className="px-2 py-0.5 bg-white/50 rounded text-amber-800 dark:text-amber-200 border border-amber-200/50">{cost.category}</span>
                        <span className="text-muted-foreground italic flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Registrado desde Costos
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Mensaje si no hay nada */}
              {mockBitacora.length === 0 && !mockOperationalCosts.some(c => c.plantId === id && c.assignment === 'SPECIFIC') && (
                <div className="pl-8 text-muted-foreground text-sm italic">No hay eventos registrados.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
