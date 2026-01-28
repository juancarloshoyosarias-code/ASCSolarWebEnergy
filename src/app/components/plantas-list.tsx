import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Plus, Calendar, Target, TrendingUp, Loader2 } from 'lucide-react';
import { calculateTarget } from '@/utils/solarMath';
import { NewPlantModal } from './new-plant-modal';

// ==========================================
// COMPONENTE DONUT CHART CON PORCENTAJE
// ==========================================
interface DonutChartProps {
  value: number;           // Valor actual
  max: number;             // Valor máximo (100%)
  size?: number;           // Tamaño del círculo
  strokeWidth?: number;    // Grosor del borde
  color: string;           // Color del progreso (tailwind class o hex)
  bgColor?: string;        // Color del fondo
  label?: string;          // Etiqueta pequeña
  unit?: string;           // Unidad (kWh, %, etc)
}

function DonutChart({
  value,
  max,
  size = 64,
  strokeWidth = 6,
  color,
  bgColor = '#e5e7eb',
  label,
  unit = 'kWh'
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - (percent * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Fondo del círculo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progreso */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* Contenido central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground leading-tight">
          {value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)}
        </span>
        <span className="text-[8px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

// ==========================================
// DONUT CHART DUAL (dos colores proporcionales)
// ==========================================
interface DualDonutChartProps {
  value1: number;          // Primer valor (ej: autoconsumo)
  value2: number;          // Segundo valor (ej: exportación/importación)
  color1: string;          // Color del primer segmento
  color2: string;          // Color del segundo segmento
  size?: number;
  strokeWidth?: number;
  centerValue: number;     // Valor a mostrar en el centro
  unit?: string;
}

function DualDonutChart({
  value1,
  value2,
  color1,
  color2,
  size = 64,
  strokeWidth = 6,
  centerValue,
  unit = 'kWh'
}: DualDonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = value1 + value2;

  // Calcular proporciones
  const pct1 = total > 0 ? value1 / total : 0;
  const pct2 = total > 0 ? value2 / total : 0;

  // Offsets para cada segmento
  const offset1 = circumference - (pct1 * circumference);
  const offset2 = circumference - (pct2 * circumference);

  // Rotación para el segundo segmento (empieza donde termina el primero)
  const rotation2 = pct1 * 360;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Primer segmento (ej: autoconsumo - verde) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color1}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset1}
          strokeLinecap="butt"
          className="transition-all duration-500"
        />
        {/* Segundo segmento (ej: exportación - naranja) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color2}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset2}
          strokeLinecap="butt"
          className="transition-all duration-500"
          style={{ transform: `rotate(${rotation2}deg)`, transformOrigin: 'center' }}
        />
      </svg>
      {/* Contenido central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground leading-tight">
          {centerValue >= 1000 ? (centerValue / 1000).toFixed(1) + 'k' : centerValue.toFixed(0)}
        </span>
        <span className="text-[8px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

// Colores FusionSolar exactos
const COLORS = {
  // Producción
  autoconsumo: '#22C55E',      // Verde oscuro (autoconsumo)
  exportacion: '#A3E635',      // Verde claro/lima (proporcionada a la red)
  // Consumo
  autoconsumoConsumo: '#22C55E', // Verde (de energía FV)
  importacion: '#F97316',      // Naranja (de la red eléctrica)
};

export function PlantasList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewPlantModal, setShowNewPlantModal] = useState(false);
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos reales del API
  useEffect(() => {
    async function loadPlants() {
      try {
        const response = await fetch('/api/plants');
        const data = await response.json();
        setPlants(data);
      } catch (error) {
        console.error('Error loading plants:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlants();
  }, []);

  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || plant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Cálculos totales (datos reales)
  const totalCapacity = plants.reduce((sum, p) => sum + (parseFloat(p.capacity) || 0), 0);
  const totalGenToday = plants.reduce((sum, p) => sum + (parseFloat(p.gen_today) || 0), 0);
  const totalGenMonth = plants.reduce((sum, p) => sum + (parseFloat(p.gen_month) || 0), 0);
  const totalGenYear = plants.reduce((sum, p) => sum + (parseFloat(p.gen_year) || 0), 0);

  // Helper para calcular cumplimiento
  const calcCompliance = (actual: number, target: number): string => {
    if (target === 0) return "0.0";
    return ((actual / target) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando plantas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Plantas ({plants.length})</h1>
          <p className="text-muted-foreground">Gestiona y monitorea todas tus instalaciones solares</p>
        </div>
        <button
          onClick={() => setShowNewPlantModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Planta
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar plantas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="warning">Alerta</option>
          </select>
        </div>
      </div>

      {/* Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Capacidad Total</p>
          <p className="text-2xl font-bold text-foreground">{totalCapacity.toFixed(2)} kWp</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Generación Hoy</p>
          <p className="text-2xl font-bold text-foreground">{totalGenToday.toLocaleString()} kWh</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Generación Mes</p>
          <p className="text-2xl font-bold text-foreground">{(totalGenMonth / 1000).toFixed(1)} MWh</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Generación Año</p>
          <p className="text-2xl font-bold text-foreground">{(totalGenYear / 1000).toFixed(1)} MWh</p>
        </div>
      </div>

      {/* Plants Grid - Nuevo Diseño con Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => {
          // Datos del API (reales)
          const genToday = parseFloat(plant.gen_today) || 0;
          const consumoToday = parseFloat(plant.consumo_today) || 0;
          const autoconsumoToday = parseFloat(plant.autoconsumo_today) || 0;
          const exportToday = parseFloat(plant.export_today) || 0;
          const importToday = parseFloat(plant.import_today) || 0;
          const genMonth = parseFloat(plant.gen_month) || 0;
          const genYear = parseFloat(plant.gen_year) || 0;
          const capacity = parseFloat(plant.capacity) || 0;

          // Porcentajes de distribución de producción
          const pctAutoconsumoProduccion = genToday > 0 ? Math.round((autoconsumoToday / genToday) * 100) : 0;
          const pctExportacion = genToday > 0 ? Math.round((exportToday / genToday) * 100) : 0;

          // Porcentajes de distribución de consumo
          const pctAutoconsumoConsumo = consumoToday > 0 ? Math.round((autoconsumoToday / consumoToday) * 100) : 0;
          const pctImportacion = consumoToday > 0 ? Math.round((importToday / consumoToday) * 100) : 0;

          // Objetivos (del backend - ya calculados con días correctos)
          const targetDay = parseFloat(plant.obj_today) || calculateTarget(capacity, 1);
          const targetMonth = parseFloat(plant.obj_month) || 0;
          const targetYearFull = parseFloat(plant.obj_year) || 0; // Objetivo anual completo (365 días)

          // Calcular días transcurridos del año para objetivo YTD proporcional
          const today = new Date();
          const startOfYear = new Date(today.getFullYear(), 0, 1);
          const daysElapsedYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const targetYearYTD = (targetYearFull / 365) * daysElapsedYear; // Objetivo proporcional

          const complianceDay = calcCompliance(genToday, targetDay);
          const complianceMonth = calcCompliance(genMonth, targetMonth);
          const complianceYear = calcCompliance(genYear, targetYearYTD); // Comparar con objetivo YTD, no anual completo

          // Fecha formateada
          const startDate = plant.start_date
            ? new Date(plant.start_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
            : '-';

          return (
            <div
              key={plant.id}
              onClick={() => navigate(`/planta/${plant.id}`)}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-xl cursor-pointer transition-all group"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{plant.name}</h3>
                  <p className="text-sm text-muted-foreground">{capacity} kWp • {plant.location}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${plant.status === 'active'
                  ? 'bg-success/10 text-success'
                  : plant.status === 'warning'
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${plant.status === 'active'
                    ? 'bg-green-500'
                    : plant.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`}></span>
                  {plant.status === 'active' ? 'Online' : plant.status === 'warning' ? 'Alerta' : 'Offline'}
                </span>
              </div>

              {/* Contenido Principal - Dos Columnas */}
              <div className="grid grid-cols-2 gap-4">
                {/* Columna Izquierda: Producción y Consumo con Donut Charts */}
                <div className="space-y-4">
                  {/* PRODUCCIÓN HOY - Verde (autoconsumo) + Naranja (exportación) */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Producción</p>
                    <div className="flex items-start gap-3">
                      <DualDonutChart
                        value1={autoconsumoToday}
                        value2={exportToday}
                        color1={COLORS.autoconsumo}
                        color2={COLORS.exportacion}
                        size={70}
                        strokeWidth={7}
                        centerValue={genToday}
                        unit="kWh"
                      />
                      <div className="flex-1 space-y-1.5 text-xs pt-1">
                        {/* Autoconsumo */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.autoconsumo }}></div>
                          <span className="text-muted-foreground">Auto:</span>
                          <span className="font-semibold text-foreground ml-auto">{autoconsumoToday.toFixed(0)}</span>
                          <span style={{ color: COLORS.autoconsumo }} className="font-bold">({pctAutoconsumoProduccion}%)</span>
                        </div>
                        {/* Exportación */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.exportacion }}></div>
                          <span className="text-muted-foreground">Exp:</span>
                          <span className="font-semibold text-foreground ml-auto">{exportToday.toFixed(0)}</span>
                          <span style={{ color: COLORS.exportacion }} className="font-bold">({pctExportacion}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CONSUMO HOY - Verde (de FV) + Naranja (de la red) */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Consumo</p>
                    <div className="flex items-start gap-3">
                      <DualDonutChart
                        value1={autoconsumoToday}
                        value2={importToday}
                        color1={COLORS.autoconsumoConsumo}
                        color2={COLORS.importacion}
                        size={70}
                        strokeWidth={7}
                        centerValue={consumoToday}
                        unit="kWh"
                      />
                      <div className="flex-1 space-y-1.5 text-xs pt-1">
                        {/* Autoconsumo (De energía FV) */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.autoconsumoConsumo }}></div>
                          <span className="text-muted-foreground">Auto:</span>
                          <span className="font-semibold text-foreground ml-auto">{autoconsumoToday.toFixed(0)}</span>
                          <span style={{ color: COLORS.autoconsumoConsumo }} className="font-bold">({pctAutoconsumoConsumo}%)</span>
                        </div>
                        {/* Importación (De la red) */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.importacion }}></div>
                          <span className="text-muted-foreground">Imp:</span>
                          <span className="font-semibold text-foreground ml-auto">{importToday.toFixed(0)}</span>
                          <span style={{ color: COLORS.importacion }} className="font-bold">({pctImportacion}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Objetivos y Cumplimiento */}
                <div className="bg-muted/30 rounded-xl p-3 space-y-3 text-xs">
                  {/* Objetivo Diario */}
                  <div className="pb-2 border-b border-border">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Target className="w-3 h-3" />
                      <span className="font-medium">Día</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Objetivo:</span>
                        <span className="font-semibold text-foreground">{targetDay.toFixed(0)} kWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cumplimiento:</span>
                        <span className={`font-bold ${parseFloat(complianceDay) >= 100 ? 'text-success' : parseFloat(complianceDay) >= 80 ? 'text-amber-500' : 'text-destructive'}`}>
                          {complianceDay}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Objetivo Mensual */}
                  <div className="pb-2 border-b border-border">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="font-medium">Mes</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acumulado:</span>
                        <span className="font-semibold text-foreground">{(genMonth / 1000).toFixed(1)} MWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cumplimiento:</span>
                        <span className={`font-bold ${parseFloat(complianceMonth) >= 100 ? 'text-success' : parseFloat(complianceMonth) >= 80 ? 'text-amber-500' : 'text-destructive'}`}>
                          {complianceMonth}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Objetivo Anual */}
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-medium">Año</span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acumulado:</span>
                        <span className="font-semibold text-foreground">{(genYear / 1000).toFixed(1)} MWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cumplimiento:</span>
                        <span className={`font-bold ${parseFloat(complianceYear) >= 100 ? 'text-success' : parseFloat(complianceYear) >= 80 ? 'text-amber-500' : 'text-destructive'}`}>
                          {complianceYear}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con fecha de inicio */}
              <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>Inicio: {startDate}</span>
                <span className="mx-2">•</span>
                <span>{plant.days_in_operation || 0} días operando</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron plantas con los filtros seleccionados</p>
        </div>
      )}

      {/* Modal Nueva Planta */}
      <NewPlantModal
        isOpen={showNewPlantModal}
        onClose={() => setShowNewPlantModal(false)}
      />
    </div>
  );
}
