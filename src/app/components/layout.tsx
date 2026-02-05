import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { mockAlerts } from '@/data/mockData';
import { useIsMobile } from './ui/use-mobile';

export function Layout() {
  const alertCount = mockAlerts.filter(a => a.status === 'active').length;
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay para móvil */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile
          ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative'
        }
      `}>
        <Sidebar
          alertCount={alertCount}
          onNavigate={() => isMobile && setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          alertCount={alertCount}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={isMobile}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
