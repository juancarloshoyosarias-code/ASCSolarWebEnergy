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
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(num);
};

const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
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
        celsia_kwh: acc.celsia_kwh + (r.import_celsia_kwh || 0),
        fusion_kwh: acc.fusion_kwh + (r.import_fusion_kwh || 0),
        desfase_kwh: acc.desfase_kwh + (r.desfase_kwh || 0),
        desfase_cop: acc.desfase_cop + (r.desfase_cop || 0)
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
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Diferencias vs OR</h1>
                    <p className="text-muted-foreground mt-1">
                        Comparativo Importación Celsia vs FusionSolar (Operador de Red)
                    </p>
                </div>
                <Badge variant={desfaseGlobal > 0 ? "destructive" : "default"} className="text-lg px-4 py-2">
                    <Scale className="w-5 h-5 mr-2" />
                    Desfase Global: {formatNumber(Math.abs(desfaseGlobal))} kWh ({desfasePct}%)
                </Badge>
            </div>

            {/* Cards Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Import Celsia (kWh)</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totales.celsia_kwh)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Según facturas comercializador</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Import FusionSolar (kWh)</CardDescription>
                        <CardTitle className="text-2xl">{formatNumber(data.totales.fusion_kwh)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Según medidor inversor</p>
                    </CardContent>
                </Card>

                <Card className={desfaseGlobal > 0 ? "border-destructive" : "border-green-500"}>
                    <CardHeader className="pb-2">
                        <CardDescription>Desfase Total (kWh)</CardDescription>
                        <CardTitle className={`text-2xl flex items-center gap-2 ${desfaseGlobal > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {desfaseGlobal > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            {desfaseGlobal > 0 ? '+' : ''}{formatNumber(data.totales.desfase_kwh)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            {desfaseGlobal > 0 ? 'Celsia cobra MÁS que FusionSolar' : 'Celsia cobra MENOS'}
                        </p>
                    </CardContent>
                </Card>

                <Card className={desfaseGlobal > 0 ? "border-destructive" : "border-green-500"}>
                    <CardHeader className="pb-2">
                        <CardDescription>Impacto Económico (COP)</CardDescription>
                        <CardTitle className={`text-2xl ${desfaseGlobal > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(data.totales.desfase_cop))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            {desfaseGlobal > 0 ? 'Sobrecosto por diferencia' : 'Ahorro por diferencia'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Resumen por Planta */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Desfase por Planta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Desfase por Año</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>
            </div>

            {/* Detalle Mensual */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Detalle Mensual</CardTitle>
                        <div className="flex gap-4">
                            <Select value={filtroPlanta} onValueChange={setFiltroPlanta}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filtrar por planta" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las plantas</SelectItem>
                                    {data.plantas.map(p => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={filtroAnio} onValueChange={setFiltroAnio}>
                                <SelectTrigger className="w-32">
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
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                        <span className="font-semibold">
                            Totales ({registrosFiltrados.length} registros)
                        </span>
                        <div className="flex gap-8">
                            <span>Celsia: <strong>{formatNumber(totalesFiltrados.celsia_kwh)}</strong> kWh</span>
                            <span>Fusion: <strong>{formatNumber(totalesFiltrados.fusion_kwh)}</strong> kWh</span>
                            <span className={totalesFiltrados.desfase_kwh > 0 ? 'text-destructive' : 'text-green-600'}>
                                Desfase: <strong>{formatNumber(totalesFiltrados.desfase_kwh)}</strong> kWh
                            </span>
                            <span className={totalesFiltrados.desfase_cop > 0 ? 'text-destructive' : 'text-green-600'}>
                                <strong>{formatCurrency(totalesFiltrados.desfase_cop)}</strong>
                            </span>
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
