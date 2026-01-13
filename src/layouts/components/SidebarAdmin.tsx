import React from 'react';
import {
  LayoutDashboard,
  Upload,
  CheckSquare,
  FileText,
  PieChart,
  LogOut,
  Settings,
  Users,
  UsersRound ,
  ShieldUser ,
  FolderKey 
} from 'lucide-react';
import { Page } from '../../../types';

interface SidebarAdminProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DRAWER_WIDTH = 280;

const menuItems = [
  {
    section: 'Management',
    items: [
      { page: Page.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { page: Page.ADMIN_IMPORT_EMPLOYEES, label: 'Import Nhân viên', icon: Upload },
      { page: Page.ADMIN_IMPORT_PROJECTS, label: 'Import Dự án', icon: Upload },
      { page: Page.ADMIN_TASKS, label: 'Quản lý Task', icon: CheckSquare },
  
    ],
  },
  {
    section: 'Cấu hình',
    items: [
      { page: Page.ADMIN_EMPLOYEES, label: 'Quản lý nhân viên', icon: Users },
      { page: Page.ADMIN_DEPARTMENTS, label: 'Quản lý Phòng ban', icon: UsersRound  },
      { page: Page.ADMIN_POSITIONS, label: 'Quản lý Chức vụ', icon: ShieldUser  },
      { page: Page.ADMIN_PROJECTS, label: 'Quản lý Dự án', icon: FolderKey  },
    ],
  },
  {
    section: 'Báo cáo',
    items: [
      { page: Page.ADMIN_REPORT_TASK, label: 'Báo cáo theo Task', icon: FileText },
      { page: Page.ADMIN_REPORT_USER, label: 'Báo cáo theo Nhân sự', icon: PieChart },
    ],
  },
];

export const SidebarAdmin: React.FC<SidebarAdminProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}) => {
  const handleNavClick = (page: Page) => {
    onNavigate(page);
    onMobileClose?.();
  };

  const drawerContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">CHECK RACI</div>
            <div className="text-xs uppercase font-semibold text-slate-500 tracking-wider">Admin</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-4">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-4 py-2 text-xs uppercase font-bold text-slate-500 tracking-wider">
              {section.section}
            </div>
            <nav className="space-y-1">
              {section.items.map(({ page, label, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => handleNavClick(page)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === page
                      ? 'menu-item-active'
                      : 'text-slate-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="px-2 py-3 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 w-sidebar bg-white border-r border-gray-200 z-sidebar md:hidden overflow-y-auto"
        >
          {drawerContent}
        </div>
      )}

      <div
        className="hidden md:block w-sidebar flex-shrink-0 border-r border-gray-200 bg-white"
      >
        {drawerContent}
      </div>
    </>
  );
};
