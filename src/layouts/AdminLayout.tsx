import React, { useState } from 'react';
import { Page, Employee, Project, Task, RaciMatrix, UserRole } from '../../types';
import { Topbar } from './components/Topbar';
import { SidebarAdmin } from './components/SidebarAdmin';
import { MobileHeader } from './components/MobileHeader';

interface AdminLayoutProps {
  currentUser: Employee | null;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
  demoMode?: boolean;
  onResetDemo?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  currentPage,
  onPageChange,
  onLogout,
  children,
  demoMode = false,
  onResetDemo,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarAdmin
        currentPage={currentPage}
        onNavigate={onPageChange}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1">
        <MobileHeader
          onMenuOpen={() => setMobileMenuOpen(true)}
          onLogout={onLogout}
        />

        <Topbar
          currentUser={currentUser}
          userRole="admin"
          currentPage={currentPage}
          onLogout={onLogout}
          showSearch={true}
          demoMode={demoMode}
          onResetDemo={onResetDemo}
        />

        <main className="flex-1 overflow-auto w-full bg-slate-50 px-4 py-6 md:px-6 md:py-8 xl:px-8">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-overlay md:hidden"
        />
      )}
    </div>
  );
};
