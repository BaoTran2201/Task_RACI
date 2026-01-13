import React, { useState } from 'react';
import { Page, Employee, Project, Task, RaciMatrix } from '../../types';
import { Topbar } from './components/Topbar';
import { SidebarUser } from './components/SidebarUser';
import { MobileHeader } from './components/MobileHeader';

interface UserLayoutProps {
  currentUser: Employee | null;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
  demoMode?: boolean;
  onResetDemo?: () => void;
}

export const UserLayout: React.FC<UserLayoutProps> = ({
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
      <SidebarUser
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
          userRole="user"
          currentPage={currentPage}
          onLogout={onLogout}
          showSearch={false}
          demoMode={demoMode}
          onResetDemo={onResetDemo}
        />

        <main className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-10">
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
