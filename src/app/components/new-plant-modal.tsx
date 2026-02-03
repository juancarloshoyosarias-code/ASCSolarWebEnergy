import { useState } from 'react';
import { X, Building2, DollarSign, Zap, Settings, FileText, Plus, Trash2, Upload, TrendingUp } from 'lucide-react';

interface NewPlantModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PanelConfig {
    id: string;
    model: string;
    power: string;
    count: string;
}

interface InverterConfig {
    id: string;
    model: string;
    power: string;
    count: string;
}

interface StringConfig {
    id: string;
    description: string;
}

export function NewPlantModal({ isOpen, onClose }: NewPlantModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'equipment' | 'technical' | 'projection' | 'documents'>('general');

    // Estados para paneles, inversores y strings dinámicos
    const [panels, setPanels] = useState<PanelConfig[]>([
        { id: '1', model: '', power: '', count: '' }
    ]);

    const [inverters, setInverters] = useState<InverterConfig[]>([
        { id: '1', model: '', power: '', count: '' }
    ]);

    const [stringConfigs, setStringConfigs] = useState<StringConfig[]>([
        { id: '1', description: '' }
    ]);

    const [documents, setDocuments] = useState<{
        technicalSheets: File[];
        certifications: File[];
        economicModel: File[];
        others: File[];
    }>({
        technicalSheets: [],
        certifications: [],
        economicModel: [],
        others: []
    });

    // Estados del formulario
    const [formData, setFormData] = useState({
        // Información General
        name: '',
        location: '',
        address: '',
        latitude: '',
        longitude: '',
        owner: '',
        commercialOperationDate: '',

        // Datos Financieros
        investment: '',
        // deduccionRenta y depreciacionAnual se calculan automáticamente
        paybackWithBenefits: '',
        paybackNoBenefits: '',
        expectedROI: '',

        // Crédito
        hasCredit: false,
        ownCapital: '',
        financedCapital: '',
        creditBank: '',
        creditRate: '',
        creditTerm: '',

        // Facturación
        utilityProvider: 'Celsia',
        utilityAccount: '',
        meterNumber: '',
        contractNumber: '',

        // Datos Técnicos
        // capacity se calculará automáticamente
        hspObjective: 'medio', // alto, medio, bajo
        prObjective: 'medio', // alto, medio, bajo
        availabilityTarget: '98',
        degradationRate: '0.5',
        panelLifespan: '25', // Vida útil paneles (años)

        // Proyección EPCista
        hpsEpcista: '', // HPS calculado por el EPCista para el proyecto

        // Comunicaciones y Monitoreo
        plantCode: '',
        communicationType: 'smartlogger',
        commModel: '',
        fusionsolarUser: '',
        fusionsolarPassword: '',
        apiUser: '',
        apiKey: '',

        // Estructura
        structureType: '',
        structureManufacturer: '',
        foundationType: 'micropilote', // micropilote, incado

        // Transformador
        transformerType: '',
        transformerBrand: '',
        transformerCapacity: '',
        tpsCount: '',
        tpcCount: '',

        // Notas
        notes: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Funciones para manejar paneles
    const addPanel = () => {
        setPanels([...panels, { id: Date.now().toString(), model: '', power: '', count: '' }]);
    };

    const removePanel = (id: string) => {
        if (panels.length > 1) {
            setPanels(panels.filter(p => p.id !== id));
        }
    };

    const updatePanel = (id: string, field: keyof PanelConfig, value: string) => {
        setPanels(panels.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    // Funciones para manejar inversores
    const addInverter = () => {
        setInverters([...inverters, { id: Date.now().toString(), model: '', power: '', count: '' }]);
    };

    const removeInverter = (id: string) => {
        if (inverters.length > 1) {
            setInverters(inverters.filter(i => i.id !== id));
        }
    };

    const updateInverter = (id: string, field: keyof InverterConfig, value: string) => {
        setInverters(inverters.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    // Funciones para manejar strings
    const addStringConfig = () => {
        setStringConfigs([...stringConfigs, { id: Date.now().toString(), description: '' }]);
    };

    const removeStringConfig = (id: string) => {
        if (stringConfigs.length > 1) {
            setStringConfigs(stringConfigs.filter(s => s.id !== id));
        }
    };

    const updateStringConfig = (id: string, value: string) => {
        setStringConfigs(stringConfigs.map(s => s.id === id ? { ...s, description: value } : s));
    };

    // Calcular capacidad total instalada
    const calculateCapacity = () => {
        const totalWp = panels.reduce((sum, panel) => {
            const power = parseFloat(panel.power) || 0;
            const count = parseFloat(panel.count) || 0;
            return sum + (power * count);
        }, 0);
        return (totalWp / 1000).toFixed(2); // Convertir a kWp
    };

    // Valores predefinidos para HPS y PR
    const hspOptions = {
        alto: '5.0',
        medio: '4.0',
        bajo: '3.5'
    };

    const prOptions = {
        alto: '90',
        medio: '85',
        bajo: '80'
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const plantData = {
            ...formData,
            capacity: calculateCapacity(),
            panels,
            inverters,
            stringConfigs,
            documents
        };
        console.log('Datos de nueva planta:', plantData);
        // Aquí iría la lógica para guardar la planta
        onClose();
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'financial', label: 'Financiero', icon: DollarSign },
        { id: 'equipment', label: 'Equipamiento', icon: Settings },
        { id: 'technical', label: 'Técnico', icon: Zap },
        { id: 'projection', label: 'Proyección EPCista', icon: TrendingUp },
        { id: 'documents', label: 'Documentos', icon: FileText },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-xl my-8">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Nueva Planta Solar</h2>
                        <p className="text-sm text-muted-foreground mt-1">Complete la información de la instalación</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-border px-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* Tab: General */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Nombre de la Planta <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej. Planta Solar Norte"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Propietario <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="owner"
                                        value={formData.owner}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Nombre del propietario"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Ubicación (Ciudad/Departamento) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej. Cali, Valle del Cauca"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">Dirección</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Dirección completa"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">Latitud</label>
                                    <input
                                        type="text"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleChange}
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej. 3.4516"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">Longitud</label>
                                    <input
                                        type="text"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Ej. -76.5320"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block text-foreground">
                                    Fecha de Operación Comercial <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="commercialOperationDate"
                                    value={formData.commercialOperationDate}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block text-foreground">Notas Generales</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Información adicional sobre la instalación..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab: Financial */}
                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <div className="bg-muted/30 rounded-xl p-4 mb-4">
                                <h3 className="text-sm font-semibold text-foreground mb-2">💡 Información</h3>
                                <p className="text-xs text-muted-foreground">
                                    La deducción de renta (50% de inversión) y depreciación acelerada (20% anual) se calculan automáticamente según Ley 1715.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Inversión Total (COP) <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="investment"
                                        value={formData.investment}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="400000000"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Deducción Renta 50% (COP)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.investment ? `$${(parseFloat(formData.investment) * 0.5).toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0'}
                                        readOnly
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Calculado automáticamente: 50% de la inversión</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Depreciación Anual (COP)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.investment ? `$${(parseFloat(formData.investment) * 0.2).toLocaleString('es-CO', { maximumFractionDigits: 0 })}` : '$0'}
                                        readOnly
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Calculado automáticamente: 20% anual (5 años)</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">ROI Esperado (%)</label>
                                    <input
                                        type="text"
                                        value="Calculado en Proyección"
                                        readOnly
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Ver pestaña Proyección EPCista</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Payback Con Beneficios (años)
                                    </label>
                                    <input
                                        type="text"
                                        value="Calculado en Proyección"
                                        readOnly
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Ver pestaña Proyección EPCista</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground">
                                        Payback Sin Beneficios (años)
                                    </label>
                                    <input
                                        type="text"
                                        value="Calculado en Proyección"
                                        readOnly
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Ver pestaña Proyección EPCista</p>
                                </div>
                            </div>

                            {/* Sección Crédito */}
                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        name="hasCredit"
                                        checked={formData.hasCredit}
                                        onChange={(e) => setFormData({ ...formData, hasCredit: e.target.checked })}
                                        className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary rounded"
                                    />
                                    <h3 className="text-sm font-semibold text-foreground">¿Se financia con crédito bancario?</h3>
                                </div>
                                {formData.hasCredit && (
                                    <div className="space-y-4 mt-4">
                                        {/* Distribución de Capital */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-foreground mb-3">Distribución de Capital</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block text-foreground">Capital Propio (COP)</label>
                                                    <input
                                                        type="number"
                                                        name="ownCapital"
                                                        value={formData.ownCapital}
                                                        onChange={handleChange}
                                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="200000000"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block text-foreground">Capital Financiado (COP)</label>
                                                    <input
                                                        type="number"
                                                        name="financedCapital"
                                                        value={formData.financedCapital}
                                                        onChange={handleChange}
                                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="200000000"
                                                    />
                                                </div>
                                            </div>
                                            {formData.investment && (formData.ownCapital || formData.financedCapital) && (
                                                <div className="mt-2 text-xs">
                                                    {(() => {
                                                        const total = parseFloat(formData.investment) || 0;
                                                        const own = parseFloat(formData.ownCapital) || 0;
                                                        const financed = parseFloat(formData.financedCapital) || 0;
                                                        const sum = own + financed;
                                                        const isValid = Math.abs(sum - total) < 1;
                                                        return isValid ? (
                                                            <p className="text-green-600 dark:text-green-400">✓ La suma coincide con la inversión total</p>
                                                        ) : (
                                                            <p className="text-destructive">⚠ La suma (${sum.toLocaleString('es-CO')}) debe ser igual a la inversión total (${total.toLocaleString('es-CO')})</p>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Datos del Crédito */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-foreground mb-3">Datos del Crédito Bancario</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block text-foreground">Banco</label>
                                                    <input
                                                        type="text"
                                                        name="creditBank"
                                                        value={formData.creditBank}
                                                        onChange={handleChange}
                                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Ej. Bancolombia"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block text-foreground">Tasa (%)</label>
                                                    <input
                                                        type="number"
                                                        name="creditRate"
                                                        value={formData.creditRate}
                                                        onChange={handleChange}
                                                        step="0.1"
                                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="12.5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block text-foreground">Plazo (años)</label>
                                                    <input
                                                        type="number"
                                                        name="creditTerm"
                                                        value={formData.creditTerm}
                                                        onChange={handleChange}
                                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Datos de Facturación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Proveedor Energía</label>
                                        <select
                                            name="utilityProvider"
                                            value={formData.utilityProvider}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="Celsia">Celsia</option>
                                            <option value="EPM">EPM</option>
                                            <option value="ESSA">ESSA</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Nº Cuenta</label>
                                        <input
                                            type="text"
                                            name="utilityAccount"
                                            value={formData.utilityAccount}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="1234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Nº Medidor</label>
                                        <input
                                            type="text"
                                            name="meterNumber"
                                            value={formData.meterNumber}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="ABC123456"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="text-sm font-medium mb-2 block text-foreground">Nº Contrato</label>
                                    <input
                                        type="text"
                                        name="contractNumber"
                                        value={formData.contractNumber}
                                        onChange={handleChange}
                                        className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="Número del contrato de instalación"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Technical */}
                    {activeTab === 'technical' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Capacidad Instalada</h3>
                                <p className="text-2xl font-bold text-foreground">{calculateCapacity()} kWp</p>
                                <p className="text-xs text-muted-foreground mt-1">Calculado automáticamente desde Equipamiento</p>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Configuración de Strings</h3>
                                <div className="space-y-2">
                                    {stringConfigs.map((config, index) => (
                                        <div key={config.id} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={config.description}
                                                onChange={(e) => updateStringConfig(config.id, e.target.value)}
                                                className="flex-1 border border-border rounded-xl px-4 py-2 bg-background focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                                                placeholder={`Configuración ${index + 1} (ej: 10 strings x 20 paneles)`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeStringConfig(config.id)}
                                                disabled={stringConfigs.length === 1}
                                                className="p-2 hover:bg-destructive/10 text-destructive rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addStringConfig}
                                        className="w-full border-2 border-dashed border-border hover:border-primary rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Configuración
                                    </button>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Parámetros Operacionales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            HPS Objetivo (h/día)
                                        </label>
                                        <select
                                            name="hspObjective"
                                            value={formData.hspObjective}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="alto">Alto (5.0 h/día)</option>
                                            <option value="medio">Medio (4.0 h/día)</option>
                                            <option value="bajo">Bajo (3.5 h/día)</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Actual: {hspOptions[formData.hspObjective as keyof typeof hspOptions]} h/día
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            PR Objetivo (%)
                                        </label>
                                        <select
                                            name="prObjective"
                                            value={formData.prObjective}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="alto">Alto (90%)</option>
                                            <option value="medio">Medio (85%)</option>
                                            <option value="bajo">Bajo (80%)</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Actual: {prOptions[formData.prObjective as keyof typeof prOptions]}%
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Disponibilidad (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="availabilityTarget"
                                            value={formData.availabilityTarget}
                                            onChange={handleChange}
                                            step="0.1"
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="98.0"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Target: 95-99%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Tasa Degradación (%/año)
                                        </label>
                                        <input
                                            type="number"
                                            name="degradationRate"
                                            value={formData.degradationRate}
                                            onChange={handleChange}
                                            step="0.1"
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="0.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Vida Útil Paneles (años)
                                        </label>
                                        <input
                                            type="number"
                                            name="panelLifespan"
                                            value={formData.panelLifespan}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="25"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Típico: 25-30 años</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Comunicaciones y Monitoreo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Código Planta FusionSolar
                                        </label>
                                        <input
                                            type="text"
                                            name="plantCode"
                                            value={formData.plantCode}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="NE=XXXXXXXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Tipo de Comunicación
                                        </label>
                                        <select
                                            name="communicationType"
                                            value={formData.communicationType}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="smartlogger">SmartLogger</option>
                                            <option value="dongle">Dongle WLAN</option>
                                            <option value="logger">Logger 1000</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Modelo Comunicaciones</label>
                                        <input
                                            type="text"
                                            name="commModel"
                                            value={formData.commModel}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="SmartLogger 3000A"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Usuario FusionSolar</label>
                                        <input
                                            type="text"
                                            name="fusionsolarUser"
                                            value={formData.fusionsolarUser}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="usuario@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Contraseña FusionSolar</label>
                                        <input
                                            type="password"
                                            name="fusionsolarPassword"
                                            value={formData.fusionsolarPassword}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Usuario API</label>
                                        <input
                                            type="text"
                                            name="apiUser"
                                            value={formData.apiUser}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="api_user"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Clave API</label>
                                        <input
                                            type="password"
                                            name="apiKey"
                                            value={formData.apiKey}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="••••••••••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Equipment */}
                    {activeTab === 'equipment' && (
                        <div className="space-y-6">
                            {/* Paneles Solares */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">⚡ Paneles Solares</h3>
                                <div className="space-y-3">
                                    {panels.map((panel, index) => (
                                        <div key={panel.id} className="bg-background rounded-lg p-3 border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-muted-foreground">Panel {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removePanel(panel.id)}
                                                    disabled={panels.length === 1}
                                                    className="p-1 hover:bg-destructive/10 text-destructive rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={panel.model}
                                                        onChange={(e) => updatePanel(panel.id, 'model', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Modelo (ej: Jinko Tiger Neo 585W)"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={panel.power}
                                                        onChange={(e) => updatePanel(panel.id, 'power', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Potencia (W)"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={panel.count}
                                                        onChange={(e) => updatePanel(panel.id, 'count', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Cantidad"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addPanel}
                                        className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Tipo de Panel
                                    </button>
                                </div>
                            </div>

                            {/* Inversores */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">🔌 Inversores</h3>
                                <div className="space-y-3">
                                    {inverters.map((inverter, index) => (
                                        <div key={inverter.id} className="bg-background rounded-lg p-3 border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-muted-foreground">Inversor {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeInverter(inverter.id)}
                                                    disabled={inverters.length === 1}
                                                    className="p-1 hover:bg-destructive/10 text-destructive rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={inverter.model}
                                                        onChange={(e) => updateInverter(inverter.id, 'model', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Modelo"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={inverter.power}
                                                        onChange={(e) => updateInverter(inverter.id, 'power', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Potencia (kW)"
                                                        required
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        value={inverter.count}
                                                        onChange={(e) => updateInverter(inverter.id, 'count', e.target.value)}
                                                        className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                                                        placeholder="Cantidad"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addInverter}
                                        className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Agregar Inversor
                                    </button>
                                </div>
                            </div>

                            {/* Estructura */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">🏗️ Estructura y Cimentación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Tipo de Estructura</label>
                                        <input
                                            type="text"
                                            name="structureType"
                                            value={formData.structureType}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="Ej: Fija a suelo, Carport, Techo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Fabricante Estructura</label>
                                        <input
                                            type="text"
                                            name="structureManufacturer"
                                            value={formData.structureManufacturer}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="Nombre del fabricante"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Tipo de Cimentación</label>
                                        <select
                                            name="foundationType"
                                            value={formData.foundationType}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        >
                                            <option value="micropilote">Micropilote</option>
                                            <option value="incado">Incado Directo</option>
                                            <option value="zapata">Zapata de Concreto</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Transformador */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">⚡ Transformador</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Tipo</label>
                                        <input
                                            type="text"
                                            name="transformerType"
                                            value={formData.transformerType}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="Ej: Trifásico"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Marca</label>
                                        <input
                                            type="text"
                                            name="transformerBrand"
                                            value={formData.transformerBrand}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="Marca del transformador"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Capacidad (kVA)</label>
                                        <input
                                            type="number"
                                            name="transformerCapacity"
                                            value={formData.transformerCapacity}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Nº TPS (Transformadores de Potencia)</label>
                                        <input
                                            type="number"
                                            name="tpsCount"
                                            value={formData.tpsCount}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">Nº TPC (Transformadores de Corriente)</label>
                                        <input
                                            type="number"
                                            name="tpcCount"
                                            value={formData.tpcCount}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Resumen Técnico */}
                            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Resumen Técnico</h3>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="text-muted-foreground">Potencia Total DC:</span>
                                        <span className="ml-2 font-semibold text-foreground">{calculateCapacity()} kWp</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total Paneles:</span>
                                        <span className="ml-2 font-semibold text-foreground">
                                            {panels.reduce((sum, p) => sum + (parseFloat(p.count) || 0), 0)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Potencia Inversores:</span>
                                        <span className="ml-2 font-semibold text-foreground">
                                            {inverters.reduce((sum, i) => sum + ((parseFloat(i.power) || 0) * (parseFloat(i.count) || 0)), 0).toFixed(2)} kW
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total Inversores:</span>
                                        <span className="ml-2 font-semibold text-foreground">
                                            {inverters.reduce((sum, i) => sum + (parseFloat(i.count) || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Projection EPCista */}
                    {activeTab === 'projection' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 mb-4">
                                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">📊 Proyección de Generación EPCista</h3>
                                <p className="text-xs text-green-800 dark:text-green-200">
                                    Configure los parámetros del EPCista para calcular la proyección de generación año a año considerando la degradación de los paneles.
                                </p>
                            </div>

                            {/* Parámetros de Proyección */}
                            <div className="bg-muted/30 rounded-xl p-4">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Parámetros del EPCista</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Capacidad Instalada (kWp)
                                        </label>
                                        <input
                                            type="text"
                                            value={calculateCapacity()}
                                            readOnly
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-muted text-muted-foreground cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Desde Equipamiento</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            HPS EPCista (h/día) <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="hpsEpcista"
                                            value={formData.hpsEpcista}
                                            onChange={handleChange}
                                            step="0.01"
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="4.5"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Horas Pico Solar calculadas</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Degradación (%/año)
                                        </label>
                                        <input
                                            type="number"
                                            name="degradationRate"
                                            value={formData.degradationRate}
                                            onChange={handleChange}
                                            step="0.1"
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="0.5"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Típico: 0.4-0.7%</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-foreground">
                                            Vida Útil (años)
                                        </label>
                                        <input
                                            type="number"
                                            name="panelLifespan"
                                            value={formData.panelLifespan}
                                            onChange={handleChange}
                                            className="w-full border border-border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                            placeholder="25"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Típico: 25-30 años</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de Proyección */}
                            {formData.hpsEpcista && parseFloat(calculateCapacity()) > 0 && (
                                <div className="bg-muted/30 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-foreground mb-3">📈 Proyección de Generación Anual</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Año</th>
                                                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Factor Degradación</th>
                                                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Generación Esperada (kWh/año)</th>
                                                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">Generación Diaria (kWh)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(() => {
                                                    const capacity = parseFloat(calculateCapacity()) || 0;
                                                    const hps = parseFloat(formData.hpsEpcista) || 0;
                                                    const degradation = parseFloat(formData.degradationRate) || 0.5;
                                                    const lifespan = parseInt(formData.panelLifespan) || 25;

                                                    // Generación año 1 = Capacidad * HPS * 365 días
                                                    const genYear1 = capacity * hps * 365;

                                                    const rows = [];
                                                    for (let year = 1; year <= Math.min(lifespan, 30); year++) {
                                                        // Factor de degradación acumulado
                                                        const factor = Math.pow(1 - degradation / 100, year - 1);
                                                        const genYear = genYear1 * factor;
                                                        const genDaily = genYear / 365;

                                                        rows.push(
                                                            <tr key={year} className={`border-b border-border/50 ${year === 1 ? 'bg-primary/5' : ''}`}>
                                                                <td className="py-2 px-3 font-medium">{year}</td>
                                                                <td className="py-2 px-3 text-right">{(factor * 100).toFixed(2)}%</td>
                                                                <td className="py-2 px-3 text-right font-semibold">{genYear.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</td>
                                                                <td className="py-2 px-3 text-right">{genDaily.toFixed(1)}</td>
                                                            </tr>
                                                        );
                                                    }
                                                    return rows;
                                                })()}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-primary/10 font-semibold">
                                                    <td className="py-2 px-3">TOTAL</td>
                                                    <td className="py-2 px-3 text-right">-</td>
                                                    <td className="py-2 px-3 text-right">
                                                        {(() => {
                                                            const capacity = parseFloat(calculateCapacity()) || 0;
                                                            const hps = parseFloat(formData.hpsEpcista) || 0;
                                                            const degradation = parseFloat(formData.degradationRate) || 0.5;
                                                            const lifespan = parseInt(formData.panelLifespan) || 25;
                                                            const genYear1 = capacity * hps * 365;

                                                            let total = 0;
                                                            for (let year = 1; year <= Math.min(lifespan, 30); year++) {
                                                                const factor = Math.pow(1 - degradation / 100, year - 1);
                                                                total += genYear1 * factor;
                                                            }
                                                            return total.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' kWh';
                                                        })()}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">-</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Mensaje si faltan datos */}
                            {(!formData.hpsEpcista || parseFloat(calculateCapacity()) === 0) && (
                                <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
                                    <p className="text-sm text-amber-900 dark:text-amber-100">
                                        ⚠️ Complete la <strong>Capacidad</strong> (en Equipamiento) y el <strong>HPS EPCista</strong> para ver la proyección.
                                    </p>
                                </div>
                            )}

                            {/* Resumen Financiero Proyectado */}
                            {formData.hpsEpcista && parseFloat(calculateCapacity()) > 0 && formData.investment && (
                                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">💰 Resumen Proyectado</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {(() => {
                                            const capacity = parseFloat(calculateCapacity()) || 0;
                                            const hps = parseFloat(formData.hpsEpcista) || 0;
                                            const investment = parseFloat(formData.investment) || 0;
                                            const genYear1 = capacity * hps * 365;

                                            // Precio promedio kWh (estimado)
                                            const precioKwh = 800; // COP/kWh
                                            const ahorroAnual = genYear1 * precioKwh;
                                            const paybackSimple = investment / ahorroAnual;
                                            const roiAnual = (ahorroAnual / investment) * 100;

                                            return (
                                                <>
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">Gen. Año 1</p>
                                                        <p className="text-lg font-bold text-foreground">{(genYear1 / 1000).toFixed(1)} MWh</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">Ahorro Anual Est.</p>
                                                        <p className="text-lg font-bold text-green-600">${(ahorroAnual / 1000000).toFixed(1)}M</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">Payback Simple</p>
                                                        <p className="text-lg font-bold text-foreground">{paybackSimple.toFixed(1)} años</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">ROI Anual</p>
                                                        <p className="text-lg font-bold text-primary">{roiAnual.toFixed(1)}%</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3 text-center">
                                        * Estimado con precio promedio de $800 COP/kWh. Los valores reales dependen de la tarifa de energía.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Documents */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="bg-muted/30 rounded-xl p-4 mb-4">
                                <h3 className="text-sm font-semibold text-foreground mb-2">📁 Documentación</h3>
                                <p className="text-xs text-muted-foreground">
                                    Suba fichas técnicas, certificaciones, modelos económicos y otros documentos relevantes. Formatos admitidos: PDF, DOC, XLSX, IMG.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Fichas Técnicas */}
                                <div className="border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-primary" />
                                        <h4 className="text-sm font-semibold text-foreground">Fichas Técnicas</h4>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Paneles, inversores, estructuras, etc.</p>
                                </div>

                                {/* Certificaciones */}
                                <div className="border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <FileText className="w-4 h-4 text-green-600" />
                                        <h4 className="text-sm font-semibold text-foreground">Certificaciones</h4>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">RETIE, ISO, garantías, etc.</p>
                                </div>

                                {/* Modelo Económico */}
                                <div className="border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-4 h-4 text-amber-600" />
                                        <h4 className="text-sm font-semibold text-foreground">Modelo Económico</h4>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Propuesta comercial del especialista</p>
                                </div>

                                {/* Otros Documentos */}
                                <div className="border border-border rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Upload className="w-4 h-4 text-blue-600" />
                                        <h4 className="text-sm font-semibold text-foreground">Otros Documentos</h4>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">Contratos, planos, permisos, etc.</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4">
                                <p className="text-xs text-amber-900 dark:text-amber-100">
                                    💡 <strong>Nota:</strong> Los documentos serán almacenados de forma segura y podrán ser consultados en cualquier momento desde el detalle de la planta.
                                </p>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                        <span className="text-destructive">*</span> Campos obligatorios
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium hover:bg-muted rounded-xl border border-border transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Crear Planta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
