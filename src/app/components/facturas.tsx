import { useState, useRef } from 'react';
import {
    Upload, Eye, Download, Filter, FileText, X, Check,
    Zap, DollarSign, TrendingUp, TrendingDown, Calendar, Building2,
    ChevronDown, ChevronUp, Receipt, CreditCard, Wallet
} from 'lucide-react';
import { mockFacturas, mockPlants } from '@/data/mockData';

// Formato de dinero
const formatCOP = (val: number) => `$${val.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
const formatNumber = (val: number) => val.toLocaleString('es-CO');
const formatTarifa = (val: number) => `$${val.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Interfaz para factura completa
interface FacturaCelsia {
    id: number;
    plantId: string;
    plant: string;
    codigo?: string;
    periodo: string;
    fechaInicial?: string;
    fechaFinal?: string;
    consumoMes?: number;
    consumoImportadoKwh?: number;
    consumoImportadoPrecio?: number;
    consumoImportadoTotal?: number;
    creditoEnergiaKwh?: number;
    creditoEnergiaPrecio?: number;
    creditoEnergiaTotal?: number;
    valoracionHorariaKwh?: number;
    valoracionHorariaPrecio?: number;
    valoracionHorariaTotal?: number;
    totalExcedentesKwh?: number;
    tarifaAplicada?: number;
    generacion?: number;
    comercializacion?: number;
    transmision?: number;
    restricciones?: number;
    distribucion?: number;
    perdidas?: number;
    totalCelsia?: number;
    otrasEntidades?: number;
    alumbrado?: number;
    aseo?: number;
    otros?: number;
    saldoAnterior?: number;
    saldoAcumulado?: number;
    totalPagar?: number;
    sinSolar: number;
    conSolar: number;
    ahorro: number;
}

export function Facturas() {
    const [filterPlant, setFilterPlant] = useState('all');
    const [filterYear, setFilterYear] = useState('2025');
    const [filterMonth, setFilterMonth] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFactura, setSelectedFactura] = useState<FacturaCelsia | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const facturas = mockFacturas as FacturaCelsia[];

    const filteredFacturas = facturas.filter(f => {
        const matchPlant = filterPlant === 'all' || f.plantId === filterPlant;
        const matchYear = f.periodo.includes(filterYear);
        const matchMonth = filterMonth === 'all' || f.periodo.toLowerCase().includes(filterMonth.toLowerCase());
        return matchPlant && matchYear && matchMonth;
    });

    // Totales
    const totals = filteredFacturas.reduce((acc, f) => ({
        consumo: acc.consumo + (f.consumoMes || 0),
        importacion: acc.importacion + (f.consumoImportadoKwh || 0),
        exportacion: acc.exportacion + (f.creditoEnergiaKwh || 0),
        sinSolar: acc.sinSolar + f.sinSolar,
        conSolar: acc.conSolar + f.conSolar,
        ahorro: acc.ahorro + f.ahorro,
        totalPagar: acc.totalPagar + (f.totalPagar || 0),
        saldoAcumulado: acc.saldoAcumulado + (f.saldoAcumulado || 0),
    }), { consumo: 0, importacion: 0, exportacion: 0, sinSolar: 0, conSolar: 0, ahorro: 0, totalPagar: 0, saldoAcumulado: 0 });

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Simular upload y procesamiento OCR
            setTimeout(() => {
                setUploadSuccess(true);
                setTimeout(() => {
                    setShowUploadModal(false);
                    setUploadSuccess(false);
                }, 2000);
            }, 1500);
        }
    };

    const toggleRowExpand = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-primary" />
                        Facturas Celsia
                    </h1>
                    <p className="text-muted-foreground">Gestión completa de facturas de energía - Autogeneradores</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <Upload className="w-4 h-4" />
                    Cargar Factura PDF
                </button>
            </div>

            {/* KPIs Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Facturas del Período</span>
                    </div>
                    <p className="text-2xl font-bold">{filteredFacturas.length}</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total a Pagar</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600">{formatCOP(totals.totalPagar)}</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Ahorro Consolidado</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{formatCOP(totals.ahorro)}</p>
                </div>
                <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm text-white/80">Saldo Acumulado Total</span>
                    </div>
                    <p className="text-2xl font-bold">{formatCOP(totals.saldoAcumulado)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filtrar:</span>
                </div>
                <select
                    value={filterPlant}
                    onChange={(e) => setFilterPlant(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">Todas las plantas</option>
                    {mockPlants.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>
                <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">Todos los meses</option>
                    <option value="ene">Enero</option>
                    <option value="feb">Febrero</option>
                    <option value="mar">Marzo</option>
                    <option value="abr">Abril</option>
                    <option value="may">Mayo</option>
                    <option value="jun">Junio</option>
                    <option value="jul">Julio</option>
                    <option value="ago">Agosto</option>
                    <option value="sep">Septiembre</option>
                    <option value="oct">Octubre</option>
                    <option value="nov">Noviembre</option>
                    <option value="dic">Diciembre</option>
                </select>
            </div>

            {/* Tabla de Facturas */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        Historial de Facturas Celsia
                    </h3>
                    <span className="text-xs text-muted-foreground">Click en una fila para ver detalles</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                <th className="p-4 text-left font-semibold w-8"></th>
                                <th className="p-4 text-left font-semibold">Planta</th>
                                <th className="p-4 text-left font-semibold">Código</th>
                                <th className="p-4 text-left font-semibold">Período</th>
                                <th className="p-4 text-right font-semibold">Consumo</th>
                                <th className="p-4 text-right font-semibold">Import.</th>
                                <th className="p-4 text-right font-semibold">Crédito</th>
                                <th className="p-4 text-right font-semibold">Total Celsia</th>
                                <th className="p-4 text-right font-semibold">Total Pagar</th>
                                <th className="p-4 text-right font-semibold">Ahorro</th>
                                <th className="p-4 text-center font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFacturas.map((factura) => (
                                <>
                                    <tr
                                        key={factura.id}
                                        className={`border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${expandedRows.includes(factura.id) ? 'bg-primary/5' : ''}`}
                                        onClick={() => toggleRowExpand(factura.id)}
                                    >
                                        <td className="p-4">
                                            {expandedRows.includes(factura.id) ?
                                                <ChevronUp className="w-4 h-4 text-primary" /> :
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            }
                                        </td>
                                        <td className="p-4 font-medium">{factura.plant}</td>
                                        <td className="p-4 text-muted-foreground font-mono text-xs">{factura.codigo || '-'}</td>
                                        <td className="p-4">{factura.periodo}</td>
                                        <td className="p-4 text-right">{formatNumber(factura.consumoMes || 0)} kWh</td>
                                        <td className="p-4 text-right text-amber-600">{formatNumber(factura.consumoImportadoKwh || 0)} kWh</td>
                                        <td className="p-4 text-right text-emerald-600">{formatNumber(factura.creditoEnergiaKwh || 0)} kWh</td>
                                        <td className="p-4 text-right font-medium">{formatCOP(factura.totalCelsia || factura.conSolar)}</td>
                                        <td className="p-4 text-right font-bold text-primary">{formatCOP(factura.totalPagar || factura.conSolar)}</td>
                                        <td className="p-4 text-right font-bold text-emerald-600">{formatCOP(factura.ahorro)}</td>
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => setSelectedFactura(factura)}
                                                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <Eye className="w-3 h-3 inline mr-1" />
                                                Detalle
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Fila expandible con detalles rápidos */}
                                    {expandedRows.includes(factura.id) && (
                                        <tr key={`exp-${factura.id}`} className="bg-muted/10">
                                            <td colSpan={11} className="p-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
                                                    <div className="bg-white dark:bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-muted-foreground mb-1">Tarifa Aplicada</p>
                                                        <p className="font-bold">{formatTarifa(factura.tarifaAplicada || 0)}/kWh</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-muted-foreground mb-1">Valoración Horaria</p>
                                                        <p className="font-bold">{formatCOP(factura.valoracionHorariaTotal || 0)}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-muted-foreground mb-1">Excedentes (kWh)</p>
                                                        <p className="font-bold text-emerald-600">{formatNumber(factura.totalExcedentesKwh || 0)}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-muted-foreground mb-1">Otras Entidades</p>
                                                        <p className="font-bold">{formatCOP(factura.otrasEntidades || 0)}</p>
                                                    </div>
                                                    <div className="bg-white dark:bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-muted-foreground mb-1">Saldo Anterior</p>
                                                        <p className={`font-bold ${(factura.saldoAnterior || 0) < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                            {formatCOP(factura.saldoAnterior || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                                                        <p className="text-primary mb-1 font-medium">Saldo Acumulado</p>
                                                        <p className="font-bold text-primary">{formatCOP(factura.saldoAcumulado || 0)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                            {/* Fila de totales */}
                            <tr className="bg-muted/50 font-bold">
                                <td className="p-4"></td>
                                <td className="p-4">TOTAL</td>
                                <td className="p-4"></td>
                                <td className="p-4">{filterMonth === 'all' ? 'Período' : filterMonth} {filterYear}</td>
                                <td className="p-4 text-right">{formatNumber(totals.consumo)} kWh</td>
                                <td className="p-4 text-right">{formatNumber(totals.importacion)} kWh</td>
                                <td className="p-4 text-right">{formatNumber(totals.exportacion)} kWh</td>
                                <td className="p-4 text-right">{formatCOP(totals.conSolar)}</td>
                                <td className="p-4 text-right text-primary">{formatCOP(totals.totalPagar)}</td>
                                <td className="p-4 text-right text-emerald-600">
                                    {formatCOP(totals.ahorro)} ({totals.sinSolar > 0 ? ((totals.ahorro / totals.sinSolar) * 100).toFixed(0) : 0}%)
                                </td>
                                <td className="p-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Cargar Factura */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Cargar Factura PDF</h2>
                            <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {!uploadSuccess ? (
                                <>
                                    <div
                                        onClick={handleUploadClick}
                                        className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                                    >
                                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-sm font-medium mb-1">Arrastra tu factura Celsia o haz clic para subir</p>
                                        <p className="text-xs text-muted-foreground">PDF, máximo 10MB</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf"
                                        className="hidden"
                                    />

                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                            <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                                            <span>
                                                <strong>Procesamiento automático:</strong> El sistema detectará automáticamente el tipo de factura (Modelo Nuevo o Viejo) y extraerá todos los datos usando OCR inteligente.
                                            </span>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <Check className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <p className="font-bold text-lg text-emerald-600">¡Factura procesada exitosamente!</p>
                                    <p className="text-sm text-muted-foreground mt-2">Extrayendo datos con OCR...</p>
                                    <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ver Factura Completa */}
            {selectedFactura !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-xl overflow-hidden my-8">
                        <div className="flex justify-between items-center p-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                            <div>
                                <h2 className="text-xl font-bold">Detalle de Factura Celsia</h2>
                                <p className="text-sm text-muted-foreground">{selectedFactura.plant} - {selectedFactura.periodo}</p>
                            </div>
                            <button onClick={() => setSelectedFactura(null)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Encabezado */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Código Cuenta</p>
                                    <p className="font-bold font-mono">{selectedFactura.codigo}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Fecha Inicial</p>
                                    <p className="font-bold">{selectedFactura.fechaInicial}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Fecha Final</p>
                                    <p className="font-bold">{selectedFactura.fechaFinal}</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Tarifa Aplicada</p>
                                    <p className="font-bold text-primary">{formatTarifa(selectedFactura.tarifaAplicada || 0)}/kWh</p>
                                </div>
                            </div>

                            {/* Consumos y Créditos */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Autogenerador - Consumos y Créditos
                                </h4>
                                <div className="bg-white dark:bg-muted/20 rounded-xl border border-border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr className="text-xs uppercase text-muted-foreground">
                                                <th className="p-3 text-left">Concepto</th>
                                                <th className="p-3 text-right">kWh</th>
                                                <th className="p-3 text-right">Precio ($/kWh)</th>
                                                <th className="p-3 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            <tr>
                                                <td className="p-3 font-medium">Consumo Importado</td>
                                                <td className="p-3 text-right">{formatNumber(selectedFactura.consumoImportadoKwh || 0)}</td>
                                                <td className="p-3 text-right">{formatTarifa(selectedFactura.consumoImportadoPrecio || 0)}</td>
                                                <td className="p-3 text-right font-bold text-amber-600">{formatCOP(selectedFactura.consumoImportadoTotal || 0)}</td>
                                            </tr>
                                            <tr className="bg-emerald-50 dark:bg-emerald-900/10">
                                                <td className="p-3 font-medium text-emerald-700 dark:text-emerald-400">Crédito de Energía</td>
                                                <td className="p-3 text-right">{formatNumber(selectedFactura.creditoEnergiaKwh || 0)}</td>
                                                <td className="p-3 text-right">{formatTarifa(selectedFactura.creditoEnergiaPrecio || 0)}</td>
                                                <td className="p-3 text-right font-bold text-emerald-600">{formatCOP(selectedFactura.creditoEnergiaTotal || 0)}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-medium">Valoración Horaria</td>
                                                <td className="p-3 text-right">{formatNumber(selectedFactura.valoracionHorariaKwh || 0)}</td>
                                                <td className="p-3 text-right">{formatTarifa(selectedFactura.valoracionHorariaPrecio || 0)}</td>
                                                <td className="p-3 text-right font-bold">{formatCOP(selectedFactura.valoracionHorariaTotal || 0)}</td>
                                            </tr>
                                            <tr className="bg-muted/30">
                                                <td className="p-3 font-bold" colSpan={3}>Total Excedentes Exportados</td>
                                                <td className="p-3 text-right font-bold text-emerald-600">{formatNumber(selectedFactura.totalExcedentesKwh || 0)} kWh</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Tarifas Unitarias */}
                            <div>
                                <h4 className="font-bold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Composición de Tarifa ($/kWh)
                                </h4>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Generación</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.generacion || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Comercializ.</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.comercializacion || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Transmisión</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.transmision || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Restricciones</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.restricciones || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Distribución</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.distribucion || 0)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                        <p className="text-[10px] text-muted-foreground uppercase">Pérdidas</p>
                                        <p className="font-bold text-sm">{formatTarifa(selectedFactura.perdidas || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Totales */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-sm uppercase text-muted-foreground mb-3">Otras Entidades</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                                            <span>Alumbrado Público</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.alumbrado || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                                            <span>Aseo</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.aseo || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                                            <span>Otros (Seguridad, etc.)</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.otros || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-muted/50 rounded font-bold">
                                            <span>Total Otras Entidades</span>
                                            <span>{formatCOP(selectedFactura.otrasEntidades || 0)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-sm uppercase text-muted-foreground mb-3">Resumen de Pago</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                                            <span>Total Celsia</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.totalCelsia || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-muted/30 rounded">
                                            <span>Otras Entidades</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.otrasEntidades || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded text-emerald-700 dark:text-emerald-400">
                                            <span>Saldo Anterior</span>
                                            <span className="font-medium">{formatCOP(selectedFactura.saldoAnterior || 0)}</span>
                                        </div>
                                        <div className="flex justify-between p-4 bg-primary text-white rounded-xl font-bold text-lg">
                                            <span>TOTAL A PAGAR</span>
                                            <span>{formatCOP(selectedFactura.totalPagar || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comparación Ahorro */}
                            <div className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900">
                                <h4 className="font-bold mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    Impacto del Sistema Solar
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Sin Paneles (Proyectado)</p>
                                        <p className="text-xl font-bold text-rose-600">{formatCOP(selectedFactura.sinSolar)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Con Paneles (Real)</p>
                                        <p className="text-xl font-bold text-blue-600">{formatCOP(selectedFactura.conSolar)}</p>
                                    </div>
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-xl p-3">
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">Ahorro del Mes</p>
                                        <p className="text-2xl font-bold text-emerald-600">{formatCOP(selectedFactura.ahorro)}</p>
                                        <p className="text-xs text-emerald-600 mt-1">
                                            {((selectedFactura.ahorro / selectedFactura.sinSolar) * 100).toFixed(0)}% de reducción
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Saldo Acumulado */}
                            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-primary font-medium">Saldo a Favor Acumulado</p>
                                    <p className="text-xs text-muted-foreground">Créditos disponibles para próximas facturas</p>
                                </div>
                                <p className="text-2xl font-bold text-primary">{formatCOP(selectedFactura.saldoAcumulado || 0)}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-muted/30 border-t border-border flex justify-between">
                            <button
                                onClick={() => setSelectedFactura(null)}
                                className="px-5 py-2.5 text-sm font-medium hover:bg-muted rounded-xl border border-border"
                            >
                                Cerrar
                            </button>
                            <button className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                Descargar PDF Original
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
