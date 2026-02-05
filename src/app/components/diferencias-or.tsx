import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, Scale, ArrowUpDown } from 'lucide-react';

interface DiferenciaRegistro {
    planta: string;
    anio: number;
    mes: string;
    fecha_inicial: string;
    fecha_final: string;
    import_celsia_kwh: number;
    import_fusion_kwh: number;
    tarifa_kwh: number;
    import_celsia_cop: number;
    desfase_kwh: number;
    desfase_cop: number;
    desfase_pct: number;
}

interface Totales {
    celsia_kwh: number;
    fusion_kwh: number;
    desfase_kwh: number;
    desfase_cop: number;
    desfase_pct: number;
    fecha_desde: string | null;
    fecha_hasta: string | null;
}

interface TotalPorPlanta {
    planta: string;
    celsia_kwh: number;
    fusion_kwh: number;
    desfase_kwh: number;
    desfase_cop: number;
}

interface TotalPorAnio {
    anio: number;
    celsia_kwh: number;
    fusion_kwh: number;
    desfase_kwh: number;
    desfase_cop: number;
}

interface DiferenciasData {
    registros: DiferenciaRegistro[];
    totales: Totales;
    totales_por_planta: TotalPorPlanta[];
    totales_por_anio: TotalPorAnio[];
    plantas: string[];
    anios: number[];
}

const formatNumber = (num: number): string => {
    const val = parseFloat(String(num)) || 0;
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(val);
};

const formatCurrency = (num: number): string => {
    const val = parseFloat(String(num)) || 0;
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

export function DiferenciasOR() {
    const [data, setData] = useState<DiferenciasData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtroPlanta, setFiltroPlanta] = useState<string>('all');
    const [filtroAnio, setFiltroAnio] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/plants/diferencias-or');
            if (!response.ok) throw new Error('Error al cargar datos');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar registros
    const registrosFiltrados = data?.registros.filter(r => {
        if (filtroPlanta !== 'all' && r.planta !== filtroPlanta) return false;
        if (filtroAnio !== 'all' && r.anio !== parseInt(filtroAnio)) return false;
        return true;
    }) || [];

    // Ordenar registros
    const registrosOrdenados = [...registrosFiltrados].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const multiplier = direction === 'asc' ? 1 : -1;
        const aVal = a[key as keyof DiferenciaRegistro];
        const bVal = b[key as keyof DiferenciaRegistro];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return (aVal - bVal) * multiplier;
        }
        return String(aVal).localeCompare(String(bVal)) * multiplier;
    });

    // Calcular totales filtrados
    const totalesFiltrados = registrosFiltrados.reduce((acc, r) => ({
        celsia_kwh: acc.celsia_kwh + (parseFloat(String(r.import_celsia_kwh)) || 0),
        fusion_kwh: acc.fusion_kwh + (parseFloat(String(r.import_fusion_kwh)) || 0),
        desfase_kwh: acc.desfase_kwh + (parseFloat(String(r.desfase_kwh)) || 0),
        desfase_cop: acc.desfase_cop + (parseFloat(String(r.desfase_cop)) || 0)
    }), { celsia_kwh: 0, fusion_kwh: 0, desfase_kwh: 0, desfase_cop: 0 });

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev?.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    if (!data) return null;

    const desfaseGlobal = data.totales.desfase_kwh;
    const desfasePct = data.totales.desfase_pct;

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Diferencias vs OR</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">
                        Comparativo Importación Celsia vs FusionSolar
                    </p>
                </div>
                <Badge variant={desfaseGlobal > 0 ? "destructive" : "default"} className="text-sm md:text-lg px-3 py-1.5 md:px-4 md:py-2 self-start md:self-auto">
                    <Scale className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Desfase Global: </span>{formatNumber(Math.abs(desfaseGlobal))} kWh
                </Badge>
            </div>

            {/* Periodo de datos */}
            {data.totales.fecha_desde && data.totales.fecha_hasta && (
                <div className="text-sm text-muted-foreground">
                    Periodo: <strong>{data.totales.fecha_desde}</strong> al <strong>{data.totales.fecha_hasta}</strong>
                </div>
            )}

            {/* Cards Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <Card>
                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">Celsia (kWh)</CardDescription>
                        <CardTitle className="text-lg md:text-2xl">{formatNumber(data.totales.celsia_kwh)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                        <p className="text-xs text-muted-foreground hidden md:block">Según facturas comercializador</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">FusionSolar (kWh)</CardDescription>
                        <CardTitle className="text-lg md:text-2xl">{formatNumber(data.totales.fusion_kwh)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                        <p className="text-xs text-muted-foreground hidden md:block">Según medidor inversor</p>
                    </CardContent>
                </Card>

                <Card className={desfaseGlobal > 0 ? "border-destructive" : "border-green-500"}>
                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">Desfase (kWh)</CardDescription>
                        <CardTitle className={`text-lg md:text-2xl flex items-center gap-1 md:gap-2 ${desfaseGlobal > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {desfaseGlobal > 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                            {desfaseGlobal > 0 ? '+' : ''}{formatNumber(data.totales.desfase_kwh)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                        <p className="text-xs text-muted-foreground hidden md:block">
                            {desfaseGlobal > 0 ? 'Celsia cobra MÁS' : 'Celsia cobra MENOS'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={desfaseGlobal > 0 ? "border-destructive" : "border-green-500"}>
                    <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">Impacto (COP)</CardDescription>
                        <CardTitle className={`text-lg md:text-2xl ${desfaseGlobal > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(data.totales.desfase_cop))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                        <p className="text-xs text-muted-foreground hidden md:block">
                            {desfaseGlobal > 0 ? 'Sobrecosto' : 'Ahorro'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen por Planta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
                            Desfase por Planta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6 md:pt-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Planta</TableHead>
                                    <TableHead className="text-right">Celsia</TableHead>
                                    <TableHead className="text-right">Fusion</TableHead>
                                    <TableHead className="text-right">Desfase kWh</TableHead>
                                    <TableHead className="text-right">Desfase COP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.totales_por_planta.map(p => (
                                    <TableRow key={p.planta}>
                                        <TableCell className="font-medium">{p.planta}</TableCell>
                                        <TableCell className="text-right">{formatNumber(p.celsia_kwh)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(p.fusion_kwh)}</TableCell>
                                        <TableCell className={`text-right font-semibold ${p.desfase_kwh > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {p.desfase_kwh > 0 ? '+' : ''}{formatNumber(p.desfase_kwh)}
                                        </TableCell>
                                        <TableCell className={`text-right ${p.desfase_cop > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {formatCurrency(p.desfase_cop)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-4 md:p-6">
                        <CardTitle className="text-base md:text-lg">Desfase por Año</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 md:p-6 md:pt-0">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Año</TableHead>
                                    <TableHead className="text-right">Celsia</TableHead>
                                    <TableHead className="text-right">Fusion</TableHead>
                                    <TableHead className="text-right">Desfase kWh</TableHead>
                                    <TableHead className="text-right">Desfase COP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.totales_por_anio.sort((a, b) => b.anio - a.anio).map(a => (
                                    <TableRow key={a.anio}>
                                        <TableCell className="font-medium">{a.anio}</TableCell>
                                        <TableCell className="text-right">{formatNumber(a.celsia_kwh)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(a.fusion_kwh)}</TableCell>
                                        <TableCell className={`text-right font-semibold ${a.desfase_kwh > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {a.desfase_kwh > 0 ? '+' : ''}{formatNumber(a.desfase_kwh)}
                                        </TableCell>
                                        <TableCell className={`text-right ${a.desfase_cop > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {formatCurrency(a.desfase_cop)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detalle Mensual */}
            <Card>
                <CardHeader className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <CardTitle className="text-base md:text-lg">Detalle Mensual</CardTitle>
                        <div className="flex gap-2 md:gap-4">
                            <Select value={filtroPlanta} onValueChange={setFiltroPlanta}>
                                <SelectTrigger className="w-36 md:w-48 text-sm">
                                    <SelectValue placeholder="Planta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    {data.plantas.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                                <SelectTrigger className="w-24 md:w-32 text-sm">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    {data.anios.map(a => (
                                        <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border max-h-[500px] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Planta</TableHead>
                                    <TableHead>Periodo</TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('import_celsia_kwh')}
                                    >
                                        <span className="flex items-center justify-end gap-1">
                                            Celsia (kWh) <ArrowUpDown className="w-3 h-3" />
                                        </span>
                                    </TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('import_fusion_kwh')}
                                    >
                                        <span className="flex items-center justify-end gap-1">
                                            Fusion (kWh) <ArrowUpDown className="w-3 h-3" />
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-right">Tarifa</TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('desfase_kwh')}
                                    >
                                        <span className="flex items-center justify-end gap-1">
                                            Desfase (kWh) <ArrowUpDown className="w-3 h-3" />
                                        </span>
                                    </TableHead>
                                    <TableHead
                                        className="text-right cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleSort('desfase_cop')}
                                    >
                                        <span className="flex items-center justify-end gap-1">
                                            Desfase (COP) <ArrowUpDown className="w-3 h-3" />
                                        </span>
                                    </TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {registrosOrdenados.map((r, idx) => (
                                    <TableRow key={`${r.planta}-${r.anio}-${r.mes}-${idx}`}>
                                        <TableCell className="font-medium">{r.planta}</TableCell>
                                        <TableCell>{r.mes} {r.anio}</TableCell>
                                        <TableCell className="text-right">{formatNumber(r.import_celsia_kwh)}</TableCell>
                                        <TableCell className="text-right">{formatNumber(r.import_fusion_kwh)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            ${formatNumber(r.tarifa_kwh)}
                                        </TableCell>
                                        <TableCell className={`text-right font-semibold ${r.desfase_kwh > 0 ? 'text-destructive' : r.desfase_kwh < 0 ? 'text-green-600' : ''}`}>
                                            {r.desfase_kwh > 0 ? '+' : ''}{formatNumber(r.desfase_kwh)}
                                        </TableCell>
                                        <TableCell className={`text-right ${r.desfase_cop > 0 ? 'text-destructive' : r.desfase_cop < 0 ? 'text-green-600' : ''}`}>
                                            {formatCurrency(r.desfase_cop)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={Math.abs(r.desfase_pct) > 10 ? "destructive" : Math.abs(r.desfase_pct) > 5 ? "secondary" : "outline"}>
                                                {r.desfase_pct > 0 ? '+' : ''}{r.desfase_pct}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totales filtrados */}
                    <div className="mt-4 p-3 md:p-4 bg-muted/50 rounded-lg">
                        <div className="flex flex-col md:flex-row justify-between gap-2 md:items-center">
                            <span className="font-semibold text-sm md:text-base">
                                Totales ({registrosFiltrados.length} reg.)
                            </span>
                            <div className="grid grid-cols-2 md:flex gap-2 md:gap-6 text-xs md:text-sm">
                                <span>Celsia: <strong>{formatNumber(totalesFiltrados.celsia_kwh)}</strong></span>
                                <span>Fusion: <strong>{formatNumber(totalesFiltrados.fusion_kwh)}</strong></span>
                                <span className={totalesFiltrados.desfase_kwh > 0 ? 'text-destructive' : 'text-green-600'}>
                                    Desfase: <strong>{formatNumber(totalesFiltrados.desfase_kwh)}</strong> kWh
                                </span>
                                <span className={totalesFiltrados.desfase_cop > 0 ? 'text-destructive' : 'text-green-600'}>
                                    <strong>{formatCurrency(totalesFiltrados.desfase_cop)}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Nota explicativa */}
            <Card className="bg-muted/30">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                            <p className="font-medium text-foreground mb-1">¿Qué significa el desfase?</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong className="text-destructive">Positivo (+):</strong> Celsia factura MÁS importación de la que registra FusionSolar. Potencial sobrecobro.</li>
                                <li><strong className="text-green-600">Negativo (-):</strong> Celsia factura MENOS importación. A favor del usuario.</li>
                                <li>Las diferencias pueden deberse a: horarios de lectura, calibración de medidores, pérdidas de red, o errores en facturación.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
