import { useState } from 'react';
import {
    Plus, Search, Filter, Wallet, Building2, Globe, Calendar,
    Trash2, FileText, CheckCircle, AlertCircle, Repeat, Clock, HelpCircle, TrendingUp
} from 'lucide-react';
import { mockPlants, mockOperationalCosts } from '@/data/mockData';

// Tipos
type CostCategory = 'Vigilancia' | 'Administración' | 'Internet' | 'Mantenimiento' | 'Agua' | 'Seguros' | 'Limpieza' | 'Otros';
type AssignmentType = 'GLOBAL' | 'SPECIFIC';
type RecurrenceType = 'Mensual' | 'Bimensual' | 'Trimestral' | 'Semestral' | 'Anual' | 'Única Vez' | 'Extraordinario';

interface CostRecord {
    id: string;
    concept: string;
    category: CostCategory;
    amount: number;
    date: string;
    assignment: AssignmentType;
    plantId?: string;
    recurrence: RecurrenceType;
}

const formatCOP = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function OperationalCosts() {
    const [costs, setCosts] = useState<CostRecord[]>(mockOperationalCosts as unknown as CostRecord[]);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState({
        concept: '',
        category: 'Mantenimiento' as CostCategory,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        assignment: 'GLOBAL' as AssignmentType,
        plantId: mockPlants[0]?.id || '1',
        recurrence: 'Mensual' as RecurrenceType
    });

    const categories: CostCategory[] = ['Vigilancia', 'Administración', 'Internet', 'Mantenimiento', 'Agua', 'Seguros', 'Limpieza', 'Otros'];
    const recurrences: RecurrenceType[] = ['Mensual', 'Bimensual', 'Trimestral', 'Semestral', 'Anual', 'Única Vez', 'Extraordinario'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newRecord: CostRecord = {
            id: Date.now().toString(),
            concept: formData.concept,
            category: formData.category,
            amount: Number(formData.amount),
            date: formData.date,
            assignment: formData.assignment,
            plantId: formData.assignment === 'SPECIFIC' ? formData.plantId : undefined,
            recurrence: formData.recurrence
        };

        setCosts([newRecord, ...costs]);
        setIsFormOpen(false);
        // Reset form
        setFormData({
            concept: '',
            category: 'Mantenimiento',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            assignment: 'GLOBAL',
            plantId: mockPlants[0]?.id || '1',
            recurrence: 'Mensual'
        });
    };

    const totalOpex = costs.reduce((sum, c) => sum + c.amount, 0);

    // Helper para icono de recurrencia
    const getRecurrenceIcon = (type: RecurrenceType) => {
        if (type === 'Única Vez' || type === 'Extraordinario') return <Clock className="w-3 h-3 text-amber-500" />;
        return <Repeat className="w-3 h-3 text-blue-500" />;
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Wallet className="w-6 h-6 text-primary" />
                        Control de Costos Operativos (OPEX)
                    </h1>
                    <p className="text-muted-foreground">Gestión de gastos globales y específicos por planta.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" />
                    {isFormOpen ? 'Cancelar Registro' : 'Registrar Nuevo Gasto'}
                </button>
            </div>

            {/* KPI Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground uppercase">Total OPEX (Mes)</p>
                    <h3 className="text-3xl font-bold text-foreground mt-2">{formatCOP(totalOpex)}</h3>
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Gastos acumulados Enero
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-6 rounded-2xl shadow-sm">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase">Gastos Recurrentes (Fijos)</p>
                    <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                        {formatCOP(costs.filter(c => c.recurrence !== 'Única Vez' && c.recurrence !== 'Extraordinario').reduce((sum, c) => sum + c.amount, 0))}
                    </h3>
                    <p className="text-xs text-blue-600/70 mt-1">Costos fijos proyectados</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 p-6 rounded-2xl shadow-sm">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase">Extraordinarios / Única Vez</p>
                    <h3 className="text-3xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                        {formatCOP(costs.filter(c => c.recurrence === 'Única Vez' || c.recurrence === 'Extraordinario').reduce((sum, c) => sum + c.amount, 0))}
                    </h3>
                    <p className="text-xs text-amber-600/70 mt-1">Gastos puntuales del mes</p>
                </div>
            </div>

            {/* Formulario de Registro */}
            {isFormOpen && (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Registrar Nuevo Gasto
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Concepto / Descripción</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ej: Pago vigilancia enero..."
                                    className="w-full p-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={formData.concept}
                                    onChange={e => setFormData({ ...formData, concept: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monto (COP)</label>
                                    <input
                                        required
                                        type="number"
                                        placeholder="0"
                                        className="w-full p-2 rounded-lg border border-input bg-background outline-none"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fecha</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full p-2 rounded-lg border border-input bg-background outline-none"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoría</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-input bg-background outline-none"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as CostCategory })}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                                        Frecuencia
                                        <span title="Define si será un gasto recurrente">
                                            <HelpCircle className="w-3 h-3 text-muted-foreground" />
                                        </span>
                                    </label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-input bg-background outline-none"
                                        value={formData.recurrence}
                                        onChange={e => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
                                    >
                                        {recurrences.map(rec => <option key={rec} value={rec}>{rec}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-border">
                            <label className="block text-sm font-bold mb-2">Asignación del Costo</label>

                            <div className="flex gap-4 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, assignment: 'GLOBAL' })}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.assignment === 'GLOBAL'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700'
                                            : 'border-transparent bg-white dark:bg-card text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Globe className="w-6 h-6" />
                                    <span className="text-sm font-bold">Global / Holding</span>
                                    <span className="text-[10px] opacity-70">Aplica a todos los proyectos</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, assignment: 'SPECIFIC' })}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.assignment === 'SPECIFIC'
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700'
                                            : 'border-transparent bg-white dark:bg-card text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Building2 className="w-6 h-6" />
                                    <span className="text-sm font-bold">Planta Específica</span>
                                    <span className="text-[10px] opacity-70">Gasto puntual (ej. reparación)</span>
                                </button>
                            </div>

                            {formData.assignment === 'SPECIFIC' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Seleccionar Planta</label>
                                    <div className="mb-2 p-2 bg-amber-50 text-amber-800 text-xs rounded border border-amber-200 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>Este gasto se registrará automáticamente en la <strong>Bitácora de Mantenimiento</strong> de la planta seleccionada.</p>
                                    </div>
                                    <select
                                        className="w-full p-2 rounded-lg border border-amber-200 bg-white outline-none"
                                        value={formData.plantId}
                                        onChange={e => setFormData({ ...formData, plantId: e.target.value })}
                                    >
                                        {mockPlants.map(plant => (
                                            <option key={plant.id} value={plant.id}>{plant.name} ({plant.location})</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-95"
                            >
                                Guardar Gasto
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tabla de Costos */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        Historial de Costos Registrados
                    </h3>
                    {/* Filtros Simples */}
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" placeholder="Buscar concepto..." className="pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <button className="p-2 border border-input rounded-lg hover:bg-muted text-muted-foreground">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr className="text-left text-xs uppercase text-muted-foreground font-semibold">
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Concepto</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Frecuencia</th>
                                <th className="p-4">Asignación</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {costs.map((cost) => (
                                <tr key={cost.id} className="hover:bg-muted/10 group transition-colors">
                                    <td className="p-4 text-muted-foreground whitespace-nowrap flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> {cost.date}
                                    </td>
                                    <td className="p-4 font-medium text-foreground">{cost.concept}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium border border-slate-200">
                                            {cost.category}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded w-fit">
                                            {getRecurrenceIcon(cost.recurrence)}
                                            {cost.recurrence}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {cost.assignment === 'GLOBAL' ? (
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit">
                                                <Globe className="w-3 h-3" /> Global
                                            </span>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded w-fit">
                                                    <Building2 className="w-3 h-3" /> Planta {cost.plantId}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                                                    {mockPlants.find(p => p.id === cost.plantId)?.name}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-bold text-foreground">
                                        {formatCOP(cost.amount)}
                                    </td>
                                    <td className="p-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setCosts(costs.filter(c => c.id !== cost.id))}
                                            className="p-2 hover:bg-rose-100 text-muted-foreground hover:text-rose-600 rounded-full transition-colors"
                                            title="Eliminar registro"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
