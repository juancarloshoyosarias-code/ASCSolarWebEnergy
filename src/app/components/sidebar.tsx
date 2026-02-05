import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  TrendingUp,
  Bell,
  Settings,
  ChevronLeft,
  Receipt,
  Wallet,
  Scale // Icono para Diferencias OR
} from 'lucide-react';
import { useState } from 'react';
import { mockUser } from '@/data/mockData'; // Importar mockUser

interface SidebarProps {
  alertCount?: number;
  onNavigate?: () => void;
}

export function Sidebar({ alertCount = 0, onNavigate }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Obtener iniciales del usuario
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userInitials = getInitials(mockUser.name);

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/plantas', icon: Sun, label: 'Mis Plantas' },
    { path: '/financiero', icon: TrendingUp, label: 'Análisis Financiero' },
    { path: '/costos', icon: Wallet, label: 'Costos Operativos' },
    { path: '/facturas', icon: Receipt, label: 'Facturas' },
    { path: '/diferencias-or', icon: Scale, label: 'Diferencias vs OR' },
    { path: '/alertas', icon: Bell, label: 'Alertas', badge: alertCount },
    { path: '/configuracion', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div
      className={`bg-sidebar h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <Sun className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">ASC Solar</h1>
              <p className="text-xs text-sidebar-foreground/70">Control y Seguimiento Solar</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors relative ${isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-sidebar-primary-foreground">{userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{mockUser.name}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">Dueño de planta</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-primary-foreground">{userInitials}</span>
            </div>
          </div>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-sidebar-accent border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-primary transition-colors"
      >
        <ChevronLeft className={`w-4 h-4 text-sidebar-foreground transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
}
