import { useState } from 'react';
import {
    User,
    Lock,
    Bell,
    Building,
    Mail,
    Smartphone,
    Shield,
    Key,
    Globe,
    Moon,
    Camera,
    LogOut,
    Save,
    Check,
    ChevronRight,
    Smartphone as SmartphoneIcon,
    Laptop
} from 'lucide-react';
import { useUser } from '@/context/UserContext';

// Tipos para las secciones
type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences' | 'company';

export function Settings() {
    const { user, updateUser } = useUser();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Estados para formularios inicializados con datos del contexto
    const [formData, setFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        phone: user.phone || '',
        company: user.company || 'ASC Energy',
        role: user.role || 'Administrador',
        language: 'es',
        timezone: 'America/Bogota',
        theme: 'system',
        notifications: {
            email_alerts: true,
            email_weekly: true,
            push_alerts: true,
            sms_critical: false
        }
    });

    const handleSave = () => {
        setLoading(true);

        // Actualizar estado global
        updateUser({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
        });

        // Simular API
        setTimeout(() => {
            setLoading(false);
            setSuccessMsg('Cambios guardados correctamente');
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 500);
    };

    const navItems = [
        { id: 'profile', label: 'Mi Perfil', icon: User, description: 'Datos personales y contacto' },
        { id: 'security', label: 'Seguridad', icon: Shield, description: 'Contraseña y 2FA' },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, description: 'Preferencias de contacto' },
        { id: 'preferences', label: 'Preferencias', icon: Globe, description: 'Idioma y hora' },
        { id: 'company', label: 'Empresa', icon: Building, description: 'Datos de la organización' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Configuración de la Cuenta</h1>
                <p className="text-muted-foreground">Gestiona tus datos personales y preferencias del sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Sidebar de Navegación */}
                <div className="md:col-span-3 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as SettingsTab)}
                                className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="flex-1">{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                            </button>
                        );
                    })}
                </div>

                {/* Contenido Principal */}
                <div className="md:col-span-9 space-y-6">

                    {/* ==============================================
              SECCIÓN: PERFIL
             ============================================== */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Tarjeta: Avatar */}
                            <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                                        {formData.firstName[0]}{formData.lastName[0]}
                                    </div>
                                    <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-center sm:text-left flex-1">
                                    <h3 className="text-lg font-medium text-foreground">Foto de Perfil</h3>
                                    <p className="text-sm text-muted-foreground mb-3">Esta imagen será visible para otros usuarios de la organización.</p>
                                    <div className="flex gap-2 justify-center sm:justify-start">
                                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm font-medium rounded-lg text-foreground transition-colors border border-white/10">
                                            Cambiar Foto
                                        </button>
                                        <button className="px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-lg transition-colors">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta: Información Personal */}
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Información Personal</h3>
                                    <p className="text-sm text-muted-foreground">Actualiza tus datos de contacto.</p>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Apellido</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Celular / Móvil</label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-white/5 flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Guardar Cambios</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==============================================
              SECCIÓN: SEGURIDAD
             ============================================== */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Cambio de Contraseña */}
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Cambiar Contraseña</h3>
                                    <p className="text-sm text-muted-foreground">Asegúrate de usar una contraseña robusta.</p>
                                </div>
                                <div className="p-6 space-y-4 max-w-lg">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Contraseña Actual</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••••••••" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nueva Contraseña</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••••••••" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Confirmar Nueva Contraseña</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                            <input type="password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="••••••••••••" />
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-white/5 flex justify-end">
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground font-medium rounded-lg transition-colors border border-white/10">
                                        Actualizar Contraseña
                                    </button>
                                </div>
                            </div>

                            {/* 2FA */}
                            <div className="bg-card border border-white/10 rounded-xl p-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-green-400" /> Autenticación de Dos Factores (2FA)
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Añade una capa extra de seguridad a tu cuenta. Recomendado.
                                    </p>
                                </div>
                                <button className="px-4 py-2 bg-primary/20 text-primary font-medium rounded-lg hover:bg-primary/30 transition-colors">
                                    Activar 2FA
                                </button>
                            </div>

                            {/* Sesiones Activas */}
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Dispositivos y Sesiones</h3>
                                    <p className="text-sm text-muted-foreground">Estos son los dispositivos donde has iniciado sesión recientemente.</p>
                                </div>
                                <div className="divide-y divide-white/10">
                                    <div className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                                <Laptop className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Macbook Pro - Chrome</p>
                                                <p className="text-xs text-muted-foreground">Cali, Colombia • Sesión Actual</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Activo</span>
                                    </div>
                                    <div className="p-6 flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                                                <SmartphoneIcon className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">iPhone 14 Pro - App</p>
                                                <p className="text-xs text-muted-foreground">Cali, Colombia • Hace 2 días</p>
                                            </div>
                                        </div>
                                        <button className="text-xs font-medium text-red-400 hover:text-red-300">Cerrar Sesión</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==============================================
              SECCIÓN: NOTIFICACIONES
             ============================================== */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Preferencias de Contacto</h3>
                                    <p className="text-sm text-muted-foreground">Elige cómo y cuándo quieres que te contactemos.</p>
                                </div>
                                <div className="p-6 space-y-6">

                                    {/* Grupo: Email */}
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" /> Correo Electrónico
                                        </h4>
                                        <div className="space-y-4">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="text-sm text-foreground">Alertas de Planta</p>
                                                    <p className="text-xs text-muted-foreground">Cuando una planta reporta fallas o baja generación.</p>
                                                </div>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked={true} />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="text-sm text-foreground">Resumen Semanal</p>
                                                    <p className="text-xs text-muted-foreground">Reporte consolidado de rendimiento financiero y energético.</p>
                                                </div>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked={true} />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="text-sm text-foreground">Nuevas Facturas</p>
                                                    <p className="text-xs text-muted-foreground">Notificar cuando esté disponible una nueva factura o cálculo de saldo.</p>
                                                </div>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked={true} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/10" />

                                    {/* Grupo: Push / SMS */}
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-primary" /> Móvil & SMS
                                        </h4>
                                        <div className="space-y-4">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="text-sm text-foreground">Notificaciones Push (App)</p>
                                                    <p className="text-xs text-muted-foreground">Alertas en tiempo real en tu dispositivo móvil.</p>
                                                </div>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked={true} />
                                            </label>
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div>
                                                    <p className="text-sm text-foreground">SMS Críticos</p>
                                                    <p className="text-xs text-muted-foreground">Solo para alertas de severidad crítica (Caída de sistema, Incendio, etc).</p>
                                                </div>
                                                <input type="checkbox" className="toggle toggle-primary" defaultChecked={false} />
                                            </label>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==============================================
              SECCIÓN: PREFERENCIAS
             ============================================== */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Configuración Regional</h3>
                                    <p className="text-sm text-muted-foreground">Ajusta el idioma calendario y formatos.</p>
                                </div>
                                <div className="p-6 space-y-6">

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Idioma</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <select className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                                                    <option value="es">Español (Latinoamérica)</option>
                                                    <option value="en">English (US)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">Zona Horaria</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <select className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                                                    <option value="America/Bogota">Bogotá (GMT-5)</option>
                                                    <option value="America/New_York">New York (GMT-5)</option>
                                                    <option value="UTC">UTC (GMT+0)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Tema de la Interfaz</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="border border-white/10 rounded-lg p-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors bg-opacity-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Moon className="w-4 h-4 text-primary" />
                                                    <span className="text-sm font-medium">Oscuro</span>
                                                </div>
                                                <div className="h-10 bg-gray-900 rounded border border-gray-700"></div>
                                            </div>
                                            <div className="border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-colors opacity-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-4 h-4 rounded-full border border-current"></div>
                                                    <span className="text-sm font-medium">Claro</span>
                                                </div>
                                                <div className="h-10 bg-gray-100 rounded border border-gray-200"></div>
                                            </div>
                                            <div className="border border-white/10 rounded-lg p-3 cursor-pointer hover:bg-white/5 transition-colors opacity-50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Laptop className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Sistema</span>
                                                </div>
                                                <div className="h-10 bg-gradient-to-r from-gray-900 to-gray-100 rounded border border-gray-500"></div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==============================================
              SECCIÓN: EMPRESA
             ============================================== */}
                    {activeTab === 'company' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
                                <div className="p-6 border-b border-white/10">
                                    <h3 className="font-semibold text-foreground">Detalles de la Organización</h3>
                                    <p className="text-sm text-muted-foreground">Información de facturación y legal.</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Nombre de la Empresa</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    disabled
                                                    value="ASC Energy S.A.S"
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-foreground opacity-70 cursor-not-allowed"
                                                />
                                            </div>
                                            <span className="px-3 py-2 bg-green-500/20 text-green-400 text-xs font-semibold rounded-lg flex items-center">
                                                VERIFICADA
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">NIT / Identificación Tributaria</label>
                                        <input
                                            type="text"
                                            value="900.123.456-7"
                                            disabled
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-foreground opacity-70 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mensaje de éxito flotante */}
                    {successMsg && (
                        <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in">
                            <Check className="w-5 h-5" />
                            {successMsg}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
// Icon aux
function Clock(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
