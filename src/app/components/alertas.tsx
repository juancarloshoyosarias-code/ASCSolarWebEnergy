import { useState, useMemo } from 'react';
import {
    Bell,
    Zap,
    Target,
    Wrench,
    AlertTriangle,
    Receipt,
    Activity,
    TrendingDown,
    Cpu,
    Calendar,
    PiggyBank,
    Settings,
    ChevronRight,
    X,
    Check,
    Clock,
    Filter,
    Search,
    Mail,
    Smartphone,
    MessageSquare,
    Edit3,
    Plus,
    Trash2,
    Save,
    ToggleLeft,
    ToggleRight,
    Info,
    AlertCircle,
    XCircle,
    CheckCircle
} from 'lucide-react';
import { mockAlerts, alertTypesConfig } from '@/data/mockData';
import type { Alert, AlertCategory, AlertTypeConfig, AlertRule, AlertSeverity, AlertStatus } from '@/types';

// Mapeo de iconos por categoría
const categoryIcons: Record<AlertCategory, React.ElementType> = {
    generation: Zap,
    cop: Target,
    maintenance: Wrench,
    system_failure: AlertTriangle,
    billing: Receipt,
    performance: Activity,
    degradation: TrendingDown,
    inverter: Cpu,
    expiration: Calendar,
    savings: PiggyBank
};

// Nombres de categorías en español
const categoryNames: Record<AlertCategory, string> = {
    generation: 'Generación',
    cop: 'COP',
    maintenance: 'Mantenimiento',
    system_failure: 'Fallas',
    billing: 'Facturación',
    performance: 'Rendimiento',
    degradation: 'Degradación',
    inverter: 'Inversores',
    expiration: 'Vencimientos',
    savings: 'Ahorro'
};

// Colores de severidad
const severityColors: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
    info: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' }
};

// Iconos de severidad
const severityIcons: Record<AlertSeverity, React.ElementType> = {
    info: Info,
    warning: AlertCircle,
    critical: XCircle
};

// Colores de estado
const statusColors: Record<AlertStatus, { bg: string; text: string }> = {
    active: { bg: 'bg-red-500/20', text: 'text-red-400' },
    acknowledged: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    resolved: { bg: 'bg-green-500/20', text: 'text-green-400' }
};

const statusNames: Record<AlertStatus, string> = {
    active: 'Activa',
    acknowledged: 'Reconocida',
    resolved: 'Resuelta'
};

// Formato de fecha relativa
function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

// Formato de número
function formatNumber(value: number, unit?: string): string {
    if (unit === 'COP') {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
    }
    return `${value.toLocaleString('es-CO')}${unit ? ` ${unit}` : ''}`;
}

// Tab de vista
type ViewTab = 'alerts' | 'config';

// Componente de tarjeta de alerta
function AlertCard({ alert, onAcknowledge, onResolve }: {
    alert: Alert;
    onAcknowledge: (id: string) => void;
    onResolve: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const Icon = categoryIcons[alert.category];
    const SeverityIcon = severityIcons[alert.severity];
    const config = alertTypesConfig.find(c => c.category === alert.category);

    return (
        <div
            className={`rounded-xl border ${severityColors[alert.severity].border} ${severityColors[alert.severity].bg} p-4 transition-all hover:shadow-lg cursor-pointer`}
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-start gap-4">
                {/* Icono de categoría */}
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config?.color + '20' }}
                >
                    <Icon className="w-5 h-5" style={{ color: config?.color }} />
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[alert.status].bg} ${statusColors[alert.status].text}`}>
                            {statusNames[alert.status]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[alert.severity].bg} ${severityColors[alert.severity].text} flex items-center gap-1`}>
                            <SeverityIcon className="w-3 h-3" />
                            {alert.severity === 'critical' ? 'Crítica' : alert.severity === 'warning' ? 'Advertencia' : 'Info'}
                        </span>
                    </div>

                    <h4 className="font-medium text-foreground mb-1">{alert.message}</h4>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{alert.plantName}</span>
                        <span>•</span>
                        <span>{categoryNames[alert.category]}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(alert.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Valor actual vs umbral */}
                {alert.value !== undefined && (
                    <div className="text-right flex-shrink-0">
                        <div className={`text-lg font-bold ${severityColors[alert.severity].text}`}>
                            {formatNumber(alert.value, alert.unit)}
                        </div>
                        {alert.threshold !== undefined && (
                            <div className="text-xs text-muted-foreground">
                                Umbral: {formatNumber(alert.threshold, alert.unit)}
                            </div>
                        )}
                    </div>
                )}

                {/* Chevron */}
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </div>

            {/* Contenido expandido */}
            {expanded && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    {alert.details && (
                        <p className="text-sm text-muted-foreground mb-4">{alert.details}</p>
                    )}

                    {/* Timeline de acciones */}
                    {(alert.acknowledgedAt || alert.resolvedAt) && (
                        <div className="space-y-2 mb-4">
                            {alert.acknowledgedAt && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Check className="w-4 h-4 text-amber-400" />
                                    <span>Reconocida por {alert.acknowledgedBy} - {new Date(alert.acknowledgedAt).toLocaleString('es-CO')}</span>
                                </div>
                            )}
                            {alert.resolvedAt && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span>Resuelta por {alert.resolvedBy} - {new Date(alert.resolvedAt).toLocaleString('es-CO')}</span>
                                </div>
                            )}
                            {alert.notes && (
                                <div className="text-xs text-muted-foreground bg-white/5 p-2 rounded-lg mt-2">
                                    <strong>Notas:</strong> {alert.notes}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Acciones */}
                    {alert.status !== 'resolved' && (
                        <div className="flex gap-2">
                            {alert.status === 'active' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAcknowledge(alert.id); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Reconocer
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Marcar Resuelta
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Componente de configuración de categoría
function CategoryConfigCard({
    config,
    onToggle,
    onEditRules
}: {
    config: AlertTypeConfig;
    onToggle: (id: string) => void;
    onEditRules: (config: AlertTypeConfig) => void;
}) {
    const Icon = categoryIcons[config.category];
    const activeRules = config.rules.filter(r => r.enabled).length;

    return (
        <div className={`rounded-xl border border-white/10 p-4 transition-all ${config.enabled ? 'bg-card' : 'bg-card/50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config.color + '20' }}
                    >
                        <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div>
                        <h4 className="font-medium text-foreground">{config.name}</h4>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                    </div>
                </div>

                <button
                    onClick={() => onToggle(config.id)}
                    className={`p-2 rounded-lg transition-colors ${config.enabled ? 'text-green-400' : 'text-muted-foreground'}`}
                >
                    {config.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{activeRules}</span> / {config.rules.length} reglas activas
                </div>
                <button
                    onClick={() => onEditRules(config)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <Edit3 className="w-4 h-4" />
                    Editar Reglas
                </button>
            </div>
        </div>
    );
}

// Modal de edición de reglas
function RuleEditorModal({
    config,
    onClose,
    onSave
}: {
    config: AlertTypeConfig;
    onClose: () => void;
    onSave: (config: AlertTypeConfig) => void;
}) {
    const [rules, setRules] = useState<AlertRule[]>(config.rules);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const Icon = categoryIcons[config.category];

    const handleToggleRule = (ruleId: string) => {
        setRules(rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    };

    const handleUpdateRule = (updatedRule: AlertRule) => {
        setRules(rules.map(r => r.id === updatedRule.id ? updatedRule : r));
        setEditingRule(null);
    };

    const handleSave = () => {
        onSave({ ...config, rules });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: config.color + '20' }}
                            >
                                <Icon className="w-6 h-6" style={{ color: config.color }} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{config.name}</h2>
                                <p className="text-sm text-muted-foreground">Configura las reglas de alerta</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Rules list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {rules.map(rule => (
                        <div
                            key={rule.id}
                            className={`rounded-xl border border-white/10 p-4 ${rule.enabled ? 'bg-white/5' : 'bg-white/2 opacity-60'}`}
                        >
                            {editingRule?.id === rule.id ? (
                                // Modo edición
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                                            <input
                                                type="text"
                                                value={editingRule.name}
                                                onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Severidad</label>
                                            <select
                                                value={editingRule.severity}
                                                onChange={e => setEditingRule({ ...editingRule, severity: e.target.value as AlertSeverity })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                            >
                                                <option value="info">Info</option>
                                                <option value="warning">Advertencia</option>
                                                <option value="critical">Crítica</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                                        <input
                                            type="text"
                                            value={editingRule.description}
                                            onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Operador</label>
                                            <select
                                                value={editingRule.operator}
                                                onChange={e => setEditingRule({ ...editingRule, operator: e.target.value as any })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                            >
                                                <option value="less_than">Menor que</option>
                                                <option value="greater_than">Mayor que</option>
                                                <option value="equals">Igual a</option>
                                                <option value="not_equals">Diferente de</option>
                                                <option value="between">Entre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Umbral</label>
                                            <input
                                                type="number"
                                                value={editingRule.threshold}
                                                onChange={e => setEditingRule({ ...editingRule, threshold: Number(e.target.value) })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground mb-1 block">Unidad</label>
                                            <input
                                                type="text"
                                                value={editingRule.unit || ''}
                                                onChange={e => setEditingRule({ ...editingRule, unit: e.target.value })}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={editingRule.notifyEmail}
                                                onChange={e => setEditingRule({ ...editingRule, notifyEmail: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <Mail className="w-4 h-4" /> Email
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={editingRule.notifyPush}
                                                onChange={e => setEditingRule({ ...editingRule, notifyPush: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <Smartphone className="w-4 h-4" /> Push
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={editingRule.notifySMS}
                                                onChange={e => setEditingRule({ ...editingRule, notifySMS: e.target.checked })}
                                                className="w-4 h-4 rounded"
                                            />
                                            <MessageSquare className="w-4 h-4" /> SMS
                                        </label>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdateRule(editingRule)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
                                        >
                                            <Save className="w-4 h-4" /> Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditingRule(null)}
                                            className="px-4 py-2 bg-white/10 rounded-lg text-sm"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Vista normal
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-medium text-foreground">{rule.name}</h5>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[rule.severity].bg} ${severityColors[rule.severity].text}`}>
                                                {rule.severity === 'critical' ? 'Crítica' : rule.severity === 'warning' ? 'Advertencia' : 'Info'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-2">{rule.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>
                                                {rule.operator === 'less_than' ? '<' : rule.operator === 'greater_than' ? '>' : '='} {rule.threshold} {rule.unit}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {rule.notifyEmail && <Mail className="w-3 h-3" />}
                                                {rule.notifyPush && <Smartphone className="w-3 h-3" />}
                                                {rule.notifySMS && <MessageSquare className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingRule(rule)}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleRule(rule.id)}
                                            className={`p-2 rounded-lg transition-colors ${rule.enabled ? 'text-green-400' : 'text-muted-foreground'}`}
                                        >
                                            {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2">
                        <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}

// Componente principal de Alertas
export function Alertas() {
    const [activeTab, setActiveTab] = useState<ViewTab>('alerts');
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
    const [configs, setConfigs] = useState<AlertTypeConfig[]>(alertTypesConfig);
    const [editingConfig, setEditingConfig] = useState<AlertTypeConfig | null>(null);

    // Filtros
    const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<AlertCategory | 'all'>('all');
    const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Contadores
    const activeCount = alerts.filter(a => a.status === 'active').length;
    const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
    const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

    // Alertas filtradas
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
            if (categoryFilter !== 'all' && alert.category !== categoryFilter) return false;
            if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
            if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !alert.plantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        }).sort((a, b) => {
            // Ordenar por estado (activas primero) y luego por fecha
            const statusOrder = { active: 0, acknowledged: 1, resolved: 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [alerts, statusFilter, categoryFilter, severityFilter, searchQuery]);

    // Handlers
    const handleAcknowledge = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? {
            ...a,
            status: 'acknowledged' as AlertStatus,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'Usuario Actual'
        } : a));
    };

    const handleResolve = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? {
            ...a,
            status: 'resolved' as AlertStatus,
            resolvedAt: new Date().toISOString(),
            resolvedBy: 'Usuario Actual'
        } : a));
    };

    const handleToggleCategory = (id: string) => {
        setConfigs(configs.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    };

    const handleSaveConfig = (updatedConfig: AlertTypeConfig) => {
        setConfigs(configs.map(c => c.id === updatedConfig.id ? updatedConfig : c));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                        <Bell className="w-7 h-7 text-primary" />
                        Centro de Alertas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona y configura todas las alertas del sistema de monitoreo solar
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'alerts' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Bell className="w-4 h-4" />
                            Alertas
                            {activeCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{activeCount}</span>
                            )}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Configuración
                        </span>
                    </button>
                </div>
            </div>

            {activeTab === 'alerts' ? (
                <>
                    {/* Resumen rápido */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-card border border-white/10 rounded-xl p-4">
                            <div className="text-3xl font-bold text-foreground">{alerts.length}</div>
                            <div className="text-sm text-muted-foreground">Total Alertas</div>
                        </div>
                        <div className="bg-card border border-red-500/30 rounded-xl p-4">
                            <div className="text-3xl font-bold text-red-400">{activeCount}</div>
                            <div className="text-sm text-muted-foreground">Activas</div>
                        </div>
                        <div className="bg-card border border-amber-500/30 rounded-xl p-4">
                            <div className="text-3xl font-bold text-amber-400">{acknowledgedCount}</div>
                            <div className="text-sm text-muted-foreground">Reconocidas</div>
                        </div>
                        <div className="bg-card border border-green-500/30 rounded-xl p-4">
                            <div className="text-3xl font-bold text-green-400">{resolvedCount}</div>
                            <div className="text-sm text-muted-foreground">Resueltas</div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-card border border-white/10 rounded-xl p-4 flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar alertas..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Activas</option>
                                <option value="acknowledged">Reconocidas</option>
                                <option value="resolved">Resueltas</option>
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value as any)}
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                            >
                                <option value="all">Todas las categorías</option>
                                {Object.entries(categoryNames).map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>

                            <select
                                value={severityFilter}
                                onChange={e => setSeverityFilter(e.target.value as any)}
                                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm"
                            >
                                <option value="all">Todas las severidades</option>
                                <option value="critical">Crítica</option>
                                <option value="warning">Advertencia</option>
                                <option value="info">Info</option>
                            </select>
                        </div>
                    </div>

                    {/* Lista de alertas */}
                    <div className="space-y-3">
                        {filteredAlerts.length === 0 ? (
                            <div className="bg-card border border-white/10 rounded-xl p-12 text-center">
                                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">No hay alertas</h3>
                                <p className="text-sm text-muted-foreground">
                                    No se encontraron alertas que coincidan con los filtros seleccionados.
                                </p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <AlertCard
                                    key={alert.id}
                                    alert={alert}
                                    onAcknowledge={handleAcknowledge}
                                    onResolve={handleResolve}
                                />
                            ))
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Configuración de categorías */}
                    <div className="bg-card border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Configuración de Tipos de Alertas
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Activa o desactiva categorías completas y personaliza las reglas de cada tipo de alerta.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {configs.map(config => (
                                <CategoryConfigCard
                                    key={config.id}
                                    config={config}
                                    onToggle={handleToggleCategory}
                                    onEditRules={setEditingConfig}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Notificaciones globales */}
                    <div className="bg-card border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Configuración de Notificaciones
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-blue-400" />
                                    <div>
                                        <div className="font-medium">Email</div>
                                        <div className="text-xs text-muted-foreground">jc@ascenergy.co</div>
                                    </div>
                                </div>
                                <ToggleRight className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-5 h-5 text-purple-400" />
                                    <div>
                                        <div className="font-medium">Push</div>
                                        <div className="text-xs text-muted-foreground">App móvil</div>
                                    </div>
                                </div>
                                <ToggleRight className="w-6 h-6 text-green-400" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="w-5 h-5 text-green-400" />
                                    <div>
                                        <div className="font-medium">SMS</div>
                                        <div className="text-xs text-muted-foreground">+57 300 XXX XXXX</div>
                                    </div>
                                </div>
                                <ToggleLeft className="w-6 h-6 text-muted-foreground" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal de edición de reglas */}
            {editingConfig && (
                <RuleEditorModal
                    config={editingConfig}
                    onClose={() => setEditingConfig(null)}
                    onSave={handleSaveConfig}
                />
            )}
        </div>
    );
}
