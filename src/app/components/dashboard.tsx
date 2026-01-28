import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign,
  Receipt, Calendar, Factory, Clock, BadgeDollarSign
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { mockFinancialData } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { plantService } from '../../services/plantService';

// Formateadores
const formatCOP = (value: number): string => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toLocaleString('es-CO', { maximumFractionDigits: 0 })}M`;
  return `$${value.toLocaleString('es-CO')}`;
};

const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  return `$${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
};

const formatNumber = (value: number): string => value.toLocaleString('es-CO', { maximumFractionDigits: 0 });

export function Dashboard() {
  const navigate = useNavigate();

  // Estado para datos reales
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [investmentData, setInvestmentData] = useState<any>(null);
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    totalGenGWh: 0
  });
  const [genHistory, setGenHistory] = useState<any[]>([]);
  const [genParams, setGenParams] = useState<any>({ totalKwp: 620, hpsRef: 4.0, prRef: 0.90, metaMensual: 67000 });
  const [energyDist, setEnergyDist] = useState<any[]>([]);
  const [energyResumen, setEnergyResumen] = useState<any[]>([]);

  // Cargar datos reales al montar
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Cargar Plantas
        const plantsData = await (await fetch('/api/plants')).json();
        setPlants(plantsData);

        // 2. Cargar Resumen de Inversión (NUEVO endpoint con lógica certificada)
        const invSummary = await plantService.getInvestmentSummary();
        setInvestmentData(invSummary);

        // 3. Cargar Historia Financiera (para gráfica o totales legacy)
        const history = await plantService.getFinancialHistory();
        let totalRev = 0;
        let totalGen = 0;
        history.forEach((h: any) => {
          totalRev += (Number(h.income_surplus) || 0);
          totalGen += (Number(h.total_consumption_kwh) || 0);
        });
        setFinancials({
          totalRevenue: totalRev,
          totalGenGWh: totalGen / 1000000
        });

        // 4. Cargar Historia de Generación (Gráfica)
        const genResponse = await plantService.getGenerationHistory();
        setGenHistory(genResponse.data || []);
        if (genResponse.parametros) {
          setGenParams(genResponse.parametros);
        }

        // 5. Cargar Distribución de Energía (Autoconsumo vs Exportación)
        const distResponse = await plantService.getEnergyDistribution();
        setEnergyDist(distResponse.data || []);
        setEnergyResumen(distResponse.resumen || []);

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data", error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Valores para UI (con fallback a 0 si cargando)
  const invTotal = investmentData?.inversion?.total || 0;
  const ahorroTotal = investmentData?.ingresos?.total_operativo || 0; // Ahorro Energía + Excedentes
  const beneficioTribTotal = investmentData?.beneficios_tributarios?.total || 0;

  // "Retorno Total" = Ahorro Operativo + Beneficios Tributarios
  const retornoTotal = ahorroTotal + beneficioTribTotal;

  // Payback (desde indicadores_reales)
  const paybackCon = investmentData?.indicadores_reales?.payback_con_beneficios || 0;
  const paybackSin = investmentData?.indicadores_reales?.payback_sin_beneficios || 0;
  const roi = investmentData?.indicadores_reales?.roi_porcentaje || 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Vista consolidada (Datos Reales Certificados)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Actualizado Hoy</span>
          </div>
        </div>
      </div>

      {/* KPIs Principales (Reales) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

        {/* Ingresos Históricos (Excedentes Facturados) */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <BadgeDollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium border border-white/20">
              Celsia
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Excedentes Facturados</p>
            <h3 className="text-3xl font-bold">{formatCurrency(investmentData?.ingresos?.cobros_celsia || 0)}</h3>
            <div className="mt-2 text-xs text-white/70 space-y-1">
              <p>Por cobrar: <span className="font-semibold text-white">{formatCurrency(investmentData?.ingresos?.saldo_por_cobrar || 0)}</span></p>
              <p>Datos hasta: <span className="font-semibold text-white">{investmentData?.ingresos?.ultimo_mes_celsia} {investmentData?.ingresos?.ultimo_anio_celsia}</span></p>
            </div>
          </div>
        </div>

        {/* Retorno Total (Ahorro Energía + Beneficios) */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-success/10 text-success px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              <span>Total</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-1">Retorno Total del Proyecto</p>
          <p className="text-3xl font-bold text-foreground">{formatCOP(retornoTotal)}</p>
          <div className="mt-2 text-xs text-muted-foreground flex flex-col gap-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Ahorro Energía: <span className="font-semibold text-foreground">{formatCOP(ahorroTotal)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Beneficios Trib.: <span className="font-semibold text-foreground">{formatCOP(beneficioTribTotal)}</span>
            </span>
          </div>
        </div>

        {/* ROI Promedio */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-1">ROI Proyectado</p>
          <p className="text-3xl font-bold text-foreground">{roi}%</p>
          <p className="text-muted-foreground text-xs mt-1">Rentabilidad sobre Inversión</p>
        </div>

        {/* Inversión Total */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Factory className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm mb-1">Inversión Bruta Total</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">{formatCurrency(invTotal)}</p>
            <span className="text-xs text-success font-medium mb-2">{plants.length} Plantas</span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">CAPEX Inicial</p>
        </div>
      </div>


      {/* KPI Secundarios (Tributarios y Payback) - 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Columna Izquierda: Beneficios Tributarios (2 tarjetas apiladas) */}
        <div className="flex flex-col gap-4">
          {/* Beneficio Renta */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-success/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Beneficio Renta (50% × 35%)</p>
              <p className="text-xl font-bold text-success">{formatCOP(investmentData?.beneficios_tributarios?.ahorro_renta_50 || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Deducción del 50% de la inversión sobre tarifa del 35%</p>
            </div>
          </div>

          {/* Beneficio Depreciación Acelerada */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Beneficio Depreciación Acelerada</p>
              <p className="text-xl font-bold text-blue-600">{formatCOP(investmentData?.beneficios_tributarios?.ahorro_depreciacion_5anos || 0)}</p>
              <p className="text-[10px] text-muted-foreground">Valor Presente escudo fiscal (5 años)</p>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Payback (tarjeta grande con REAL y PROYECTADO) */}
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Período de Retorno (Payback)</h3>
              <p className="text-xs text-muted-foreground">Tiempo estimado para recuperar la inversión</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* REAL */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-xs font-semibold text-amber-700 uppercase">Real (Operación)</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Con beneficios:</span>
                  <span className="text-2xl font-bold text-amber-600">{paybackCon} <span className="text-sm font-normal">años</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Sin beneficios:</span>
                  <span className="text-xl font-semibold text-amber-500">{paybackSin} <span className="text-sm font-normal">años</span></span>
                </div>
              </div>
            </div>

            {/* PROYECTADO */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-xs font-semibold text-blue-700 uppercase">Proyectado</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Con beneficios:</span>
                  <span className="text-2xl font-bold text-blue-600">{investmentData?.indicadores_proyectados?.payback_con_beneficios || 0} <span className="text-sm font-normal">años</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Sin beneficios:</span>
                  <span className="text-xl font-semibold text-blue-500">{investmentData?.indicadores_proyectados?.payback_sin_beneficios || 0} <span className="text-sm font-normal">años</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generación Histórica */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-2">Generación Histórica (kWh)</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Meta: {genParams.totalKwp} kWp × {genParams.hpsRef} HPS × {(genParams.prRef * 100).toFixed(0)}% PR = {formatNumber(genParams.metaMensual)} kWh/mes
          </p>
          {genHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={genHistory} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: number) => formatNumber(val) + ' kWh'}
                  labelFormatter={(label) => label}
                />
                <Legend />
                {/* Línea de referencia: Meta mensual promedio */}
                <ReferenceLine
                  y={genParams.metaMensual}
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  label={{ value: `Meta ${formatNumber(genParams.metaMensual / 1000)}k`, position: 'right', fill: '#10B981', fontSize: 10 }}
                />
                <Bar dataKey="year2023" name="2023" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="year2024" name="2024" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="year2025" name="2025" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="year2026" name="2026" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <Clock className="w-5 h-5 animate-spin mr-2" /> Cargando gráfica...
            </div>
          )}
        </div>

        {/* Distribución de Energía (Datos Reales) */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-bold text-foreground mb-2">Distribución de Energía (kWh)</h3>
          <div className="flex gap-4 text-xs text-muted-foreground mb-4">
            {energyResumen.slice(-3).map((r: any) => (
              <span key={r.year} className="flex items-center gap-1">
                <span className="font-bold text-foreground">{r.year}:</span>
                <span className="text-emerald-500">{r.pctAutoconsumo}% Auto</span> /
                <span className="text-amber-500">{r.pctExportacion}% Exp</span>
              </span>
            ))}
          </div>
          {energyDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={energyDist} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatNumber(val) + ' kWh'} />
                <Legend />
                <Area type="monotone" dataKey="autoconsumo" name="Autoconsumo" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="exportacion" name="Exportación" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <Clock className="w-5 h-5 animate-spin mr-2" /> Cargando...
            </div>
          )}
        </div >
      </div >

      {/* Tabla Resumen de Plantas (REAL) */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden" >
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-foreground">Resumen de Plantas ({plants.length})</h3>
          <button
            onClick={() => navigate('/plantas')}
            className="text-sm text-primary hover:underline"
          >
            Ver todas →
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 animate-spin" />
              Cargando datos en tiempo real...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs uppercase">
                  <th className="p-4 text-left font-semibold">Planta</th>
                  <th className="p-4 text-right font-semibold">Capacidad</th>
                  <th className="p-4 text-center font-semibold">Fecha Inicio</th>
                  <th className="p-4 text-right font-semibold">Días Operación</th>
                  <th className="p-4 text-right font-semibold">% Autoconsumo</th>
                  <th className="p-4 text-right font-semibold">% Exportación</th>
                  <th className="p-4 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {plants.map((plant: any) => {
                  const startDate = plant.start_date ? new Date(plant.start_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                  return (
                    <tr
                      key={plant.id}
                      onClick={() => navigate(`/planta/${plant.id}`)}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-foreground">{plant.name}</p>
                        <p className="text-xs text-muted-foreground">{plant.location}</p>
                      </td>
                      <td className="p-4 text-right font-medium">{plant.capacity} kWp</td>
                      <td className="p-4 text-center text-muted-foreground">{startDate}</td>
                      <td className="p-4 text-right font-medium">{formatNumber(plant.days_in_operation || 0)}</td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-600 font-semibold">{plant.pct_autoconsumo || 0}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-amber-600 font-semibold">{plant.pct_exportacion || 0}%</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${plant.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          plant.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                          {plant.status === 'active' ? 'Online' : plant.status === 'warning' ? 'Revisar' : 'Offline'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div >
    </div >
  );
}
