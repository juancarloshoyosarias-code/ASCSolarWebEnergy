import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { mockAlerts } from '@/data/mockData';

export function Layout() {
  const alertCount = mockAlerts.filter(a => a.status === 'active').length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar alertCount={alertCount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header alertCount={alertCount} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
